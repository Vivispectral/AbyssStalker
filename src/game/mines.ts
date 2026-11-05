import { CONFIG } from '../config';
import { CLASS_LIST } from '../data/classes';
import { ITEMS } from '../data/items';
import { SURFACE_ID } from '../data/layers';
import type { Game, MineState, MinePlayer, MobDef } from '../types';
import { FAKE_NAMES, systemChat } from '../ui/chat';
import { log } from '../ui/log';
import { chance, pick, randFloat, randInt } from '../util';
import { damagePlayer, gainExp, grantLoot, mitigate, targetMob } from './combat';
import { gazeDropMult } from './gaze';
import { currentLayer, getStats } from './state';

const MINE_DURATION_MS = 3 * 60_000;
const BOT_TICK_MS = 1000;
const CLOSE_DELAY_MS = 5000;
const MAX_BOTS = 7;
const PLAYER_CLICKS_PER_SEC = 4;

const BOSS_NAMES = ['Жильный Пожиратель', 'Кристальный Голем', 'Матка Нано-Роя', 'Слепой Бурильщик', 'Призрак Забоя'];

export function rollPortal(g: Game, now: number, ttlMs: number): void {
  if (g.mine || g.portal || g.player.layer === SURFACE_ID) return;
  if (!chance(CONFIG.mineChance * gazeDropMult(g))) return;
  g.portal = { expiresAt: now + ttlMs };
  log('Под ногами осыпается порода — открылся скрытый проход в Общественные Шахты!', 'rare');
}

function makeBot(level: number, baseDps: number, taken: Set<string>): MinePlayer {
  let name = pick(FAKE_NAMES);
  while (taken.has(name)) name = pick(FAKE_NAMES);
  taken.add(name);
  return {
    name,
    classId: pick(CLASS_LIST).id,
    level: Math.max(1, level + randInt(-3, 4)),
    dps: baseDps * randFloat(0.5, 1.4),
    dmg: 0,
  };
}

export function enterMine(g: Game): void {
  const now = Date.now();
  if (!g.portal || g.portal.expiresAt < now || g.mine) return;
  if (targetMob(g)) {
    log('Сначала разберитесь с тем, кто вас атакует.', 'danger');
    return;
  }

  const layer = currentLayer(g);
  const p = g.player;
  const strongest = layer.mobs.filter((m) => !m.miniBoss).reduce((a, b) => (b.level > a.level ? b : a));
  const playerDps = mitigate(getStats(p).atk, strongest.def) * PLAYER_CLICKS_PER_SEC;
  const taken = new Set<string>([p.name]);
  const bots = Array.from({ length: randInt(3, 6) }, () => makeBot(p.level, playerDps, taken));
  const totalDps = bots.reduce((a, b) => a + b.dps, playerDps);

  const def: MobDef = {
    id: 'mine_boss',
    name: pick(BOSS_NAMES),
    level: strongest.level + 3,
    hp: Math.round(totalDps * 70),
    atk: Math.round(strongest.atk * 1.4),
    def: strongest.def,
    attackMs: 2000,
    exp: strongest.exp * 12,
    gold: [strongest.gold[1] * 5, strongest.gold[1] * 10],
    loot: [],
    respawnMs: 0,
    sprite: strongest.sprite,
    miniBoss: true,
  };

  g.mine = {
    layerId: layer.id,
    boss: { uid: g.nextUid++, def, hp: def.hp, respawnAt: null, stunnedUntil: 0, nextAttackAt: now + 2500 },
    bots,
    playerDmg: 0,
    endsAt: now + MINE_DURATION_MS,
    nextBotTickAt: now + BOT_TICK_MS,
    closesAt: null,
    result: null,
  };
  g.portal = null;
  g.targetUid = null;
  g.viewUid = g.mine.boss.uid;
  g.layerVersion++;
  log(`Вы протискиваетесь в Шахту. В комнате уже ${bots.length} сталкеров и «${def.name}».`, 'rare');
  systemChat(`В Общественных Шахтах (${layer.short}) замечен «${def.name}».`, 'system');
}

export function leaveMine(g: Game): void {
  if (!g.mine) return;
  const finished = g.mine.result !== null;
  g.mine = null;
  g.targetUid = null;
  g.viewUid = null;
  g.layerVersion++;
  log(finished ? 'Вы выбираетесь из Шахты обратно на слой.' : 'Вы покидаете Шахту, не дождавшись развязки.', 'system');
}

export function mineRanking(mine: MineState, playerName: string): { name: string; dmg: number; self: boolean }[] {
  return [{ name: playerName, dmg: mine.playerDmg, self: true }, ...mine.bots.map((b) => ({ name: b.name, dmg: b.dmg, self: false }))]
    .sort((a, b) => b.dmg - a.dmg);
}

function finish(g: Game, now: number): void {
  const mine = g.mine;
  if (!mine || mine.result) return;
  const p = g.player;
  const boss = mine.boss;
  boss.hp = 0;
  g.targetUid = null;

  const ranking = mineRanking(mine, p.name);
  const total = ranking.reduce((a, r) => a + r.dmg, 0) || 1;
  const winner = ranking[0];
  const share = mine.playerDmg / total;

  const exp = Math.round(boss.def.exp * Math.max(0.25, share));
  const gold = Math.round(randInt(boss.def.gold[0], boss.def.gold[1]) * Math.max(0.2, share));
  p.gold += gold;
  log(`${boss.def.name} повержен! Ваш вклад: ${Math.round(share * 100)}% урона. +${exp} опыта, +${gold} золота.`, 'level');

  if (winner.self) {
    const layerLoot = currentLayer(g).mobs.flatMap((m) => m.loot.map((e) => e.item)).filter((id) => ITEMS[id].kind === 'equipment');
    const drops: [string, number][] = [
      ['chip_basic', randInt(2, 4)],
      ['nano_dust', randInt(3, 6)],
    ];
    if (layerLoot.length) drops.push([pick(layerLoot), 1]);
    if (chance(0.35)) drops.push(['chip_improved', 1]);
    if (chance(0.12)) drops.push(['chip_safe', 1]);
    log('Наибольший урон — ваш. Жила и трофеи достаются вам!', 'rare');
    for (const [id, n] of drops) {
      if (chance(gazeDropMult(g))) grantLoot(g, id, n, 2);
    }
    systemChat(`${p.name} забрал добычу «${boss.def.name}» в Шахтах (${Math.round(share * 100)}% урона).`, 'good');
    mine.result = 'Добыча ваша.';
  } else {
    log(`Добычу забирает ${winner.name} (${Math.round((winner.dmg / total) * 100)}% урона). Бейте сильнее в следующий раз.`, 'danger');
    systemChat(`${winner.name} забрал добычу «${boss.def.name}» в Общественных Шахтах.`, 'good');
    mine.result = `Добыча досталась ${winner.name}.`;
  }

  gainExp(g, exp);
  mine.closesAt = now + CLOSE_DELAY_MS;
}

export function onMineBossKilled(g: Game): void {
  finish(g, Date.now());
}

export function mineTick(g: Game, now: number): void {
  const mine = g.mine;
  if (!mine) return;
  if (mine.closesAt !== null) {
    if (now >= mine.closesAt) leaveMine(g);
    return;
  }

  if (now >= mine.endsAt) {
    mine.result = `${mine.boss.def.name} ушёл в глубину. Проход обрушился.`;
    mine.closesAt = now + CLOSE_DELAY_MS;
    log(mine.result, 'danger');
    return;
  }

  const boss = mine.boss;
  if (now >= mine.nextBotTickAt) {
    mine.nextBotTickAt = now + BOT_TICK_MS;
    for (const bot of mine.bots) {
      const dmg = Math.min(boss.hp, Math.round(bot.dps * randFloat(0.6, 1.4)));
      bot.dmg += dmg;
      boss.hp -= dmg;
    }
    if (mine.bots.length < MAX_BOTS && chance(0.04)) {
      const bot = makeBot(g.player.level, mine.bots[0]?.dps ?? 10, new Set([g.player.name, ...mine.bots.map((b) => b.name)]));
      mine.bots.push(bot);
      log(`${bot.name} протиснулся в Шахту.`, 'system');
    }
    if (boss.hp <= 0) {
      finish(g, now);
      return;
    }
  }

  if (now >= boss.nextAttackAt && now >= boss.stunnedUntil) {
    boss.nextAttackAt = now + boss.def.attackMs;
    if (chance(1 / (mine.bots.length + 1))) damagePlayer(g, boss.def.atk, boss);
  }
}
