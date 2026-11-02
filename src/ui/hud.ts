import { CLASSES } from '../data/classes';
import { ITEMS, KIND_ORDER } from '../data/items';
import { LAYERS } from '../data/layers';
import {
  attack, berserkMult, changeLayer, currentLayer, expToNext, getStats, sellTrash, useItem, useSkill,
} from '../game';
import type { Game, MobInstance } from '../types';
import { $, el, formatDuration } from '../util';
import { mountChat } from './chat';
import { mountLog } from './log';

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
    </div>
    <button class="btn-ghost" id="wipe" title="Удалить персонажа и начать заново">⟲</button>
  </header>

  <main class="grid">
    <section class="panel location">
      <h2 id="loc-name"></h2>
      <p class="desc" id="loc-desc"></p>
      <p class="economy" id="loc-economy"></p>
      <div class="layer-nav">
        <button id="layer-up">▲ Подняться</button>
        <button id="layer-down">▼ Спуститься</button>
      </div>
      <h3>Обитатели слоя</h3>
      <div id="mob-list" class="mob-list"></div>
    </section>

    <section class="panel combat">
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
    <div class="equip">
      <h3>Снаряжение</h3>
      <div id="equip"></div>
    </div>
    <div class="inv-wrap">
      <div class="inv-head">
        <h3>Инвентарь</h3>
        <button id="sell-trash">Сдать хлам барыге</button>
      </div>
      <div id="inventory" class="inventory"></div>
    </div>
    <div class="skills-wrap">
      <h3>Навыки и быстрые слоты</h3>
      <div id="skills" class="skills"></div>
    </div>
  </footer>
`;

interface MobRow {
  root: HTMLElement;
  fill: HTMLElement;
  hpText: HTMLElement;
  status: HTMLElement;
  lvl: HTMLElement;
  btn: HTMLButtonElement;
}

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

let mobRows = new Map<number, MobRow>();
let slots: SlotRef[] = [];
let renderedLayerVersion = -1;

function setBar(fill: HTMLElement, text: HTMLElement, cur: number, max: number, label: string): void {
  fill.style.width = `${Math.max(0, Math.min(100, (cur / max) * 100))}%`;
  text.textContent = `${label} ${Math.floor(cur)} / ${Math.floor(max)}`;
}

function levelColor(mobLevel: number, playerLevel: number): string {
  const d = mobLevel - playerLevel;
  if (d <= -5) return 'lvl-gray';
  if (d <= -2) return 'lvl-green';
  if (d <= 1) return 'lvl-white';
  if (d <= 3) return 'lvl-yellow';
  return 'lvl-red';
}

export function mountHud(root: HTMLElement, g: Game, onWipe: () => void): void {
  root.innerHTML = LAYOUT;
  mountLog($('#log'));
  mountChat($('#chat'), $<HTMLFormElement>('#chat-form'), $<HTMLInputElement>('#chat-input'), () => g.player.name);

  $('#mob-list').addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-attack]');
    if (btn) attack(g, Number(btn.dataset.attack));
  });
  $('#inventory').addEventListener('click', (e) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-item]');
    if (cell?.dataset.item) useItem(g, cell.dataset.item);
  });
  $('#sell-trash').addEventListener('click', () => sellTrash(g));
  $('#layer-up').addEventListener('click', () => changeLayer(g, -1));
  $('#layer-down').addEventListener('click', () => changeLayer(g, 1));
  $('#wipe').addEventListener('click', () => {
    if (confirm('Стереть персонажа? Прогресс будет потерян.')) onWipe();
  });

  document.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.repeat) return;
    if (e.code === 'Digit1') useSkill(g, 0);
    else if (e.code === 'Digit2') useSkill(g, 1);
    else {
      const quick = QUICK_ITEMS.find((q) => q.code === e.code);
      if (quick) useItem(g, quick.id);
    }
  });

  renderStatic(g);
}

function renderStatic(g: Game): void {
  const c = CLASSES[g.player.classId];
  $('#hud-name').textContent = g.player.name;
  $('#hud-class').textContent = `${c.name} · ${c.role}`;

  const bar = $('#skills');
  bar.replaceChildren();
  slots = [];

  c.skills.forEach((skill, i) => {
    const btn = el('button', 'slot');
    btn.title = `${skill.name}\n${skill.desc}\nПерезарядка: ${skill.cooldownMs / 1000} с`;
    btn.append(el('span', 'key', String(i + 1)), el('span', 'slot-name', skill.name), el('span', 'slot-cost', skill.mpCost ? `${skill.mpCost} MP` : '—'));
    const cd = el('div', 'cd');
    btn.append(cd);
    btn.addEventListener('click', () => useSkill(g, i));
    bar.append(btn);
    slots.push({ root: btn, cd, skillId: skill.id, mpCost: skill.mpCost });
  });

  for (const q of QUICK_ITEMS) {
    const item = ITEMS[q.id];
    const btn = el('button', 'slot slot-item');
    btn.title = `${item.name}\n${item.desc}`;
    const count = el('span', 'slot-cost');
    btn.append(el('span', 'key', q.key), el('span', 'slot-name', item.name), count);
    const cd = el('div', 'cd');
    btn.append(cd);
    btn.addEventListener('click', () => useItem(g, q.id));
    bar.append(btn);
    slots.push({ root: btn, cd, count, itemId: q.id });
  }
}

function renderLocation(g: Game): void {
  const layer = currentLayer(g);
  $('#loc-name').textContent = layer.name;
  $('#loc-desc').textContent = layer.desc;
  $('#loc-economy').textContent = layer.economy;

  const list = $('#mob-list');
  list.replaceChildren();
  mobRows = new Map();

  for (const m of g.mobs) {
    const row = el('div', `mob${m.def.miniBoss ? ' miniboss' : ''}`);
    const info = el('div', 'mob-info');
    const nameLine = el('div', 'mob-name');
    const lvl = el('span', 'mob-lvl', `Ур. ${m.def.level}`);
    nameLine.append(lvl, document.createTextNode(` ${m.def.name}`));
    if (m.def.miniBoss) nameLine.append(el('span', 'tag', 'мини-босс'));
    const bar = el('div', 'bar bar-mob');
    const fill = el('div', 'fill');
    const hpText = el('span');
    bar.append(fill, hpText);
    const status = el('div', 'mob-status');
    info.append(nameLine, bar, status);

    const btn = el('button', 'btn-attack', 'Атаковать');
    btn.dataset.attack = String(m.uid);
    row.append(info, btn);
    list.append(row);
    mobRows.set(m.uid, { root: row, fill, hpText, status, lvl, btn });
  }
  renderedLayerVersion = g.layerVersion;
}

function updateMobRow(g: Game, m: MobInstance, row: MobRow, now: number): void {
  const dead = m.hp <= 0;
  const targeted = g.targetUid === m.uid && !dead;
  row.root.classList.toggle('dead', dead);
  row.root.classList.toggle('targeted', targeted);
  row.btn.disabled = dead;
  row.lvl.className = `mob-lvl ${levelColor(m.def.level, g.player.level)}`;
  setBar(row.fill, row.hpText, m.hp, m.def.hp, 'HP');

  let status = '';
  if (dead && m.respawnAt) status = `Респаун через ${formatDuration(m.respawnAt - now)}`;
  else if (m.stunnedUntil > now) status = 'Оглушён';
  else if (targeted) status = 'Сражается с вами';
  row.status.textContent = status;
}

function renderInventory(g: Game): void {
  const p = g.player;
  const inv = $('#inventory');
  inv.replaceChildren();
  const entries = Object.entries(p.inventory)
    .filter(([id, n]) => ITEMS[id] && n > 0)
    .sort(([a], [b]) => (KIND_ORDER[ITEMS[a].kind] ?? 9) - (KIND_ORDER[ITEMS[b].kind] ?? 9) || ITEMS[a].name.localeCompare(ITEMS[b].name));

  if (entries.length === 0) inv.append(el('div', 'empty', 'Пусто. Бездна ещё ничего не отдала.'));

  for (const [id, n] of entries) {
    const item = ITEMS[id];
    const cell = el('button', `item rarity-${item.rarity} kind-${item.kind}`);
    cell.dataset.item = id;
    cell.title = `${item.name}\n${item.desc}\nЦена у барыги: ${item.price}`;
    cell.append(el('span', 'item-name', item.name), el('span', 'item-count', `×${n}`));
    inv.append(cell);
  }

  const equip = $('#equip');
  equip.replaceChildren();
  for (const [label, slot, stat] of [['Оружие', p.weapon, 'atk'], ['Броня', p.armor, 'def']] as const) {
    const item = ITEMS[slot.item];
    const line = el('div', 'equip-line');
    line.append(
      el('span', 'label', label),
      el('span', 'equip-name', `${item.name}${slot.enchant ? ` +${slot.enchant}` : ''}`),
      el('span', 'equip-stat', `${stat === 'atk' ? 'АТК' : 'ЗАЩ'} ${item[stat] ?? 0}`),
    );
    equip.append(line);
  }

  g.inventoryDirty = false;
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
  $('#hud-layer').textContent = layer.short;
  $('#hud-rad').textContent = '☢'.repeat(layer.radiation) + '·'.repeat(5 - layer.radiation);
  const rage = c.passive.berserk ? ` (ярость ×${berserkMult(p, s).toFixed(2)})` : '';
  $('#hud-atk').textContent = `${s.atk} / ${s.def}${rage}`;
  document.body.classList.toggle('low-hp', p.hp / s.hp < 0.25);

  const up = $<HTMLButtonElement>('#layer-up');
  const down = $<HTMLButtonElement>('#layer-down');
  const next = LAYERS[p.layer];
  up.disabled = p.layer <= 1;
  down.disabled = !next || p.level < next.minLevel;
  down.title = next ? `${next.name} — от ${next.minLevel} уровня` : 'Глубже некуда';

  if (renderedLayerVersion !== g.layerVersion) renderLocation(g);
  for (const m of g.mobs) {
    const row = mobRows.get(m.uid);
    if (row) updateMobRow(g, m, row, now);
  }

  for (const slot of slots) {
    const key = slot.skillId ?? 'potion';
    const skill = slot.skillId ? c.skills.find((sk) => sk.id === slot.skillId) : null;
    const until = g.cooldowns[key] ?? 0;
    const total = skill ? skill.cooldownMs : 1500;
    const left = Math.max(0, until - now);
    slot.cd.style.height = `${(left / total) * 100}%`;
    if (slot.itemId && slot.count) {
      const n = p.inventory[slot.itemId] ?? 0;
      slot.count.textContent = `×${n}`;
      slot.root.classList.toggle('unavailable', n === 0);
    } else {
      slot.root.classList.toggle('unavailable', p.mp < (slot.mpCost ?? 0));
    }
  }

  if (g.inventoryDirty) renderInventory(g);
}
