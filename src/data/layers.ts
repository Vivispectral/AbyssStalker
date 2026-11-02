import type { LayerDef, LootEntry, MobDef } from '../types';

const NORMAL_RESPAWN_MS = 4000;
const MINI_BOSS_RESPAWN_MS = 15 * 60 * 1000;

type MobSpec = Omit<MobDef, 'respawnMs'> & { respawnMs?: number };

function mob(spec: MobSpec): MobDef {
  return { respawnMs: spec.miniBoss ? MINI_BOSS_RESPAWN_MS : NORMAL_RESPAWN_MS, ...spec };
}

const l = (item: string, chance: number, min?: number, max?: number): LootEntry => ({ item, chance, min, max });

export const LAYERS: LayerDef[] = [
  {
    id: 1,
    name: 'Слой I — Ржавые Окраины',
    short: 'Слой I',
    radiation: 1,
    minLevel: 1,
    desc: 'Верхний ярус Провала. Скелеты эстакад Предтеч, ржавые лифты и лагеря падальщиков. Воздух горчит нано-пылью, но здесь ещё можно дышать без фильтра.',
    economy: 'Уклад: вольный рынок. Пошлина Кардиналов — 5%. Барыги скупают любой хлам.',
    mobs: [
      mob({ id: 'rust_rat', name: 'Ржавая крыса-мутант', level: 1, hp: 35, atk: 6, def: 1, attackMs: 1800, exp: 8, gold: [1, 4],
        loot: [l('scrap_gear', 0.5), l('mutant_cartilage', 0.3), l('stim_kit', 0.05), l('chip', 0.01)] }),
      mob({ id: 'scav_husk', name: 'Одичавший падальщик', level: 3, hp: 70, atk: 10, def: 3, attackMs: 2000, exp: 18, gold: [3, 8],
        loot: [l('scrap_gear', 0.4), l('rotten_cable', 0.3), l('stim_kit', 0.08), l('ether_ampoule', 0.05), l('nano_dust', 0.05), l('chip', 0.015)] }),
      mob({ id: 'scrap_drone', name: 'Сбоящий дрон-уборщик', level: 4, hp: 90, atk: 12, def: 8, attackMs: 2200, exp: 26, gold: [5, 10],
        loot: [l('burnt_board', 0.45), l('glass_shard', 0.08), l('antirad', 0.05), l('chip', 0.02)] }),
      mob({ id: 'rat_king', name: 'Крысиный Король Отстойника', level: 6, hp: 650, atk: 20, def: 6, attackMs: 2200, exp: 220, gold: [60, 120], miniBoss: true,
        loot: [l('chip', 0.6, 1, 2), l('stim_kit', 0.8, 1, 3), l('nano_dust', 0.5, 1, 2), l('glass_shard', 0.5)] }),
    ],
  },
  {
    id: 2,
    name: 'Слой II — Шахты Литейщиков',
    short: 'Слой II',
    radiation: 2,
    minLevel: 5,
    desc: 'Бесконечные штольни, где профсоюз Литейщиков добывает реакторный шлак. Над головой гудит Пневмо-Труба Кардиналов, в тупиках шахт что-то скребётся.',
    economy: 'Уклад: картель Литейщиков. Шлак и платы скупают дороже, аптечки — втридорога.',
    mobs: [
      mob({ id: 'tunnel_crawler', name: 'Штрековый ползун', level: 6, hp: 160, atk: 18, def: 8, attackMs: 1900, exp: 45, gold: [8, 15],
        loot: [l('mutant_cartilage', 0.5), l('rotten_cable', 0.3), l('stim_kit', 0.07), l('chip', 0.02)] }),
      mob({ id: 'slag_golem', name: 'Шлаковый голем', level: 8, hp: 260, atk: 22, def: 16, attackMs: 2600, exp: 70, gold: [12, 22],
        loot: [l('reactor_slag', 0.35), l('burnt_board', 0.4), l('nano_dust', 0.1), l('chip', 0.025)] }),
      mob({ id: 'mad_foundryman', name: 'Обезумевший литейщик', level: 9, hp: 230, atk: 28, def: 10, attackMs: 2000, exp: 80, gold: [15, 28],
        loot: [l('scrap_gear', 0.5), l('ether_ampoule', 0.1), l('antirad', 0.08), l('chip', 0.03)] }),
      mob({ id: 'foreman', name: 'Бригадир-киборг Хрящ', level: 12, hp: 2400, atk: 45, def: 18, attackMs: 2300, exp: 900, gold: [200, 380], miniBoss: true,
        loot: [l('chip', 0.8, 1, 3), l('blessed_chip', 0.03), l('reactor_slag', 0.7, 1, 3), l('antirad', 0.6, 1, 2)] }),
    ],
  },
  {
    id: 3,
    name: 'Слой III — Затопленный Некрополь',
    short: 'Слой III',
    radiation: 3,
    minLevel: 10,
    desc: 'Криокапсулы Предтеч ушли под чёрную воду. Некоторые из них открыты изнутри. Курьеров здесь грабят чаще, чем где-либо.',
    economy: 'Уклад: беззаконие. Аукцион держат контрабандисты, товары с наценкой за риск.',
    mobs: [
      mob({ id: 'drowned', name: 'Утопленник-киборг', level: 11, hp: 380, atk: 34, def: 18, attackMs: 2000, exp: 130, gold: [20, 40],
        loot: [l('rotten_cable', 0.5), l('glass_shard', 0.15), l('stim_kit', 0.08), l('chip', 0.03)] }),
      mob({ id: 'cryo_wraith', name: 'Крио-призрак', level: 13, hp: 420, atk: 42, def: 14, attackMs: 1700, exp: 170, gold: [25, 50],
        loot: [l('nano_dust', 0.25), l('ether_ampoule', 0.12), l('chip', 0.035)] }),
      mob({ id: 'leech_swarm', name: 'Рой нано-пиявок', level: 15, hp: 600, atk: 38, def: 26, attackMs: 1500, exp: 220, gold: [30, 60],
        loot: [l('mutant_cartilage', 0.6, 1, 3), l('reactor_slag', 0.2), l('antirad', 0.1), l('chip', 0.04)] }),
      mob({ id: 'necro_warden', name: 'Смотритель Капсул', level: 18, hp: 6500, atk: 80, def: 30, attackMs: 2400, exp: 3000, gold: [600, 1000], miniBoss: true,
        loot: [l('chip', 0.9, 2, 4), l('blessed_chip', 0.06), l('glass_shard', 0.8, 2, 4), l('nano_dust', 0.7, 2, 4)] }),
    ],
  },
  {
    id: 4,
    name: 'Слой IV — Реакторные Ульи',
    short: 'Слой IV',
    radiation: 4,
    minLevel: 16,
    desc: 'Соты из оплавленного бетона, облепленные биомассой. Мутанты строят здесь гнёзда прямо на трубах охлаждения. Счётчик Гейгера не замолкает.',
    economy: 'Уклад: теократия Кардиналов. Экспресс-труба на поверхность — только для своих.',
    mobs: [
      mob({ id: 'hive_drone', name: 'Улейный трутень', level: 17, hp: 750, atk: 58, def: 34, attackMs: 1800, exp: 380, gold: [45, 80],
        loot: [l('mutant_cartilage', 0.6, 1, 2), l('nano_dust', 0.2), l('stim_kit', 0.1), l('chip', 0.04)] }),
      mob({ id: 'core_mantis', name: 'Ядерный богомол', level: 20, hp: 900, atk: 75, def: 30, attackMs: 1600, exp: 480, gold: [60, 110],
        loot: [l('reactor_slag', 0.4, 1, 2), l('glass_shard', 0.2), l('antirad', 0.12), l('chip', 0.045)] }),
      mob({ id: 'brood_mother', name: 'Матка-инкубатор', level: 22, hp: 1300, atk: 70, def: 48, attackMs: 2500, exp: 600, gold: [80, 140],
        loot: [l('nano_dust', 0.4, 1, 3), l('ether_ampoule', 0.15), l('chip', 0.05), l('blessed_chip', 0.003)] }),
      mob({ id: 'hive_heart', name: 'Сердце Улья', level: 25, hp: 16000, atk: 135, def: 50, attackMs: 2300, exp: 9000, gold: [1500, 2500], miniBoss: true,
        loot: [l('chip', 1, 3, 5), l('blessed_chip', 0.12), l('reactor_slag', 0.9, 3, 6), l('antirad', 0.8, 2, 4)] }),
    ],
  },
  {
    id: 5,
    name: 'Слой V — Сердце Провала',
    short: 'Слой V',
    radiation: 5,
    minLevel: 23,
    desc: 'Дно Колодца. Под ногами — оплавленный корпус Пространственного Реактора. Пространство здесь рвётся, и сквозь разрывы смотрит что-то древнее Предтеч.',
    economy: 'Уклад: закона нет. Торгуют только чипами и жизнями.',
    mobs: [
      mob({ id: 'rift_stalker', name: 'Разрывной сталкер', level: 24, hp: 1900, atk: 105, def: 60, attackMs: 1700, exp: 950, gold: [100, 180],
        loot: [l('glass_shard', 0.5, 1, 3), l('nano_dust', 0.3, 1, 2), l('stim_kit', 0.12), l('chip', 0.05)] }),
      mob({ id: 'precursor_sentinel', name: 'Страж-автомат Предтеч', level: 27, hp: 2600, atk: 125, def: 85, attackMs: 2200, exp: 1250, gold: [140, 240],
        loot: [l('burnt_board', 0.6, 2, 4), l('reactor_slag', 0.4, 1, 3), l('chip', 0.06), l('blessed_chip', 0.005)] }),
      mob({ id: 'void_seraph', name: 'Серафим Пустоты', level: 29, hp: 3000, atk: 150, def: 70, attackMs: 1800, exp: 1500, gold: [180, 300],
        loot: [l('nano_dust', 0.5, 2, 4), l('ether_ampoule', 0.2), l('antirad', 0.15), l('chip', 0.07)] }),
      mob({ id: 'reactor_echo', name: 'Эхо Реактора', level: 32, hp: 42000, atk: 230, def: 90, attackMs: 2200, exp: 30000, gold: [5000, 8000], miniBoss: true,
        loot: [l('chip', 1, 5, 8), l('blessed_chip', 0.25, 1, 2), l('glass_shard', 1, 4, 8)] }),
    ],
  },
];
