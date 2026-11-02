import { CLASSES } from './data/classes';
import { ITEMS } from './data/items';
import { LAYERS } from './data/layers';
import type { ClassId, Game, LayerDef, MobDef, MobInstance, Player, Stats } from './types';
import { log } from './ui/log';
import { systemChat } from './ui/chat';
import { chance, randFloat, randInt } from './util';

const SAVE_KEY = 'abyss-stalker:save:v1';
const CLICK_COOLDOWN_MS = 110;
const POTION_COOLDOWN_MS = 1500;
const NORMAL_MOB_COPIES = 2;
const DEATH_GOLD_LOSS = 0.1;

export function expToNext(level: number): number {
  return Math.round(40 * Math.pow(level, 1.7));
}

function enchanted(value: number, enchant: number): number {
  return Math.round(value * (1 + 0.15 * enchant));
}

export function getStats(p: Player): Stats {
  const c = CLASSES[p.classId];
  const lvl = p.level - 1;
  const weapon = ITEMS[p.weapon.item];
  const armor = ITEMS[p.armor.item];
  return {
    hp: Math.round(c.base.hp + c.perLevel.hp * lvl),
    mp: Math.round(c.base.mp + c.perLevel.mp * lvl),
    atk: Math.round(c.base.atk + c.perLevel.atk * lvl) + enchanted(weapon?.atk ?? 0, p.weapon.enchant),
    def: Math.round(c.base.def + c.perLevel.def * lvl) + enchanted(armor?.def ?? 0, p.armor.enchant),
    crit: c.base.crit + (c.passive.critBonus ?? 0),
  };
}

export function berserkMult(p: Player, s: Stats): number {
  return 1 + (1 - p.hp / s.hp) * 1.5;
}

export function currentLayer(g: Game): LayerDef {
  return LAYERS[g.player.layer - 1];
}

export function targetMob(g: Game): MobInstance | null {
  return g.mobs.find((m) => m.uid === g.targetUid && m.hp > 0) ?? null;
}

// ---------- Персонаж и сохранение ----------

export function createPlayer(name: string, classId: ClassId): Player {
  const c = CLASSES[classId];
  const p: Player = {
    name,
    classId,
    level: 1,
    exp: 0,
    hp: 0,
    mp: 0,
    gold: 50,
    layer: 1,
    weapon: { item: c.startWeapon, enchant: 0 },
    armor: { item: c.startArmor, enchant: 0 },
    inventory: { stim_kit: 3, ether_ampoule: 2, antirad: 1 },
    kills: 0,
    deaths: 0,
    bossRespawns: {},
  };
  const s = getStats(p);
  p.hp = s.hp;
  p.mp = s.mp;
  return p;
}

export function savePlayer(p: Player): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(p));
}

export function loadPlayer(): Player | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Player;
    if (!CLASSES[p.classId] || !LAYERS[p.layer - 1]) return null;
    p.bossRespawns ??= {};
    return p;
  } catch {
    return null;
  }
}

export function wipeSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

function addItem(p: Player, id: string, n = 1): void {
  p.inventory[id] = (p.inventory[id] ?? 0) + n;
}

function removeItem(p: Player, id: string, n = 1): void {
  const left = (p.inventory[id] ?? 0) - n;
  if (left > 0) p.inventory[id] = left;
  else delete p.inventory[id];
}

function heal(p: Player, s: Stats, amount: number): number {
  const before = p.hp;
  p.hp = Math.min(s.hp, p.hp + Math.round(amount));
  return p.hp - before;
}

// ---------- Мир ----------

export function createGame(player: Player): Game {
  const g: Game = {
    player,
    mobs: [],
    targetUid: null,
    cooldowns: {},
    lastCombatAt: 0,
    lastClickAt: 0,
    lastRegenAt: 0,
    layerVersion: 0,
    inventoryDirty: true,
    nextUid: 1,
  };
  spawnLayer(g);
  return g;
}

function spawnLayer(g: Game): void {
  const now = Date.now();
  g.mobs = [];
  g.targetUid = null;
  for (const def of currentLayer(g).mobs) {
    const copies = def.miniBoss ? 1 : NORMAL_MOB_COPIES;
    for (let i = 0; i < copies; i++) {
      const respawnAt = def.miniBoss ? (g.player.bossRespawns[def.id] ?? 0) : 0;
      const dead = respawnAt > now;
      g.mobs.push({
        uid: g.nextUid++,
        def,
        hp: dead ? 0 : def.hp,
        respawnAt: dead ? respawnAt : null,
        stunnedUntil: 0,
        nextAttackAt: 0,
      });
    }
  }
  g.layerVersion++;
}

export function changeLayer(g: Game, delta: number): void {
  const targetId = g.player.layer + delta;
  const layer = LAYERS[targetId - 1];
  if (!layer) return;
  if (targetMob(g)) {
    log('Нельзя уйти со слоя, пока вас атакуют.', 'danger');
    return;
  }
  if (delta > 0 && g.player.level < layer.minLevel) {
    log(`Спуск на ${layer.short} закрыт: нужен ${layer.minLevel} уровень.`, 'danger');
    return;
  }
  g.player.layer = targetId;
  spawnLayer(g);
  log(
    delta > 0
      ? `Вы спускаетесь глубже: ${layer.name}. Радиация ${layer.radiation}/5.`
      : `Вы поднимаетесь: ${layer.name}.`,
    'system',
  );
}

// ---------- Бой ----------

interface StrikeOpts {
  mult?: number;
  ignoreDef?: boolean;
  forceCrit?: boolean;
  lifestealPct?: number;
}

function mitigate(raw: number, def: number): number {
  return (raw * 60) / (60 + def);
}

function engage(g: Game, mob: MobInstance, now: number): void {
  if (g.targetUid !== mob.uid) {
    g.targetUid = mob.uid;
    mob.nextAttackAt = Math.max(mob.nextAttackAt, now + mob.def.attackMs * 0.6);
  }
  g.lastCombatAt = now;
}

export function attack(g: Game, uid: number): void {
  const now = Date.now();
  if (now - g.lastClickAt < CLICK_COOLDOWN_MS) return;
  g.lastClickAt = now;
  if (g.player.hp <= 0) return;
  const mob = g.mobs.find((m) => m.uid === uid);
  if (!mob || mob.hp <= 0) return;
  engage(g, mob, now);
  strike(g, mob, {}, null);
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
  const dmg = Math.max(1, Math.round(mitigate(raw, def)));

  mob.hp = Math.max(0, mob.hp - dmg);
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

function killMob(g: Game, mob: MobInstance): void {
  const p = g.player;
  const d = mob.def;
  mob.hp = 0;
  mob.respawnAt = Date.now() + d.respawnMs;
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
    if (!chance(entry.chance)) continue;
    const n = randInt(entry.min ?? 1, entry.max ?? 1);
    const item = ITEMS[entry.item];
    addItem(p, entry.item, n);
    const rare = item.rarity === 'rare' || item.rarity === 'epic';
    log(`Добыча: ${item.name}${n > 1 ? ` ×${n}` : ''}`, item.kind === 'trash' ? 'trash' : rare ? 'rare' : 'loot');
    if (item.rarity === 'epic') systemChat(`${p.name} добыл «${item.name}» на ${currentLayer(g).short}!`, 'good');
  }
  g.inventoryDirty = true;

  if (d.miniBoss) systemChat(`${p.name} одолел мини-босса «${d.name}» (${currentLayer(g).short}).`, 'good');
  gainExp(g, exp);
}

function gainExp(g: Game, amount: number): void {
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

function mobAttack(g: Game, mob: MobInstance, s: Stats): void {
  const p = g.player;
  const dmg = Math.max(1, Math.round(mitigate(mob.def.atk * randFloat(0.85, 1.15), s.def)));
  p.hp = Math.max(0, p.hp - dmg);
  log(`${mob.def.name} наносит вам ${dmg} урона.`, 'mob');
  if (p.hp <= 0) {
    playerDeath(g, mob);
    return;
  }
  const reflect = CLASSES[p.classId].passive.reflectPct;
  if (reflect) {
    const r = Math.max(1, Math.round(dmg * reflect));
    mob.hp = Math.max(0, mob.hp - r);
    log(`Пластины отражают ${r} урона.`, 'skill');
    if (mob.hp <= 0) killMob(g, mob);
  }
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
  if (p.layer > 1) {
    p.layer = 1;
    spawnLayer(g);
    log('Курьеры Кардиналов подняли ваше тело на Слой I. Счёт выставлен.', 'danger');
  } else {
    g.targetUid = null;
  }
}

// ---------- Навыки и предметы ----------

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

export function useItem(g: Game, id: string): void {
  const p = g.player;
  const item = ITEMS[id];
  if (!item || !(p.inventory[id] > 0) || p.hp <= 0) return;
  if (!item.use) {
    log(`${item.name}: ${item.desc}`, 'system');
    return;
  }
  const now = Date.now();
  if ((g.cooldowns.potion ?? 0) > now) return;
  g.cooldowns.potion = now + POTION_COOLDOWN_MS;

  const s = getStats(p);
  const parts: string[] = [];
  if (item.use.hpPct) parts.push(`+${heal(p, s, s.hp * item.use.hpPct)} HP`);
  if (item.use.mpPct) {
    const before = p.mp;
    p.mp = Math.min(s.mp, p.mp + Math.round(s.mp * item.use.mpPct));
    parts.push(`+${p.mp - before} MP`);
  }
  removeItem(p, id);
  g.inventoryDirty = true;
  log(`Использовано: ${item.name} (${parts.join(', ')}).`, 'loot');
}

export function sellTrash(g: Game): void {
  const p = g.player;
  let total = 0;
  let count = 0;
  for (const [id, n] of Object.entries(p.inventory)) {
    const item = ITEMS[id];
    if (item?.kind !== 'trash') continue;
    total += item.price * n;
    count += n;
    delete p.inventory[id];
  }
  if (count === 0) {
    log('Барыга морщится: «Мусора нет — нечего и сдавать».', 'system');
    return;
  }
  p.gold += total;
  g.inventoryDirty = true;
  log(`Сдано барыге ${count} ед. хлама за ${total} золота.`, 'loot');
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
  if (mob && p.hp > 0 && now >= mob.nextAttackAt && now >= mob.stunnedUntil) {
    mob.nextAttackAt = now + mob.def.attackMs;
    mobAttack(g, mob, s);
  }

  if (now - g.lastRegenAt >= 1000) {
    g.lastRegenAt = now;
    const fighting = targetMob(g) !== null;
    p.hp = Math.min(s.hp, p.hp + Math.ceil(s.hp * (fighting ? 0 : 0.03)));
    p.mp = Math.min(s.mp, p.mp + Math.ceil(s.mp * (fighting ? 0.01 : 0.04)));
  }
}
