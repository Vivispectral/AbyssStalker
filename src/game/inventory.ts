import { ITEMS } from '../data/items';
import { CONFIG } from '../config';
import type { Game, SlotId } from '../types';
import { log } from '../ui/log';
import { clampVitals, displayName, getStats, takeItem } from './state';

export const POTION_COOLDOWN_MS = 1500;

export function equip(g: Game, uid: number): void {
  const p = g.player;
  const index = p.inventory.findIndex((s) => s.uid === uid);
  if (index < 0) return;
  const stack = p.inventory[index];
  const slot = ITEMS[stack.id].slot;
  if (!slot) return;
  const previous = p.equipment[slot];
  p.equipment[slot] = stack;
  if (previous) p.inventory[index] = previous;
  else p.inventory.splice(index, 1);
  clampVitals(p);
  g.inventoryDirty = true;
  log(`Надето: ${displayName(stack)}${previous ? ` (снято: ${displayName(previous)})` : ''}.`, 'system');
}

export function unequip(g: Game, slot: SlotId): void {
  const p = g.player;
  const stack = p.equipment[slot];
  if (!stack) return;
  if (p.inventory.length >= CONFIG.inventorySize) {
    log('Некуда снять: инвентарь полон.', 'danger');
    return;
  }
  p.equipment[slot] = null;
  p.inventory.push(stack);
  clampVitals(p);
  g.inventoryDirty = true;
  log(`Снято: ${displayName(stack)}.`, 'system');
}

export function useConsumable(g: Game, id: string): void {
  const p = g.player;
  const item = ITEMS[id];
  if (!item?.use || p.hp <= 0) return;
  const now = Date.now();
  if ((g.cooldowns.potion ?? 0) > now) return;
  if (!takeItem(p, id)) return;
  g.cooldowns.potion = now + POTION_COOLDOWN_MS;

  const s = getStats(p);
  const parts: string[] = [];
  if (item.use.hpPct) {
    const before = p.hp;
    p.hp = Math.min(s.hp, p.hp + Math.round(s.hp * item.use.hpPct));
    parts.push(`+${p.hp - before} HP`);
  }
  if (item.use.mpPct) {
    const before = p.mp;
    p.mp = Math.min(s.mp, p.mp + Math.round(s.mp * item.use.mpPct));
    parts.push(`+${p.mp - before} MP`);
  }
  g.inventoryDirty = true;
  log(`Использовано: ${item.name} (${parts.join(', ')}).`, 'loot');
}
