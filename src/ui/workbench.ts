import { CONFIG } from '../config';
import { ITEMS, QUALITY, SLOT_LABEL } from '../data/items';
import { enchant, enchantPreview, type EnchantResult } from '../game/enchant';
import { displayName, findStack } from '../game/state';
import type { Game, ItemStack } from '../types';
import { el } from '../util';
import { statLine } from './format';

const RESULT_TEXT: Record<EnchantResult, string> = {
  success: 'Успех! Чип встроился, предмет усилен.',
  'fail-safe': 'Неудача. Чип рассыпался, но предмет уцелел.',
  broke: 'Провал. Предмет дезинтегрирован в Кучку мусора.',
};

let overlay: HTMLElement;
let game: Game;
let selItem: number | null = null;
let selChip: string | null = null;
let lastResult: EnchantResult | null = null;
let flashUntil = 0;
const FLASH_MS = 700;

export function isWorkbenchOpen(): boolean {
  return !overlay.classList.contains('hidden');
}

export function closeWorkbench(): void {
  overlay.classList.add('hidden');
}

export function openWorkbench(itemUid?: number): void {
  if (itemUid !== undefined) selItem = itemUid;
  lastResult = null;
  overlay.classList.remove('hidden');
  renderWorkbench();
}

export function mountWorkbench(g: Game): void {
  game = g;
  overlay = el('div', 'modal-overlay hidden');
  overlay.innerHTML = `
    <div class="modal panel workbench">
      <div class="modal-head">
        <h2>Верстак Заточки</h2>
        <button class="btn-ghost" data-close>✕</button>
      </div>
      <p class="desc">Вставьте Энергетический чип в предмет. До +${CONFIG.safeEnchant} заточка безопасна, выше — предмет может сгореть.</p>
      <div class="wb-body"></div>
    </div>`;
  document.body.append(overlay);

  overlay.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t === overlay || t.closest('[data-close]')) return closeWorkbench();
    const pickItem = t.closest<HTMLElement>('[data-pick-item]');
    if (pickItem) {
      selItem = Number(pickItem.dataset.pickItem);
      lastResult = null;
      return renderWorkbench();
    }
    const pickChip = t.closest<HTMLElement>('[data-pick-chip]');
    if (pickChip) {
      selChip = pickChip.dataset.pickChip ?? null;
      lastResult = null;
      return renderWorkbench();
    }
    if (t.closest('[data-enchant]') && selItem !== null && selChip) {
      lastResult = enchant(game, selItem, selChip);
      flashUntil = Date.now() + FLASH_MS;
      renderWorkbench();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isWorkbenchOpen()) closeWorkbench();
  });
}

function equipmentCandidates(): { stack: ItemStack; equipped: boolean }[] {
  const p = game.player;
  const equipped = Object.values(p.equipment).filter((s): s is ItemStack => s !== null).map((stack) => ({ stack, equipped: true }));
  const carried = p.inventory.filter((s) => ITEMS[s.id].kind === 'equipment').map((stack) => ({ stack, equipped: false }));
  return [...equipped, ...carried];
}

function pickCard(stack: ItemStack, selected: boolean, attr: string, extra: string): HTMLElement {
  const def = ITEMS[stack.id];
  const card = el('button', `cell item rarity-${def.rarity} q-${stack.quality}${selected ? ' selected' : ''}`);
  card.setAttribute(attr, attr === 'data-pick-item' ? String(stack.uid) : stack.id);
  card.append(el('span', 'cell-type', extra), el('span', 'cell-name', def.name), el('span', 'cell-badge', def.kind === 'chip' ? `×${stack.count}` : stack.enchant ? `+${stack.enchant}` : ''));
  return card;
}

export function renderWorkbench(): void {
  if (!overlay || !isWorkbenchOpen()) return;
  const p = game.player;
  const body = overlay.querySelector<HTMLElement>('.wb-body')!;

  const item = selItem !== null ? findStack(p, selItem)?.stack ?? null : null;
  if (!item) selItem = null;
  const chipStack = selChip ? p.inventory.find((s) => s.id === selChip) ?? null : null;
  if (!chipStack) selChip = null;

  const flash = lastResult && Date.now() < flashUntil ? (lastResult === 'success' ? ' flash-good' : ' flash-bad') : '';
  const itemSlot = el('div', `wb-slot item-slot${flash}`);
  itemSlot.append(el('span', 'cell-type', 'Предмет'));
  if (item) {
    itemSlot.append(
      el('span', 'wb-name', displayName(item)),
      el('span', 'muted', `${QUALITY[item.quality].name} · ${statLine(item)}`),
    );
  } else itemSlot.append(el('span', 'muted', 'Выберите предмет ниже'));

  const chipSlot = el('div', 'wb-slot chip-slot');
  chipSlot.append(el('span', 'cell-type', 'Чип'));
  if (chipStack) chipSlot.append(el('span', 'wb-name', ITEMS[chipStack.id].name), el('span', 'muted', ITEMS[chipStack.id].desc));
  else chipSlot.append(el('span', 'muted', 'Выберите чип ниже'));

  const preview = el('div', 'wb-preview');
  const button = el('button', 'btn-primary', 'Заточить');
  button.dataset.enchant = '';
  button.disabled = !item || !chipStack;
  if (item && chipStack) {
    const pv = enchantPreview(item, chipStack.id);
    const risk = !pv.risky ? 'Безопасная зона: успех гарантирован.' : pv.safe ? 'При неудаче предмет уцелеет.' : 'При неудаче предмет сгорит в Кучку мусора!';
    preview.className = `wb-preview ${pv.risky && !pv.safe ? 'danger' : 'ok'}`;
    preview.append(
      el('div', 'wb-chance', `+${item.enchant} → +${pv.target} · шанс ${Math.round(pv.chance * 100)}%`),
      el('div', '', risk),
    );
  }

  const result = el('div', `wb-result ${lastResult ?? ''}`, lastResult ? RESULT_TEXT[lastResult] : '');

  const itemsList = el('div', 'wb-list');
  const candidates = equipmentCandidates();
  if (!candidates.length) itemsList.append(el('div', 'muted', 'Нет экипировки.'));
  for (const { stack, equipped } of candidates) {
    const label = `${SLOT_LABEL[ITEMS[stack.id].slot!]}${equipped ? ' · надето' : ''}`;
    itemsList.append(pickCard(stack, stack.uid === selItem, 'data-pick-item', label));
  }

  const chipsList = el('div', 'wb-list');
  const chips = p.inventory.filter((s) => ITEMS[s.id].kind === 'chip');
  if (!chips.length) chipsList.append(el('div', 'muted', 'Нет чипов. Их роняют мобы и продаёт лавка на поверхности.'));
  for (const stack of chips) chipsList.append(pickCard(stack, stack.id === selChip, 'data-pick-chip', 'Чип'));

  const slots = el('div', 'wb-slots');
  slots.append(itemSlot, el('div', 'wb-plus', '+'), chipSlot);
  body.replaceChildren(
    slots,
    preview,
    button,
    result,
    el('h3', '', 'Экипировка'),
    itemsList,
    el('h3', '', 'Энергетические чипы'),
    chipsList,
  );
}
