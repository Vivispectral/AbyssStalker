import type { ClassDef, ClassId } from '../types';

const list: ClassDef[] = [
  {
    id: 'guardian',
    name: 'Страж',
    role: 'Танк / Фронтмен',
    desc: 'Закованный в пластины Предтеч. Держит удар, пока другие делают дело.',
    passiveDesc: 'Пластины отражают 20% полученного урона.',
    base: { hp: 150, mp: 40, atk: 9, def: 8, crit: 0.05 },
    perLevel: { hp: 24, mp: 3, atk: 3, def: 2.2, crit: 0 },
    passive: { reflectPct: 0.2 },
    startWeapon: 'w_guardian',
    startArmor: 'a_guardian',
    skills: [
      { id: 'g_crush', name: 'Сокрушающий удар', desc: 'Урон ×1.8 и оглушение на 1.5 с.', mpCost: 10, cooldownMs: 6000, requiresTarget: true, effect: { mult: 1.8, stunMs: 1500 } },
      { id: 'g_plate', name: 'Сварка пластин', desc: 'Восстанавливает 25% HP.', mpCost: 15, cooldownMs: 15000, requiresTarget: false, effect: { healPct: 0.25 } },
    ],
  },
  {
    id: 'psionic',
    name: 'Псионик',
    role: 'Масс-контроль / Дебафф',
    desc: 'Нейро-импланты превращают эфир в психо-удары. Хрупок, но враги не успевают ответить.',
    passiveDesc: '10% шанс оглушить врага ударом на 1 с.',
    base: { hp: 95, mp: 90, atk: 11, def: 4, crit: 0.07 },
    perLevel: { hp: 14, mp: 8, atk: 3.6, def: 1.2, crit: 0 },
    passive: { stunChance: 0.1 },
    startWeapon: 'w_psionic',
    startArmor: 'a_psionic',
    skills: [
      { id: 'p_needle', name: 'Психо-игла', desc: 'Урон ×2.2.', mpCost: 12, cooldownMs: 4000, requiresTarget: true, effect: { mult: 2.2 } },
      { id: 'p_paralysis', name: 'Нейро-паралич', desc: 'Урон ×0.5 и оглушение на 4 с.', mpCost: 20, cooldownMs: 14000, requiresTarget: true, effect: { mult: 0.5, stunMs: 4000 } },
    ],
  },
  {
    id: 'gunner',
    name: 'Стрелок',
    role: 'Точечный дальнобойный урон',
    desc: 'Прицельные комплексы Предтеч. Каждый выстрел — в уязвимое место.',
    passiveDesc: 'Игнорирует 30% брони врага.',
    base: { hp: 105, mp: 55, atk: 13, def: 4, crit: 0.1 },
    perLevel: { hp: 15, mp: 4, atk: 4, def: 1.2, crit: 0 },
    passive: { armorPen: 0.3 },
    startWeapon: 'w_gunner',
    startArmor: 'a_gunner',
    skills: [
      { id: 'gn_aimed', name: 'Прицельный выстрел', desc: 'Урон ×2.5, полностью игнорирует броню.', mpCost: 14, cooldownMs: 6000, requiresTarget: true, effect: { mult: 2.5, ignoreDef: true } },
      { id: 'gn_burst', name: 'Очередь', desc: '3 выстрела по ×0.8.', mpCost: 18, cooldownMs: 10000, requiresTarget: true, effect: { mult: 0.8, hits: 3 } },
    ],
  },
  {
    id: 'assassin',
    name: 'Ассасин',
    role: 'Скрытность / Бурст / PvP',
    desc: 'Мономолекулярные клинки и плащ-хамелеон. Гроза курьеров на глубоких слоях.',
    passiveDesc: '+10% к шансу крита, криты наносят ×2.5.',
    base: { hp: 100, mp: 50, atk: 12, def: 5, crit: 0.08 },
    perLevel: { hp: 15, mp: 4, atk: 3.8, def: 1.4, crit: 0 },
    passive: { critBonus: 0.1, critMult: 2.5 },
    startWeapon: 'w_assassin',
    startArmor: 'a_assassin',
    skills: [
      { id: 'as_shadow', name: 'Удар из тени', desc: 'Гарантированный крит ×1.4.', mpCost: 15, cooldownMs: 8000, requiresTarget: true, effect: { mult: 1.4, forceCrit: true } },
      { id: 'as_flurry', name: 'Мономолекулярный вихрь', desc: '4 удара по ×0.55.', mpCost: 16, cooldownMs: 11000, requiresTarget: true, effect: { mult: 0.55, hits: 4 } },
    ],
  },
  {
    id: 'titan',
    name: 'Титан',
    role: 'Стеклянная пушка / Вампиризм',
    desc: 'Берсерк, накачанный реакторной пылью. Чем ближе к смерти, тем страшнее.',
    passiveDesc: 'Урон растёт до ×2.5 при падении HP. 8% вампиризма.',
    base: { hp: 130, mp: 30, atk: 15, def: 2, crit: 0.08 },
    perLevel: { hp: 20, mp: 2, atk: 4.6, def: 0.6, crit: 0 },
    passive: { berserk: true, lifestealPct: 0.08 },
    startWeapon: 'w_titan',
    startArmor: 'a_titan',
    skills: [
      { id: 't_harvest', name: 'Кровавая жатва', desc: 'Урон ×2, 50% урона возвращается в HP.', mpCost: 10, cooldownMs: 6000, requiresTarget: true, effect: { mult: 2, lifestealPct: 0.5 } },
      { id: 't_burn', name: 'Самосожжение', desc: 'Сжигает 15% своего HP, затем урон ×4.', mpCost: 0, cooldownMs: 10000, requiresTarget: true, effect: { selfDamagePct: 0.15, mult: 4 } },
    ],
  },
];

export const CLASSES: Record<ClassId, ClassDef> = Object.fromEntries(list.map((c) => [c.id, c])) as Record<ClassId, ClassDef>;

export const CLASS_LIST = list;
