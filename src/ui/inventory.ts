import { CONFIG } from '../config';
import { ITEMS, KIND_LABEL, QUALITY, SLOTS, SLOT_LABEL } from '../data/items';
import { equip, unequip, useConsumable } from '../game/inventory';
import type { Game } from '../types';
import { $, el } from '../util';
import { itemTooltip, statLine } from './format';
import { log } from './log';

let gridEl: HTMLElement;
let dollEl: HTMLElement;
let countEl: HTMLElement;

export function mountInventory(g: Game, openWorkbench: (itemUid?: number) => void): void {
  gridEl = $('#inventory');
  dollEl = $('#doll');
  countEl = $('#inv-count');

  gridEl.addEventListener('click', (e) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-uid]');
    if (!cell) return;
    const stack = g.player.inventory.find((s) => s.uid === Number(cell.dataset.uid));
    if (!stack) return;
    const def = ITEMS[stack.id];
    if (def.kind === 'equipment') equip(g, stack.uid);
    else if (def.use) useConsumable(g, stack.id);
    else if (def.kind === 'chip') openWorkbench();
    else log(`${def.name}: ${def.desc}`, 'system');
  });

  gridEl.addEventListener('contextmenu', (e) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-uid]');
    const stack = cell && g.player.inventory.find((s) => s.uid === Number(cell.dataset.uid));
    if (!stack || ITEMS[stack.id].kind !== 'equipment') return;
    e.preventDefault();
    openWorkbench(stack.uid);
  });

  dollEl.addEventListener('click', (e) => {
    const slot = (e.target as HTMLElement).closest<HTMLElement>('[data-slot]')?.dataset.slot;
    if (slot) unequip(g, slot as (typeof SLOTS)[number]);
  });
}

export function renderInventory(g: Game): void {
  const p = g.player;
  countEl.textContent = `${p.inventory.length}/${CONFIG.inventorySize}`;

  const cells: HTMLElement[] = [];
  for (let i = 0; i < CONFIG.inventorySize; i++) {
    const stack = p.inventory[i];
    if (!stack) {
      cells.push(el('div', 'cell empty'));
      continue;
    }
    const def = ITEMS[stack.id];
    const cell = el('button', `cell item rarity-${def.rarity} kind-${def.kind} q-${stack.quality}`);
    cell.dataset.uid = String(stack.uid);
    cell.title = itemTooltip(stack) + (def.kind === 'equipment' ? '\n\nКлик — надеть, ПКМ — на верстак' : '');
    const type = def.slot ? SLOT_LABEL[def.slot] : KIND_LABEL[def.kind];
    const badge = def.kind === 'equipment' ? (stack.enchant ? `+${stack.enchant}` : '') : `×${stack.count}`;
    cell.append(
      el('span', 'cell-type', def.kind === 'equipment' ? `${type} · ${QUALITY[stack.quality].name}` : type),
      el('span', 'cell-name', def.name),
      el('span', 'cell-badge', badge),
    );
    cells.push(cell);
  }
  gridEl.replaceChildren(...cells);

  dollEl.replaceChildren(
    ...SLOTS.map((slot) => {
      const stack = p.equipment[slot];
      const node = el('button', `doll-slot${stack ? ` filled rarity-${ITEMS[stack.id].rarity} q-${stack.quality}` : ''}`);
      node.dataset.slot = slot;
      node.append(el('span', 'cell-type', SLOT_LABEL[slot]));
      if (stack) {
        node.title = `${itemTooltip(stack)}\n\nКлик — снять в инвентарь`;
        node.append(
          el('span', 'cell-name', ITEMS[stack.id].name + (stack.enchant ? ` +${stack.enchant}` : '')),
          el('span', 'doll-stats', statLine(stack)),
        );
      } else {
        node.disabled = true;
        node.append(el('span', 'cell-name muted', 'пусто'));
      }
      return node;
    }),
  );
}
