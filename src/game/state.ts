import { CONFIG } from '../config';
import { CLASSES } from '../data/classes';
import { ITEMS, QUALITY } from '../data/items';
import { LAYERS, SURFACE_ID } from '../data/layers';
import type { ClassId, Game, ItemStack, LayerDef, Player, Quality, SlotId, Stats } from '../types';

const SAVE_KEY = 'abyss-stalker:save:v2';
const LEGACY_SAVE_KEY = 'abyss-stalker:save:v1';

export function expToNext(level: number): number {
  return Math.round(40 * Math.pow(level, 1.7));
}

export function currentLayer(g: Game): LayerDef {
  return LAYERS[g.player.layer];
}

// ---------- Предметы ----------

export function displayName(stack: ItemStack): string {
  const def = ITEMS[stack.id];
  return stack.enchant > 0 ? `${def.name} +${stack.enchant}` : def.name;
}

export function itemBonus(stack: ItemStack): Stats {
  const base = ITEMS[stack.id].stats ?? {};
  const q = QUALITY[stack.quality].mult;
  const e = stack.enchant;
  const scale = (v?: number) => (v ? Math.round(v * q * (1 + 0.1 * e)) + e : 0);
  return {
    hp: scale(base.hp),
    mp: scale(base.mp),
    atk: scale(base.atk),
    def: scale(base.def),
    crit: base.crit ? base.crit * q * (1 + 0.1 * e) : 0,
  };
}

export function rollQuality(luck = 0): Quality {
  const entries = Object.entries(QUALITY) as [Quality, (typeof QUALITY)[Quality]][];
  const weights = entries.map(([id, q], i) => (id === 'worn' ? Math.max(0, q.weight - luck * 25) : q.weight + luck * i * 8));
  let roll = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < entries.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return entries[i][0];
  }
  return 'common';
}

function newStack(p: Player, id: string, count: number, quality: Quality = 'common', enchant = 0): ItemStack {
  return { uid: p.nextItemUid++, id, count, enchant, quality };
}

export function addItem(p: Player, id: string, n = 1, quality?: Quality): boolean {
  const def = ITEMS[id];
  if (!def) return false;
  if (def.kind !== 'equipment') {
    const stack = p.inventory.find((s) => s.id === id);
    if (stack) {
      stack.count += n;
      return true;
    }
  }
  if (p.inventory.length >= CONFIG.inventorySize) return false;
  p.inventory.push(newStack(p, id, def.kind === 'equipment' ? 1 : n, def.kind === 'equipment' ? (quality ?? rollQuality()) : 'common'));
  return true;
}

export function countItem(p: Player, id: string): number {
  return p.inventory.reduce((sum, s) => (s.id === id ? sum + s.count : sum), 0);
}

export function takeItem(p: Player, id: string, n = 1): boolean {
  const stack = p.inventory.find((s) => s.id === id);
  if (!stack || stack.count < n) return false;
  stack.count -= n;
  if (stack.count <= 0) p.inventory.splice(p.inventory.indexOf(stack), 1);
  return true;
}

export function findStack(p: Player, uid: number): { stack: ItemStack; slot: SlotId | null } | null {
  const inv = p.inventory.find((s) => s.uid === uid);
  if (inv) return { stack: inv, slot: null };
  for (const [slot, stack] of Object.entries(p.equipment) as [SlotId, ItemStack | null][]) {
    if (stack?.uid === uid) return { stack, slot };
  }
  return null;
}

export function removeStack(p: Player, uid: number): void {
  const i = p.inventory.findIndex((s) => s.uid === uid);
  if (i >= 0) p.inventory.splice(i, 1);
  for (const slot of Object.keys(p.equipment) as SlotId[]) {
    if (p.equipment[slot]?.uid === uid) p.equipment[slot] = null;
  }
}

// ---------- Характеристики ----------

export function getStats(p: Player): Stats {
  const c = CLASSES[p.classId];
  const lvl = p.level - 1;
  const s: Stats = {
    hp: Math.round(c.base.hp + c.perLevel.hp * lvl),
    mp: Math.round(c.base.mp + c.perLevel.mp * lvl),
    atk: Math.round(c.base.atk + c.perLevel.atk * lvl),
    def: Math.round(c.base.def + c.perLevel.def * lvl),
    crit: c.base.crit + (c.passive.critBonus ?? 0),
  };
  for (const stack of Object.values(p.equipment)) {
    if (!stack) continue;
    const b = itemBonus(stack);
    s.hp += b.hp;
    s.mp += b.mp;
    s.atk += b.atk;
    s.def += b.def;
    s.crit += b.crit;
  }
  return s;
}

export function clampVitals(p: Player): void {
  const s = getStats(p);
  p.hp = Math.min(p.hp, s.hp);
  p.mp = Math.min(p.mp, s.mp);
}

export function berserkMult(p: Player, s: Stats): number {
  return 1 + (1 - p.hp / s.hp) * 1.5;
}

// ---------- Персонаж и сохранение ----------

export function createPlayer(name: string, classId: ClassId): Player {
  const c = CLASSES[classId];
  const p: Player = {
    name,
    classId,
    level: 1,
    exp: 0,
    hp: 0,
    mp: 0,
    gold: 50,
    layer: SURFACE_ID,
    equipment: { weapon: null, armor: null, helmet: null, bio: null },
    inventory: [],
    nextItemUid: 1,
    kills: 0,
    deaths: 0,
    bossRespawns: {},
  };
  p.equipment.weapon = newStack(p, c.startWeapon, 1);
  p.equipment.armor = newStack(p, c.startArmor, 1);
  addItem(p, 'stim_kit', 3);
  addItem(p, 'ether_ampoule', 2);
  addItem(p, 'antirad', 2);
  addItem(p, 'chip_basic', 2);
  const s = getStats(p);
  p.hp = s.hp;
  p.mp = s.mp;
  return p;
}

export function savePlayer(p: Player): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(p));
}

export function loadPlayer(): Player | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Player;
      if (CLASSES[p.classId] && LAYERS[p.layer] && Array.isArray(p.inventory)) return p;
    }
    const legacy = localStorage.getItem(LEGACY_SAVE_KEY);
    if (legacy) return migrateV1(JSON.parse(legacy));
  } catch {
    // Повреждённый сейв — начинаем заново.
  }
  return null;
}

interface SaveV1 {
  name: string;
  classId: ClassId;
  level: number;
  exp: number;
  gold: number;
  kills: number;
  deaths: number;
  weapon?: { item: string; enchant: number };
  armor?: { item: string; enchant: number };
  inventory?: Record<string, number>;
}

const V1_RENAMES: Record<string, string> = { chip: 'chip_basic', blessed_chip: 'chip_safe', scrap_gear: 'scrap_metal' };

function migrateV1(old: SaveV1): Player | null {
  if (!CLASSES[old.classId]) return null;
  const p = createPlayer(old.name, old.classId);
  p.inventory = [];
  Object.assign(p, { level: old.level, exp: old.exp, gold: old.gold, kills: old.kills, deaths: old.deaths });
  if (old.weapon && ITEMS[old.weapon.item]) p.equipment.weapon = newStack(p, old.weapon.item, 1, 'common', old.weapon.enchant);
  if (old.armor && ITEMS[old.armor.item]) p.equipment.armor = newStack(p, old.armor.item, 1, 'common', old.armor.enchant);
  for (const [id, n] of Object.entries(old.inventory ?? {})) {
    const newId = V1_RENAMES[id] ?? id;
    if (ITEMS[newId]) addItem(p, newId, n);
  }
  const s = getStats(p);
  p.hp = s.hp;
  p.mp = s.mp;
  localStorage.removeItem(LEGACY_SAVE_KEY);
  return p;
}

export function wipeSave(): void {
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(LEGACY_SAVE_KEY);
}

export function createGame(player: Player): Game {
  return {
    player,
    mobs: [],
    targetUid: null,
    viewUid: null,
    cooldowns: {},
    lastCombatAt: 0,
    lastClickAt: 0,
    lastRegenAt: 0,
    layerVersion: 0,
    inventoryDirty: true,
    nextUid: 1,
    portal: null,
    mine: null,
    gaze: { until: 0, clicks: [] },
  };
}
