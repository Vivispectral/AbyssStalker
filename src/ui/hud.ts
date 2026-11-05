import { CLASSES } from '../data/classes';
import { ITEMS } from '../data/items';
import { useSkill } from '../game/combat';
import { gazeActive } from '../game/gaze';
import { POTION_COOLDOWN_MS, useConsumable } from '../game/inventory';
import { berserkMult, countItem, currentLayer, expToNext, getStats } from '../game/state';
import type { Game } from '../types';
import { $, el, formatDuration } from '../util';
import { mountChat } from './chat';
import { setBar } from './format';
import { mountInventory, renderInventory } from './inventory';
import { mountLocation, updateLocation } from './location';
import { mountLog } from './log';
import { mountViewport, updateViewport } from './viewport';
import { isWorkbenchOpen, mountWorkbench, openWorkbench, renderWorkbench } from './workbench';

const LAYOUT = `
  <header class="hud panel">
    <div class="hud-id">
      <div class="hud-name" id="hud-name"></div>
      <div class="hud-class" id="hud-class"></div>
    </div>
    <div class="hud-bars">
      <div class="bar bar-hp"><div class="fill" id="hp-fill"></div><span id="hp-text"></span></div>
      <div class="bar bar-mp"><div class="fill" id="mp-fill"></div><span id="mp-text"></span></div>
      <div class="bar bar-exp"><div class="fill" id="exp-fill"></div><span id="exp-text"></span></div>
    </div>
    <div class="hud-stats">
      <div><span class="label">Уровень</span><span id="hud-level"></span></div>
      <div><span class="label">Золото</span><span id="hud-gold" class="gold"></span></div>
      <div><span class="label">Слой Бездны</span><span id="hud-layer"></span></div>
      <div><span class="label">Радиация</span><span id="hud-rad" class="rad"></span></div>
      <div><span class="label">Атака / Защита</span><span id="hud-atk"></span></div>
      <div class="gaze hidden" id="hud-gaze" title="Анти-бот система. Ровные тайминги и автокликеры режут дроп на 70–90%."><span class="label">Мутный взор</span><span id="hud-gaze-time"></span></div>
    </div>
    <button class="btn-ghost" id="wipe" title="Удалить персонажа и начать заново">⟲</button>
  </header>

  <main class="grid">
    <section class="panel location" id="location"></section>

    <section class="panel combat">
      <div id="viewport" class="viewport"></div>
      <h3>Журнал боя</h3>
      <div id="log" class="scroll log"></div>
    </section>

    <aside class="panel chat">
      <h3>Общий чат</h3>
      <div id="chat" class="scroll chat-list"></div>
      <form id="chat-form" class="chat-form">
        <input id="chat-input" maxlength="120" autocomplete="off" placeholder="Сказать в общий чат..." />
      </form>
    </aside>
  </main>

  <footer class="panel bottom">
    <div class="doll-wrap">
      <h3>Снаряжение</h3>
      <div id="doll" class="doll"></div>
    </div>
    <div class="inv-wrap">
      <div class="inv-head">
        <h3>Инвентарь <span id="inv-count"></span></h3>
        <button id="open-workbench">⚒ Верстак Заточки</button>
      </div>
      <div id="inventory" class="inventory"></div>
    </div>
    <div class="skills-wrap">
      <h3>Навыки и быстрые слоты</h3>
      <div id="skills" class="skills"></div>
    </div>
  </footer>
`;

interface SlotRef {
  root: HTMLElement;
  cd: HTMLElement;
  count?: HTMLElement;
  skillId?: string;
  mpCost?: number;
  itemId?: string;
}

const QUICK_ITEMS: { id: string; key: string; code: string }[] = [
  { id: 'stim_kit', key: 'Q', code: 'KeyQ' },
  { id: 'ether_ampoule', key: 'E', code: 'KeyE' },
];

let slots: SlotRef[] = [];

export function mountHud(root: HTMLElement, g: Game, onWipe: () => void): void {
  root.innerHTML = LAYOUT;
  mountLog($('#log'));
  mountChat($('#chat'), $<HTMLFormElement>('#chat-form'), $<HTMLInputElement>('#chat-input'), () => g.player.name);
  mountLocation($('#location'), g);
  mountViewport($('#viewport'), g);
  mountWorkbench(g);
  mountInventory(g, openWorkbench);

  $('#open-workbench').addEventListener('click', () => openWorkbench());
  $('#wipe').addEventListener('click', () => {
    if (confirm('Стереть персонажа? Прогресс будет потерян.')) onWipe();
  });

  document.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.repeat || isWorkbenchOpen()) return;
    if (e.code === 'Digit1') useSkill(g, 0);
    else if (e.code === 'Digit2') useSkill(g, 1);
    else {
      const quick = QUICK_ITEMS.find((q) => q.code === e.code);
      if (quick) useConsumable(g, quick.id);
    }
  });

  renderSkills(g);
}

function renderSkills(g: Game): void {
  const c = CLASSES[g.player.classId];
  $('#hud-name').textContent = g.player.name;
  $('#hud-class').textContent = `${c.name} · ${c.role}`;

  const bar = $('#skills');
  bar.replaceChildren();
  slots = [];

  c.skills.forEach((skill, i) => {
    const btn = el('button', 'slot');
    btn.title = `${skill.name}\n${skill.desc}\nПерезарядка: ${skill.cooldownMs / 1000} с`;
    const cd = el('div', 'cd');
    btn.append(el('span', 'key', String(i + 1)), el('span', 'slot-name', skill.name), el('span', 'slot-cost', skill.mpCost ? `${skill.mpCost} MP` : '—'), cd);
    btn.addEventListener('click', () => useSkill(g, i));
    bar.append(btn);
    slots.push({ root: btn, cd, skillId: skill.id, mpCost: skill.mpCost });
  });

  for (const q of QUICK_ITEMS) {
    const item = ITEMS[q.id];
    const btn = el('button', 'slot slot-item');
    btn.title = `${item.name}\n${item.desc}`;
    const count = el('span', 'slot-cost');
    const cd = el('div', 'cd');
    btn.append(el('span', 'key', q.key), el('span', 'slot-name', item.name), count, cd);
    btn.addEventListener('click', () => useConsumable(g, q.id));
    bar.append(btn);
    slots.push({ root: btn, cd, count, itemId: q.id });
  }
}

export function updateHud(g: Game, now: number): void {
  const p = g.player;
  const s = getStats(p);
  const layer = currentLayer(g);
  const c = CLASSES[p.classId];

  setBar($('#hp-fill'), $('#hp-text'), p.hp, s.hp, 'HP');
  setBar($('#mp-fill'), $('#mp-text'), p.mp, s.mp, 'MP');
  setBar($('#exp-fill'), $('#exp-text'), p.exp, expToNext(p.level), 'EXP');
  $('#hud-level').textContent = String(p.level);
  $('#hud-gold').textContent = p.gold.toLocaleString('ru-RU');
  $('#hud-layer').textContent = g.mine ? `${layer.short} · Шахта` : layer.short;
  $('#hud-rad').textContent = layer.radiation ? '☢'.repeat(layer.radiation) + '·'.repeat(5 - layer.radiation) : 'нет';
  const rage = c.passive.berserk ? ` (ярость ×${berserkMult(p, s).toFixed(2)})` : '';
  $('#hud-atk').textContent = `${s.atk} / ${s.def}${rage}`;
  document.body.classList.toggle('low-hp', p.hp / s.hp < 0.25);

  const gaze = gazeActive(g, now);
  $('#hud-gaze').classList.toggle('hidden', !gaze);
  if (gaze) $('#hud-gaze-time').textContent = formatDuration(g.gaze.until - now);

  updateLocation(g, now);
  updateViewport(g, now);

  for (const slot of slots) {
    const skill = slot.skillId ? c.skills.find((sk) => sk.id === slot.skillId) : null;
    const until = g.cooldowns[slot.skillId ?? 'potion'] ?? 0;
    const total = skill ? skill.cooldownMs : POTION_COOLDOWN_MS;
    slot.cd.style.height = `${(Math.max(0, until - now) / total) * 100}%`;
    if (slot.itemId && slot.count) {
      const n = countItem(p, slot.itemId);
      slot.count.textContent = `×${n}`;
      slot.root.classList.toggle('unavailable', n === 0);
    } else {
      slot.root.classList.toggle('unavailable', p.mp < (slot.mpCost ?? 0));
    }
  }

  if (g.inventoryDirty) {
    renderInventory(g);
    renderWorkbench();
    g.inventoryDirty = false;
  }
}
