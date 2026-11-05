import { CONFIG } from '../config';
import { ITEMS } from '../data/items';
import type { Game, ItemStack } from '../types';
import { systemChat } from '../ui/chat';
import { log } from '../ui/log';
import { chance } from '../util';
import { emit } from './events';
import { addItem, clampVitals, displayName, findStack, removeStack, takeItem } from './state';

export interface EnchantPreview {
  target: number;
  chance: number;
  risky: boolean;
  safe: boolean;
}

export function enchantPreview(stack: ItemStack, chipId: string): EnchantPreview {
  const chip = ITEMS[chipId].chip ?? { bonus: 1 };
  const target = stack.enchant + chip.bonus;
  const risky = target > CONFIG.safeEnchant;
  return {
    target,
    chance: risky ? Math.max(0.15, 0.75 - (target - 4) * 0.1) : 1,
    risky,
    safe: !!chip.safe,
  };
}

export type EnchantResult = 'success' | 'fail-safe' | 'broke';

export function enchant(g: Game, itemUid: number, chipId: string): EnchantResult | null {
  const p = g.player;
  const found = findStack(p, itemUid);
  if (!found || ITEMS[found.stack.id].kind !== 'equipment' || !ITEMS[chipId]?.chip) return null;
  if (!takeItem(p, chipId)) {
    log('Нет такого чипа.', 'danger');
    return null;
  }

  const stack = found.stack;
  const before = displayName(stack);
  const preview = enchantPreview(stack, chipId);
  g.inventoryDirty = true;

  if (chance(preview.chance)) {
    stack.enchant = preview.target;
    log(`Заточка удалась: ${displayName(stack)}.`, 'level');
    if (preview.risky) systemChat(`${p.name} успешно заточил «${ITEMS[stack.id].name}» до +${stack.enchant}!`, 'good');
    emit('enchant', { success: true, broke: false });
    return 'success';
  }

  if (preview.safe) {
    log(`Чип рассыпался, но защита Предтеч сохранила «${before}».`, 'system');
    emit('enchant', { success: false, broke: false });
    return 'fail-safe';
  }

  removeStack(p, itemUid);
  clampVitals(p);
  const kept = addItem(p, 'junk_pile');
  log(`«${before}» дезинтегрирован при заточке. ${kept ? 'Осталась Кучка мусора.' : 'Даже мусор некуда положить.'}`, 'danger');
  systemChat(`${p.name} сломал «${before}» при заточке!`, 'fail');
  emit('enchant', { success: false, broke: true });
  return 'broke';
}
