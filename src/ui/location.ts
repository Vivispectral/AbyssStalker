import { CLASSES } from '../data/classes';
import { ITEMS, SHOP } from '../data/items';
import { LAYERS, SURFACE_ID } from '../data/layers';
import { attack } from '../game/combat';
import { enterMine, leaveMine, mineRanking } from '../game/mines';
import { currentLayer } from '../game/state';
import { buy, descend, evacuateByTube, evacuateOnFoot, evacuationRisk, sellTrash, trashValue } from '../game/travel';
import type { Game, MobInstance } from '../types';
import { $, el, formatDuration } from '../util';
import { levelColor, setBar } from './format';

interface MobRow {
  root: HTMLElement;
  fill: HTMLElement;
  hpText: HTMLElement;
  status: HTMLElement;
  lvl: HTMLElement;
  btn: HTMLButtonElement;
}

let root: HTMLElement;
let renderedVersion = -1;
let mobRows = new Map<number, MobRow>();

export function mountLocation(target: HTMLElement, g: Game): void {
  root = target;
  root.addEventListener('click', (e) => {
    const node = (e.target as HTMLElement).closest<HTMLElement>('[data-attack], [data-action]');
    if (!node) return;
    if (node.dataset.attack) {
      attack(g, Number(node.dataset.attack), e.isTrusted);
      return;
    }
    switch (node.dataset.action) {
      case 'descend': return descend(g);
      case 'evac-walk': return evacuateOnFoot(g);
      case 'evac-tube': return evacuateByTube(g);
      case 'enter-mine': return enterMine(g);
      case 'leave-mine': return leaveMine(g);
      case 'sell': return sellTrash(g);
      case 'buy': return buy(g, node.dataset.item ?? '');
    }
  });
}

function header(title: string, desc: string, economy?: string): string {
  return `<h2>${title}</h2><p class="desc">${desc}</p>${economy ? `<p class="economy">${economy}</p>` : ''}`;
}

function mobRow(m: MobInstance): MobRow {
  const row = el('div', `mob${m.def.miniBoss ? ' miniboss' : ''}`);
  const info = el('div', 'mob-info');
  const nameLine = el('div', 'mob-name');
  const lvl = el('span', 'mob-lvl', `Ур. ${m.def.level}`);
  nameLine.append(lvl, document.createTextNode(` ${m.def.name}`));
  if (m.def.miniBoss) nameLine.append(el('span', 'tag', m.def.id === 'mine_boss' ? 'босс шахты' : 'мини-босс'));
  const bar = el('div', 'bar bar-mob');
  const fill = el('div', 'fill');
  const hpText = el('span');
  bar.append(fill, hpText);
  const status = el('div', 'mob-status');
  info.append(nameLine, bar, status);
  const btn = el('button', 'btn-attack', 'Атаковать');
  btn.dataset.attack = String(m.uid);
  row.append(info, btn);
  return { root: row, fill, hpText, status, lvl, btn };
}

function render(g: Game): void {
  const layer = currentLayer(g);
  mobRows = new Map();

  if (g.mine) {
    root.innerHTML = `
      ${header(`Общественная Шахта · ${layer.short}`, 'Единое пространство для всех сталкеров слоя. Добыча достаётся тому, кто нанёс больше всего урона.')}
      <div class="mine-timer" id="mine-timer"></div>
      <div class="mob-list" id="mob-list"></div>
      <h3>Сталкеры в комнате</h3>
      <div class="mine-players" id="mine-players"></div>
      <div class="mine-result" id="mine-result"></div>
      <button class="wide" data-action="leave-mine">Покинуть Шахту</button>`;
    const row = mobRow(g.mine.boss);
    $('#mob-list', root).append(row.root);
    mobRows.set(g.mine.boss.uid, row);
  } else if (layer.id === SURFACE_ID) {
    const shop = SHOP.map(
      ([id, price]) => `
        <div class="shop-row" title="${ITEMS[id].desc}">
          <span>${ITEMS[id].name}</span><span class="gold">${price}</span>
          <button data-action="buy" data-item="${id}">Купить</button>
        </div>`,
    ).join('');
    root.innerHTML = `
      ${header(layer.name, layer.desc, layer.economy)}
      <div class="section">
        <h3>Барыга</h3>
        <div class="shop-row"><span id="trash-value"></span><span></span><button data-action="sell">Сдать хлам</button></div>
      </div>
      <div class="section"><h3>Лавка Кардиналов</h3>${shop}</div>
      <button class="wide btn-descend" data-action="descend">▼ Спуститься: ${LAYERS[1].name}</button>`;
  } else {
    const next = LAYERS[layer.id + 1];
    root.innerHTML = `
      ${header(layer.name, layer.desc, layer.economy)}
      <div class="section travel">
        <div class="evac-risk" id="evac-risk"></div>
        <div class="row-buttons">
          <button data-action="evac-walk" id="evac-walk">⇧ Подъём своим ходом</button>
          <button data-action="evac-tube" id="evac-tube"></button>
        </div>
        ${next ? `<button class="wide" data-action="descend" id="descend">▼ Спуститься: ${next.short} (от ${next.minLevel} ур.)</button>` : ''}
      </div>
      <div class="portal hidden" id="portal">
        <span id="portal-text"></span>
        <button data-action="enter-mine">Войти в Шахту</button>
      </div>
      <h3>Обитатели слоя</h3>
      <div class="mob-list" id="mob-list"></div>`;
    const list = $('#mob-list', root);
    for (const m of g.mobs) {
      const row = mobRow(m);
      list.append(row.root);
      mobRows.set(m.uid, row);
    }
  }
  renderedVersion = g.layerVersion;
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
  else if (dead) status = 'Повержен';
  else if (m.stunnedUntil > now) status = 'Оглушён';
  else if (targeted) status = 'Сражается с вами';
  row.status.textContent = status;
}

function updateMine(g: Game, now: number): void {
  const mine = g.mine!;
  $('#mine-timer', root).textContent =
    mine.closesAt !== null ? `Проход закроется через ${formatDuration(mine.closesAt - now)}` : `До обрушения прохода: ${formatDuration(mine.endsAt - now)}`;
  $('#mine-result', root).textContent = mine.result ?? '';

  const ranking = mineRanking(mine, g.player.name);
  const total = ranking.reduce((a, r) => a + r.dmg, 0) || 1;
  const list = $('#mine-players', root);
  list.replaceChildren(
    ...ranking.map((r, i) => {
      const bot = mine.bots.find((b) => b.name === r.name);
      const cls = bot ? CLASSES[bot.classId].name : CLASSES[g.player.classId].name;
      const lvl = bot ? bot.level : g.player.level;
      const line = el('div', `mine-player${r.self ? ' self' : ''}${i === 0 && r.dmg > 0 ? ' leader' : ''}`);
      const bar = el('div', 'share');
      bar.style.width = `${(r.dmg / total) * 100}%`;
      line.append(
        bar,
        el('span', 'mp-name', `${r.self ? 'Вы' : r.name}`),
        el('span', 'mp-class', `${cls}, ${lvl} ур.`),
        el('span', 'mp-dmg', `${r.dmg.toLocaleString('ru-RU')} (${Math.round((r.dmg / total) * 100)}%)`),
      );
      return line;
    }),
  );
}

function updateLayer(g: Game, now: number): void {
  const risk = evacuationRisk(g);
  const riskEl = $('#evac-risk', root);
  riskEl.className = `evac-risk ${risk.missing ? 'danger' : 'ok'}`;
  riskEl.textContent = risk.missing
    ? `Подъём: нужно ${risk.need} антирада, у вас ${risk.have}. Радиация сожжёт ${Math.round(risk.radDamagePct * 100)}% HP, потеряете половину добычи.`
    : `Подъём: нужно ${risk.need} антирада, у вас ${risk.have}. Дорога безопасна.`;
  const tube = $<HTMLButtonElement>('#evac-tube', root);
  tube.textContent = `⇧ Экспресс-труба · ${risk.tubeCost} зол.`;
  tube.disabled = g.player.gold < risk.tubeCost;

  const descendBtn = root.querySelector<HTMLButtonElement>('#descend');
  const next = LAYERS[g.player.layer + 1];
  if (descendBtn && next) descendBtn.disabled = g.player.level < next.minLevel;

  const portal = $('#portal', root);
  portal.classList.toggle('hidden', !g.portal);
  if (g.portal) $('#portal-text', root).textContent = `Скрытый проход в Общественные Шахты! Закроется через ${formatDuration(g.portal.expiresAt - now)}`;
}

export function updateLocation(g: Game, now: number): void {
  if (renderedVersion !== g.layerVersion) render(g);
  for (const [uid, row] of mobRows) {
    const mob = g.mine?.boss.uid === uid ? g.mine.boss : g.mobs.find((m) => m.uid === uid);
    if (mob) updateMobRow(g, mob, row, now);
  }
  if (g.mine) updateMine(g, now);
  else if (g.player.layer === SURFACE_ID) $('#trash-value', root).textContent = `Хлам в рюкзаке на ${trashValue(g)} зол.`;
  else updateLayer(g, now);
}
