import { ITEMS, SHOP } from '../data/items';
import { LAYERS, SURFACE_ID } from '../data/layers';
import type { Game } from '../types';
import { log } from '../ui/log';
import { chance } from '../util';
import { targetMob } from './combat';
import { addItem, countItem, currentLayer, getStats, takeItem } from './state';

const NORMAL_MOB_COPIES = 3;
const RAD_DAMAGE_PER_MISSING = 0.12;

export function spawnLayer(g: Game): void {
  const now = Date.now();
  g.mobs = [];
  g.targetUid = null;
  g.viewUid = null;
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

function canLeave(g: Game): boolean {
  if (g.mine) {
    log('Сначала выберитесь из Шахты.', 'danger');
    return false;
  }
  if (targetMob(g)) {
    log('Нельзя уйти, пока вас атакуют.', 'danger');
    return false;
  }
  return true;
}

export function descend(g: Game): void {
  const next = LAYERS[g.player.layer + 1];
  if (!next || !canLeave(g)) return;
  if (g.player.level < next.minLevel) {
    log(`Спуск на ${next.short} закрыт: нужен ${next.minLevel} уровень.`, 'danger');
    return;
  }
  g.player.layer = next.id;
  g.portal = null;
  spawnLayer(g);
  log(`Вы спускаетесь: ${next.name}. Радиация ${next.radiation}/5.`, 'system');
}

export interface EvacRisk {
  need: number;
  have: number;
  missing: number;
  radDamagePct: number;
  tubeCost: number;
}

export function evacuationRisk(g: Game): EvacRisk {
  const layer = currentLayer(g);
  const need = layer.radiation;
  const have = countItem(g.player, 'antirad');
  const missing = Math.max(0, need - have);
  return {
    need,
    have,
    missing,
    radDamagePct: missing * RAD_DAMAGE_PER_MISSING,
    tubeCost: 60 * layer.id * layer.id,
  };
}

function arriveAtSurface(g: Game): void {
  g.player.layer = SURFACE_ID;
  g.portal = null;
  spawnLayer(g);
  g.inventoryDirty = true;
}

function loseHalfOfLoot(g: Game): string[] {
  const p = g.player;
  const lost: string[] = [];
  p.inventory = p.inventory.filter((stack) => {
    const def = ITEMS[stack.id];
    if (def.kind === 'consumable') return true;
    if (def.kind === 'equipment') {
      if (!chance(0.5)) return true;
      lost.push(def.name);
      return false;
    }
    const n = Math.ceil(stack.count / 2);
    stack.count -= n;
    lost.push(`${def.name} ×${n}`);
    return stack.count > 0;
  });
  return lost;
}

export function evacuateOnFoot(g: Game): void {
  if (g.player.layer === SURFACE_ID || !canLeave(g)) return;
  const p = g.player;
  const risk = evacuationRisk(g);
  const used = Math.min(risk.need, risk.have);
  if (used > 0) takeItem(p, 'antirad', used);

  if (risk.missing === 0) {
    arriveAtSurface(g);
    log(`Подъём прошёл спокойно. Израсходовано антирада: ${used}.`, 'loot');
    return;
  }

  const s = getStats(p);
  const dmg = Math.round(s.hp * risk.radDamagePct);
  p.hp = Math.max(1, p.hp - dmg);
  const lost = loseHalfOfLoot(g);
  arriveAtSurface(g);
  log(`Антирада не хватило (${used}/${risk.need}). Радиация сожгла ${dmg} HP.`, 'danger');
  log(lost.length ? `По дороге потеряна половина добычи: ${lost.join(', ')}.` : 'Терять было нечего — рюкзак и так пуст.', 'danger');
}

export function evacuateByTube(g: Game): void {
  if (g.player.layer === SURFACE_ID || !canLeave(g)) return;
  const { tubeCost } = evacuationRisk(g);
  if (g.player.gold < tubeCost) {
    log(`Кардиналы не пускают в трубу: нужно ${tubeCost} золота.`, 'danger');
    return;
  }
  g.player.gold -= tubeCost;
  arriveAtSurface(g);
  log(`Экспресс-труба Кардиналов доставила вас наверх за ${tubeCost} золота. Груз цел.`, 'loot');
}

// ---------- Поверхность: барыга и лавка ----------

export function trashValue(g: Game): number {
  return g.player.inventory.reduce((sum, s) => (ITEMS[s.id].kind === 'trash' ? sum + ITEMS[s.id].price * s.count : sum), 0);
}

export function sellTrash(g: Game): void {
  const p = g.player;
  if (p.layer !== SURFACE_ID) return;
  const total = trashValue(g);
  if (total === 0) {
    log('Барыга морщится: «Хлама нет — нечего и сдавать».', 'system');
    return;
  }
  const count = p.inventory.filter((s) => ITEMS[s.id].kind === 'trash').reduce((a, s) => a + s.count, 0);
  p.inventory = p.inventory.filter((s) => ITEMS[s.id].kind !== 'trash');
  p.gold += total;
  g.inventoryDirty = true;
  log(`Сдано барыге ${count} ед. хлама за ${total} золота.`, 'loot');
}

export function buy(g: Game, id: string): void {
  const p = g.player;
  const offer = SHOP.find(([itemId]) => itemId === id);
  if (p.layer !== SURFACE_ID || !offer) return;
  const price = offer[1];
  if (p.gold < price) {
    log('Не хватает золота.', 'danger');
    return;
  }
  if (!addItem(p, id, 1)) {
    log('Инвентарь полон.', 'danger');
    return;
  }
  p.gold -= price;
  g.inventoryDirty = true;
  log(`Куплено: ${ITEMS[id].name} за ${price} золота.`, 'loot');
}
