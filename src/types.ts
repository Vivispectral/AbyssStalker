export type ClassId = 'guardian' | 'psionic' | 'gunner' | 'assassin' | 'titan';

export interface Stats {
  hp: number;
  mp: number;
  atk: number;
  def: number;
  crit: number;
}

export interface ClassPassive {
  reflectPct?: number;
  armorPen?: number;
  critBonus?: number;
  critMult?: number;
  berserk?: boolean;
  stunChance?: number;
  lifestealPct?: number;
}

export interface SkillEffect {
  mult?: number;
  hits?: number;
  stunMs?: number;
  healPct?: number;
  lifestealPct?: number;
  ignoreDef?: boolean;
  forceCrit?: boolean;
  selfDamagePct?: number;
}

export interface SkillDef {
  id: string;
  name: string;
  desc: string;
  mpCost: number;
  cooldownMs: number;
  requiresTarget: boolean;
  effect: SkillEffect;
}

export interface ClassDef {
  id: ClassId;
  name: string;
  role: string;
  desc: string;
  passiveDesc: string;
  base: Stats;
  perLevel: Stats;
  passive: ClassPassive;
  startWeapon: string;
  startArmor: string;
  skills: SkillDef[];
}

export type ItemKind = 'trash' | 'consumable' | 'chip' | 'material' | 'weapon' | 'armor';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic';

export interface ItemDef {
  id: string;
  name: string;
  kind: ItemKind;
  rarity: Rarity;
  desc: string;
  price: number;
  use?: { hpPct?: number; mpPct?: number };
  atk?: number;
  def?: number;
}

export interface LootEntry {
  item: string;
  chance: number;
  min?: number;
  max?: number;
}

export interface MobDef {
  id: string;
  name: string;
  level: number;
  hp: number;
  atk: number;
  def: number;
  attackMs: number;
  exp: number;
  gold: [number, number];
  loot: LootEntry[];
  respawnMs: number;
  miniBoss?: boolean;
}

export interface LayerDef {
  id: number;
  name: string;
  short: string;
  desc: string;
  economy: string;
  radiation: number;
  minLevel: number;
  mobs: MobDef[];
}

export interface Equipped {
  item: string;
  enchant: number;
}

export interface Player {
  name: string;
  classId: ClassId;
  level: number;
  exp: number;
  hp: number;
  mp: number;
  gold: number;
  layer: number;
  weapon: Equipped;
  armor: Equipped;
  inventory: Record<string, number>;
  kills: number;
  deaths: number;
  bossRespawns: Record<string, number>;
}

export interface MobInstance {
  uid: number;
  def: MobDef;
  hp: number;
  respawnAt: number | null;
  stunnedUntil: number;
  nextAttackAt: number;
}

export interface Game {
  player: Player;
  mobs: MobInstance[];
  targetUid: number | null;
  cooldowns: Record<string, number>;
  lastCombatAt: number;
  lastClickAt: number;
  lastRegenAt: number;
  layerVersion: number;
  inventoryDirty: boolean;
  nextUid: number;
}
