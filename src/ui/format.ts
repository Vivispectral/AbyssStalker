import { ITEMS, QUALITY } from '../data/items';
import { itemBonus } from '../game/state';
import type { ItemStack } from '../types';

export function setBar(fill: HTMLElement, text: HTMLElement, cur: number, max: number, label: string): void {
  fill.style.width = `${Math.max(0, Math.min(100, (cur / max) * 100))}%`;
  text.textContent = `${label} ${Math.floor(cur)} / ${Math.floor(max)}`;
}

export function levelColor(mobLevel: number, playerLevel: number): string {
  const d = mobLevel - playerLevel;
  if (d <= -5) return 'lvl-gray';
  if (d <= -2) return 'lvl-green';
  if (d <= 1) return 'lvl-white';
  if (d <= 3) return 'lvl-yellow';
  return 'lvl-red';
}

export function statLine(stack: ItemStack): string {
  const b = itemBonus(stack);
  const parts: string[] = [];
  if (b.atk) parts.push(`АТК ${b.atk}`);
  if (b.def) parts.push(`ЗАЩ ${b.def}`);
  if (b.hp) parts.push(`HP ${b.hp}`);
  if (b.mp) parts.push(`MP ${b.mp}`);
  if (b.crit) parts.push(`Крит ${(b.crit * 100).toFixed(1)}%`);
  return parts.join(' · ');
}

export function itemTooltip(stack: ItemStack): string {
  const def = ITEMS[stack.id];
  const lines = [def.name + (stack.enchant ? ` +${stack.enchant}` : '')];
  if (def.kind === 'equipment') lines.push(`Качество: ${QUALITY[stack.quality].name}`, statLine(stack));
  lines.push(def.desc, `Цена у барыги: ${def.price}`);
  return lines.join('\n');
}
