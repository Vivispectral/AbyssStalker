import { SURFACE_ID } from '../data/layers';
import { attack, findMob } from '../game/combat';
import { on } from '../game/events';
import { currentLayer } from '../game/state';
import type { Game, MobInstance } from '../types';
import { $, el, formatDuration } from '../util';
import { setBar } from './format';

const TEMPLATE = `
  <div class="vp-bg"></div>
  <div class="vp-scene"></div>
  <div class="vp-shade"></div>
  <div class="vp-title"></div>
  <div class="vp-target">
    <div class="vp-name"></div>
    <div class="bar bar-mob"><div class="fill"></div><span></span></div>
  </div>
  <div class="vp-hint"></div>
  <div class="vp-fx"></div>
`;

interface Slot {
  x: number;
  bottom: number;
  height: number;
}

// Позиции на сцене в процентах: x — центр, bottom — линия ног, height — рост.
const BOSS_SLOT: Slot = { x: 50, bottom: 20, height: 56 };
const MOB_SLOTS: Slot[] = [
  { x: 27, bottom: 12, height: 40 },
  { x: 73, bottom: 12, height: 40 },
  { x: 9, bottom: 4, height: 46 },
  { x: 91, bottom: 4, height: 46 },
  { x: 37, bottom: 30, height: 28 },
  { x: 63, bottom: 30, height: 28 },
  { x: 17, bottom: 28, height: 30 },
  { x: 83, bottom: 28, height: 30 },
  { x: 50, bottom: 46, height: 20 },
  { x: 30, bottom: 44, height: 20 },
];
const MINE_BOSS_SLOT: Slot = { x: 50, bottom: 6, height: 78 };

// Куда смотрят профильные спрайты в исходнике; разворачиваем их лицом к центру сцены.
const FACING: Record<string, 'left' | 'right'> = { zombie: 'right', beast: 'left' };

const CLICK_POINT_TTL_MS = 150;

interface SceneMob {
  root: HTMLElement;
  body: HTMLElement;
  hpFill: HTMLElement;
  label: HTMLElement;
}

let root: HTMLElement;
let refs: Record<'bg' | 'scene' | 'title' | 'target' | 'name' | 'fill' | 'hpText' | 'hint' | 'fx', HTMLElement>;
let scene = new Map<number, SceneMob>();
let sceneKey = '';
let lastClick: { x: number; y: number; t: number } | null = null;
let shownBg = '';

const spriteUrl = (id: string) => `${import.meta.env.BASE_URL}art/c_${id}.webp`;

function restartAnimation(node: HTMLElement, cls: string): void {
  node.classList.remove(cls);
  void node.offsetWidth;
  node.classList.add(cls);
}

function floatText(text: string, cls: string, x: number, y: number): void {
  const node = el('span', `float-text ${cls}`, text);
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  node.addEventListener('animationend', () => node.remove());
  refs.fx.append(node);
}

function hitPoint(uid: number): { x: number; y: number } {
  if (lastClick && Date.now() - lastClick.t < CLICK_POINT_TTL_MS) return lastClick;
  const mob = scene.get(uid);
  const origin = root.getBoundingClientRect();
  if (!mob) return { x: origin.width / 2, y: origin.height / 2 };
  const box = mob.body.getBoundingClientRect();
  return {
    x: box.left - origin.left + box.width / 2 + (Math.random() - 0.5) * box.width * 0.4,
    y: box.top - origin.top + box.height * 0.3,
  };
}

// Перемешиваем виды мобов, чтобы одинаковые не стояли кучкой.
function arrange(mobs: MobInstance[]): MobInstance[] {
  const groups = new Map<string, MobInstance[]>();
  for (const m of mobs) groups.set(m.def.id, [...(groups.get(m.def.id) ?? []), m]);
  const lists = [...groups.values()];
  const out: MobInstance[] = [];
  for (let i = 0; out.length < mobs.length; i++) {
    for (const list of lists) if (list[i]) out.push(list[i]);
  }
  return out;
}

function buildScene(g: Game): void {
  refs.scene.replaceChildren();
  scene = new Map();

  const placed: [MobInstance, Slot][] = [];
  if (g.mine) {
    placed.push([g.mine.boss, MINE_BOSS_SLOT]);
  } else {
    const bosses = g.mobs.filter((m) => m.def.miniBoss);
    const normals = arrange(g.mobs.filter((m) => !m.def.miniBoss));
    bosses.forEach((m) => placed.push([m, BOSS_SLOT]));
    normals.slice(0, MOB_SLOTS.length).forEach((m, i) => placed.push([m, MOB_SLOTS[i]]));
  }

  for (const [m, slot] of placed) {
    const node = el('div', `vp-mob${m.def.miniBoss ? ' boss' : ''}`);
    node.dataset.uid = String(m.uid);
    node.style.left = `${slot.x}%`;
    node.style.bottom = `${slot.bottom}%`;
    node.style.height = `${slot.height}%`;
    node.style.zIndex = String(100 - slot.bottom);

    const body = el('div', 'vp-mob-body');
    const img = el('img', 'vp-mob-img');
    img.src = spriteUrl(m.def.sprite);
    img.alt = m.def.name;
    img.draggable = false;
    const facing = FACING[m.def.sprite];
    if ((facing === 'left' && slot.x < 50) || (facing === 'right' && slot.x > 50)) img.classList.add('flip');
    body.append(img);

    const hp = el('div', 'vp-mob-hp');
    const hpFill = el('div', 'fill');
    hp.append(hpFill);
    const label = el('div', 'vp-mob-label', m.def.name);
    node.append(label, hp, body);
    refs.scene.append(node);
    scene.set(m.uid, { root: node, body, hpFill, label });
  }
}

export function mountViewport(target: HTMLElement, g: Game): void {
  root = target;
  root.innerHTML = TEMPLATE;
  refs = {
    bg: $('.vp-bg', root),
    scene: $('.vp-scene', root),
    title: $('.vp-title', root),
    target: $('.vp-target', root),
    name: $('.vp-name', root),
    fill: $('.vp-target .fill', root),
    hpText: $('.vp-target span', root),
    hint: $('.vp-hint', root),
    fx: $('.vp-fx', root),
  };

  refs.scene.addEventListener('click', (e) => {
    const node = (e.target as HTMLElement).closest<HTMLElement>('.vp-mob');
    if (!node?.dataset.uid) return;
    const origin = root.getBoundingClientRect();
    lastClick = { x: e.clientX - origin.left, y: e.clientY - origin.top, t: Date.now() };
    attack(g, Number(node.dataset.uid), e.isTrusted);
  });

  on('mobHit', ({ uid, dmg, crit }) => {
    const mob = scene.get(uid);
    if (!mob) return;
    restartAnimation(mob.body, 'hit');
    const { x, y } = hitPoint(uid);
    floatText(crit ? `${dmg}!` : String(dmg), crit ? 'crit' : 'dmg', x, y);
  });

  on('playerHit', ({ dmg }) => {
    restartAnimation(root, 'player-hit');
    floatText(`-${dmg}`, 'taken', 40 + Math.random() * 40, root.clientHeight - 60);
  });
}

export function updateViewport(g: Game, now: number): void {
  const layer = currentLayer(g);
  const bg = layer.art ? `url("${layer.art}")` : '';
  if (bg !== shownBg) {
    shownBg = bg;
    refs.bg.style.backgroundImage = bg;
    root.dataset.layer = String(layer.id);
  }

  const key = `${g.layerVersion}:${g.mine?.boss.uid ?? ''}`;
  if (key !== sceneKey) {
    sceneKey = key;
    buildScene(g);
  }

  for (const [uid, view] of scene) {
    const mob = findMob(g, uid);
    if (!mob) continue;
    const dead = mob.hp <= 0;
    const alive = !dead && (g.targetUid === uid || g.mine?.boss === mob);
    view.root.classList.toggle('alive', alive);
    view.root.classList.toggle('dead', dead);
    view.root.classList.toggle('stunned', !dead && mob.stunnedUntil > now);
    view.root.classList.toggle('wounded', !dead && mob.hp < mob.def.hp);
    view.hpFill.style.width = `${(mob.hp / mob.def.hp) * 100}%`;
  }

  refs.title.textContent = g.mine ? `Общественная Шахта · ${layer.short}` : layer.name;
  const focus = findMob(g, g.viewUid);
  root.classList.toggle('no-target', !focus);
  root.classList.toggle('empty', scene.size === 0);

  if (scene.size === 0) {
    refs.hint.textContent = layer.id === SURFACE_ID ? 'Лагерь у Провала. Здесь безопасно — спуститесь, чтобы охотиться.' : '';
    return;
  }
  if (!focus) {
    refs.hint.textContent = 'Обитатели слоя дремлют. Кликните по монстру, чтобы напасть.';
    return;
  }

  refs.name.textContent = `Ур. ${focus.def.level} · ${focus.def.name}`;
  setBar(refs.fill, refs.hpText, focus.hp, focus.def.hp, 'HP');
  if (focus.hp <= 0) refs.hint.textContent = focus.respawnAt ? `Повержен · респаун через ${formatDuration(focus.respawnAt - now)}` : 'Повержен';
  else if (focus.stunnedUntil > now) refs.hint.textContent = 'Оглушён';
  else refs.hint.textContent = g.targetUid === focus.uid ? 'Кликайте по монстру, чтобы бить' : 'Кликните, чтобы атаковать';
}
