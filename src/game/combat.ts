import { CONFIG } from '../config';
import { CLASSES } from '../data/classes';
import { ITEMS, QUALITY } from '../data/items';
import { LAYERS, SURFACE_ID } from '../data/layers';
import type { Game, MobDef, MobInstance, Player, Stats } from '../types';
import { systemChat } from '../ui/chat';
import { log } from '../ui/log';
import { chance, randFloat, randInt } from '../util';
import { emit } from './events';
import { gazeDropMult, registerAttackClick } from './gaze';
import { mineTick, onMineBossKilled, rollPortal } from './mines';
import { addItem, berserkMult, currentLayer, expToNext, getStats, rollQuality } from './state';
import { spawnLayer } from './travel';

const CLICK_COOLDOWN_MS = 110;
const DEATH_GOLD_LOSS = 0.1;
const PORTAL_TTL_MS = 30_000;

export function findMob(g: Game, uid: number | null): MobInstance | null {
  if (uid === null) return null;
  if (g.mine?.boss.uid === uid) return g.mine.boss;
  return g.mobs.find((m) => m.uid === uid) ?? null;
}

export function targetMob(g: Game): MobInstance | null {
  const m = findMob(g, g.targetUid);
  return m && m.hp > 0 ? m : null;
}

export function mitigate(raw: number, def: number): number {
  return (raw * 60) / (60 + def);
}

function heal(p: Player, s: Stats, amount: number): number {
  const before = p.hp;
  p.hp = Math.min(s.hp, p.hp + Math.round(amount));
  return p.hp - before;
}

function engage(g: Game, mob: MobInstance, now: number): void {
  if (g.targetUid !== mob.uid) {
    g.targetUid = mob.uid;
    if (g.mine?.boss !== mob) mob.nextAttackAt = Math.max(mob.nextAttackAt, now + mob.def.attackMs * 0.6);
  }
  g.viewUid = mob.uid;
  g.lastCombatAt = now;
}

export function attack(g: Game, uid: number, trusted = true): void {
  const now = Date.now();
  if (now - g.lastClickAt < CLICK_COOLDOWN_MS) return;
  g.lastClickAt = now;
  if (g.player.hp <= 0) return;
  const mob = findMob(g, uid);
  if (!mob || mob.hp <= 0) return;
  registerAttackClick(g, now, trusted);
  engage(g, mob, now);
  strike(g, mob, {}, null);
}

interface StrikeOpts {
  mult?: number;
  ignoreDef?: boolean;
  forceCrit?: boolean;
  lifestealPct?: number;
}

function strike(g: Game, mob: MobInstance, opts: StrikeOpts, label: string | null): void {
  const p = g.player;
  const s = getStats(p);
  const passive = CLASSES[p.classId].passive;

  let raw = s.atk * randFloat(0.85, 1.15) * (opts.mult ?? 1);
  if (passive.berserk) raw *= berserkMult(p, s);
  const crit = opts.forceCrit || chance(s.crit);
  if (crit) raw *= passive.critMult ?? 1.8;
  const def = opts.ignoreDef ? 0 : mob.def.def * (1 - (passive.armorPen ?? 0));
  const dmg = Math.min(mob.hp, Math.max(1, Math.round(mitigate(raw, def))));

  mob.hp -= dmg;
  if (g.mine?.boss === mob) g.mine.playerDmg += dmg;
  emit('mobHit', { uid: mob.uid, dmg, crit });
  const prefix = label ? `[${label}] ` : '';
  log(`${prefix}${crit ? 'КРИТ! ' : ''}Вы наносите ${dmg} урона → ${mob.def.name}`, crit ? 'crit' : label ? 'skill' : 'hit');

  const lifesteal = (opts.lifestealPct ?? 0) + (passive.lifestealPct ?? 0);
  if (lifesteal > 0) heal(p, s, dmg * lifesteal);

  if (mob.hp > 0 && passive.stunChance && chance(passive.stunChance)) {
    mob.stunnedUntil = Math.max(mob.stunnedUntil, Date.now() + 1000);
    log(`Психо-импульс оглушает: ${mob.def.name}`, 'skill');
  }

  if (mob.hp <= 0) killMob(g, mob);
}

function expFor(p: Player, d: MobDef): number {
  const gap = p.level - d.level;
  if (gap >= 8) return Math.max(1, Math.round(d.exp * 0.1));
  if (gap >= 5) return Math.round(d.exp * 0.5);
  return d.exp;
}

export function grantLoot(g: Game, id: string, n: number, luck = 0): void {
  const p = g.player;
  const item = ITEMS[id];
  const quality = item.kind === 'equipment' ? rollQuality(luck) : undefined;
  if (!addItem(p, id, n, quality)) {
    log(`Инвентарь полон: «${item.name}» остаётся лежать в пепле.`, 'danger');
    return;
  }
  g.inventoryDirty = true;
  const rare = item.rarity === 'rare' || item.rarity === 'epic' || quality === 'relic';
  const qualityLabel = quality && quality !== 'common' ? ` [${QUALITY[quality].name.toLowerCase()}]` : '';
  log(`Добыча: ${item.name}${qualityLabel}${n > 1 ? ` ×${n}` : ''}`, item.kind === 'trash' ? 'trash' : rare ? 'rare' : 'loot');
  if (item.rarity === 'epic' || quality === 'relic') systemChat(`${p.name} добыл «${item.name}»${qualityLabel} (${currentLayer(g).short})!`, 'good');
}

function killMob(g: Game, mob: MobInstance): void {
  if (g.mine?.boss === mob) {
    onMineBossKilled(g);
    return;
  }
  const p = g.player;
  const d = mob.def;
  const now = Date.now();
  mob.hp = 0;
  mob.respawnAt = now + d.respawnMs;
  mob.stunnedUntil = 0;
  mob.nextAttackAt = 0;
  if (d.miniBoss) p.bossRespawns[d.id] = mob.respawnAt;
  if (g.targetUid === mob.uid) g.targetUid = null;

  p.kills++;
  const gold = randInt(d.gold[0], d.gold[1]);
  const exp = expFor(p, d);
  p.gold += gold;
  log(`${d.name} повержен. +${exp} опыта, +${gold} золота.`, 'system');

  for (const entry of d.loot) {
    const kind = ITEMS[entry.item].kind;
    const boost = kind === 'equipment' || kind === 'chip' ? CONFIG.gearDropBoost : 1;
    if (!chance(Math.min(1, entry.chance * boost) * gazeDropMult(g))) continue;
    grantLoot(g, entry.item, randInt(entry.min ?? 1, entry.max ?? 1), d.miniBoss ? 1 : 0);
  }

  if (d.miniBoss) systemChat(`${p.name} одолел мини-босса «${d.name}» (${currentLayer(g).short}).`, 'good');
  gainExp(g, exp);
  if (!d.miniBoss) rollPortal(g, now, PORTAL_TTL_MS);
}

export function gainExp(g: Game, amount: number): void {
  const p = g.player;
  p.exp += amount;
  while (p.exp >= expToNext(p.level)) {
    p.exp -= expToNext(p.level);
    p.level++;
    const s = getStats(p);
    p.hp = s.hp;
    p.mp = s.mp;
    log(`Уровень повышен! Теперь у вас ${p.level} уровень.`, 'level');
    const unlocked = LAYERS.find((l) => l.minLevel === p.level && l.id > 1);
    if (unlocked) log(`Открыт спуск: ${unlocked.name}.`, 'level');
    if (p.level % 5 === 0) systemChat(`${p.name} достиг ${p.level} уровня.`, 'good');
  }
}

export function damagePlayer(g: Game, rawAtk: number, source: MobInstance): number {
  const p = g.player;
  const s = getStats(p);
  const dmg = Math.max(1, Math.round(mitigate(rawAtk * randFloat(0.85, 1.15), s.def)));
  p.hp = Math.max(0, p.hp - dmg);
  emit('playerHit', { dmg });
  log(`${source.def.name} наносит вам ${dmg} урона.`, 'mob');
  if (p.hp <= 0) {
    playerDeath(g, source);
    return dmg;
  }
  const reflect = CLASSES[p.classId].passive.reflectPct;
  if (reflect && source.hp > 0) {
    const r = Math.min(source.hp, Math.max(1, Math.round(dmg * reflect)));
    source.hp -= r;
    if (g.mine?.boss === source) g.mine.playerDmg += r;
    log(`Пластины отражают ${r} урона.`, 'skill');
    if (source.hp <= 0) killMob(g, source);
  }
  return dmg;
}

function playerDeath(g: Game, killer: MobInstance): void {
  const p = g.player;
  const s = getStats(p);
  const lost = Math.floor(p.gold * DEATH_GOLD_LOSS);
  p.deaths++;
  p.gold -= lost;
  p.hp = Math.round(s.hp * 0.3);
  p.mp = Math.round(s.mp * 0.3);
  log(`Вы погибли. Убийца: ${killer.def.name}. Потеряно ${lost} золота.`, 'danger');
  g.mine = null;
  g.portal = null;
  p.layer = SURFACE_ID;
  spawnLayer(g);
  log('Курьеры Кардиналов подняли ваше тело на поверхность. Счёт выставлен.', 'danger');
}

// ---------- Навыки ----------

export function useSkill(g: Game, index: number): void {
  const p = g.player;
  const skill = CLASSES[p.classId].skills[index];
  const now = Date.now();
  if (!skill || p.hp <= 0) return;
  if ((g.cooldowns[skill.id] ?? 0) > now) return;
  if (p.mp < skill.mpCost) {
    log(`Не хватает энергии для «${skill.name}».`, 'danger');
    return;
  }
  const mob = targetMob(g);
  if (skill.requiresTarget && !mob) {
    log('Нет цели. Сначала атакуйте кого-нибудь.', 'danger');
    return;
  }

  p.mp -= skill.mpCost;
  g.cooldowns[skill.id] = now + skill.cooldownMs;
  const e = skill.effect;
  const s = getStats(p);

  if (e.selfDamagePct) {
    const burn = Math.round(s.hp * e.selfDamagePct);
    p.hp = Math.max(1, p.hp - burn);
    log(`[${skill.name}] Вы сжигаете ${burn} HP.`, 'danger');
  }
  if (e.healPct) {
    const healed = heal(p, s, s.hp * e.healPct);
    log(`[${skill.name}] Восстановлено ${healed} HP.`, 'skill');
  }

  const hits = e.hits ?? (e.mult ? 1 : 0);
  if (mob && (hits > 0 || e.stunMs)) {
    engage(g, mob, now);
    for (let i = 0; i < hits && mob.hp > 0; i++) {
      strike(g, mob, { mult: e.mult, ignoreDef: e.ignoreDef, forceCrit: e.forceCrit, lifestealPct: e.lifestealPct }, skill.name);
    }
    if (e.stunMs && mob.hp > 0) {
      mob.stunnedUntil = Math.max(mob.stunnedUntil, now + e.stunMs);
      log(`[${skill.name}] ${mob.def.name} оглушён на ${e.stunMs / 1000} с.`, 'skill');
    }
  }
}

// ---------- Тик мира ----------

export function tick(g: Game, now: number): void {
  const p = g.player;
  const s = getStats(p);

  for (const m of g.mobs) {
    if (m.hp <= 0 && m.respawnAt !== null && now >= m.respawnAt) {
      m.hp = m.def.hp;
      m.respawnAt = null;
      if (m.def.miniBoss) log(`${m.def.name} снова бродит по слою.`, 'danger');
    }
  }

  const mob = targetMob(g);
  if (mob && mob !== g.mine?.boss && p.hp > 0 && now >= mob.nextAttackAt && now >= mob.stunnedUntil) {
    mob.nextAttackAt = now + mob.def.attackMs;
    damagePlayer(g, mob.def.atk, mob);
  }

  mineTick(g, now);
  if (g.portal && now >= g.portal.expiresAt) {
    g.portal = null;
    log('Скрытый проход в Шахты затянуло пылью.', 'system');
  }

  if (now - g.lastRegenAt >= 1000) {
    g.lastRegenAt = now;
    const fighting = targetMob(g) !== null || g.mine !== null;
    const safe = p.layer === SURFACE_ID;
    const hpRate = safe ? 0.1 : fighting ? 0 : 0.03;
    const mpRate = safe ? 0.1 : fighting ? 0.01 : 0.04;
    const cur = getStats(p);
    p.hp = Math.min(cur.hp, p.hp + Math.ceil(s.hp * hpRate));
    p.mp = Math.min(cur.mp, p.mp + Math.ceil(s.mp * mpRate));
  }
}
