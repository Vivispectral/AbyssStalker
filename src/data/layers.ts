import type { LayerDef, LootEntry, MobDef } from '../types';

const NORMAL_RESPAWN_MS = 4000;
const MINI_BOSS_RESPAWN_MS = 15 * 60 * 1000;

type MobSpec = Omit<MobDef, 'respawnMs'> & { respawnMs?: number };

function mob(spec: MobSpec): MobDef {
  return { respawnMs: spec.miniBoss ? MINI_BOSS_RESPAWN_MS : NORMAL_RESPAWN_MS, ...spec };
}

const l = (item: string, chance: number, min?: number, max?: number): LootEntry => ({ item, chance, min, max });

const art = (file: string) => `${import.meta.env.BASE_URL}art/${file}`;

export const SURFACE_ID = 0;

// Индекс в массиве совпадает с id слоя; 0 — поверхность.
export const LAYERS: LayerDef[] = [
  {
    id: 0,
    name: 'Поверхность — Лагерь у Провала',
    short: 'Поверхность',
    radiation: 0,
    minLevel: 1,
    desc: 'Частокол из ржавых листов на краю Колодца. Костры, барыги, лавка Кардиналов и шум Пневмо-Трубы. Здесь не стреляют — по крайней мере, днём.',
    economy: 'Барыга скупает хлам. Лавка Кардиналов торгует антирадом и чипами.',
    mobs: [],
  },
  {
    id: 1,
    name: 'Слой I — Склепы Пепельных Полей',
    short: 'Слой I',
    radiation: 1,
    minLevel: 1,
    art: art('layer1.jpg'),
    desc: 'Развалины готических каменных замков, перемешанные с ржавыми балочными конструкциями Предтеч. В воздухе висит серый радиоактивный пепел, под ногами тлеют угли.',
    economy: 'Уклад: вольные старатели. Пошлина Кардиналов на подъём — 5%.',
    mobs: [
      mob({ id: 'zombie_miner', name: 'Зомби-старатель', level: 1, hp: 40, atk: 6, def: 1, attackMs: 1900, exp: 9, gold: [1, 5], sprite: 'zombie',
        loot: [l('scrap_metal', 0.4), l('mutant_cartilage', 0.22), l('ash_resin', 0.18), l('trench_spade', 0.035), l('ash_bracer', 0.03), l('miner_helmet', 0.02), l('chip_basic', 0.04), l('stim_kit', 0.06)] }),
      mob({ id: 'burnt_turret', name: 'Перегоревшая автоматическая турель', level: 3, hp: 85, atk: 11, def: 8, attackMs: 2200, exp: 22, gold: [4, 9], sprite: 'turret',
        loot: [l('scrap_metal', 0.4, 1, 2), l('burnt_board', 0.3), l('ash_resin', 0.12), l('turret_lance', 0.03), l('servo_rib', 0.025), l('cracked_lamp', 0.02), l('bio_pulse', 0.02), l('chip_basic', 0.05), l('antirad', 0.07)] }),
      mob({ id: 'barrow_devourer', name: 'Курганный Пожиратель', level: 6, hp: 650, atk: 20, def: 6, attackMs: 2200, exp: 220, gold: [60, 120], miniBoss: true, sprite: 'beast',
        loot: [l('chip_basic', 0.7, 1, 2), l('chip_improved', 0.15), l('barrow_fang', 0.28), l('crypt_plate', 0.22), l('ash_gland', 0.18), l('rusty_blade', 0.12), l('stim_kit', 0.7, 1, 3), l('nano_dust', 0.4, 1, 2), l('ash_resin', 0.5, 1, 2)] }),
    ],
  },
  {
    id: 2,
    name: 'Слой II — Ржавый Завод Смерти',
    short: 'Слой II',
    radiation: 2,
    minLevel: 5,
    art: art('layer2.jpg'),
    desc: 'Заброшенный подземный завод Предтеч. Застрявшие буровые платформы, зелёные испарения химикатов, гудящие трубы и капающая с потолка слизь.',
    economy: 'Уклад: картель Литейщиков. Подъём из шахт — по их пропускам.',
    mobs: [
      mob({ id: 'mutant_assembler', name: 'Мутировавший сборщик', level: 6, hp: 180, atk: 19, def: 9, attackMs: 1900, exp: 50, gold: [8, 16], sprite: 'assembler',
        loot: [l('mutant_cartilage', 0.35), l('rotten_cable', 0.3), l('acid_salt', 0.2), l('assembler_saw', 0.03), l('acid_apron', 0.025), l('welder_hood', 0.02), l('energy_cutter', 0.015), l('gas_mask', 0.015), l('chip_basic', 0.05), l('chip_improved', 0.015), l('stim_kit', 0.07)] }),
      mob({ id: 'disposal_drone', name: 'Силовой дрон-утилизатор', level: 8, hp: 260, atk: 24, def: 16, attackMs: 2400, exp: 75, gold: [12, 22], sprite: 'drone',
        loot: [l('burnt_board', 0.35), l('reactor_slag', 0.22), l('acid_salt', 0.15), l('drone_pincer', 0.03), l('piston_cage', 0.025), l('coolant_node', 0.02), l('steel_exo_vest', 0.015), l('bio_adrenal', 0.015), l('chip_basic', 0.04), l('chip_improved', 0.02), l('antirad', 0.08)] }),
      mob({ id: 'foreman', name: 'Бригадир-киборг Хрящ', level: 12, hp: 2400, atk: 45, def: 18, attackMs: 2300, exp: 900, gold: [200, 380], miniBoss: true, sprite: 'assembler',
        loot: [l('chip_improved', 0.55, 1, 2), l('chip_safe', 0.05), l('rivet_hammer', 0.25), l('foundry_frame', 0.2), l('overclock_gland', 0.16), l('energy_cutter', 0.12), l('steel_exo_vest', 0.1), l('reactor_slag', 0.6, 1, 3), l('acid_salt', 0.4, 1, 2), l('antirad', 0.5, 1, 2)] }),
    ],
  },
  {
    id: 3,
    name: 'Слой III — Стеклянный Сектор Анабиоза',
    short: 'Слой III',
    radiation: 3,
    minLevel: 10,
    art: art('layer3.jpg'),
    desc: 'Оплавленный футуристический небоскрёб, погребённый под землёй. Разбитые капсулы анабиоза, синеватое неоновое свечение и плавающие в воздухе кристаллы нано-пыли.',
    economy: 'Уклад: беззаконие. Контрабандисты берут за подъём втридорога.',
    mobs: [
      mob({ id: 'psi_phantom', name: 'Пси-фантом', level: 11, hp: 400, atk: 38, def: 14, attackMs: 1700, exp: 140, gold: [20, 40], sprite: 'phantom',
        loot: [l('nano_dust', 0.25), l('glass_shard', 0.22), l('cryo_flake', 0.15), l('phantom_needle', 0.025), l('static_veil', 0.02), l('frost_lens', 0.018), l('psi_staff', 0.012), l('bio_neuro', 0.012), l('chip_basic', 0.04), l('chip_safe', 0.008), l('ether_ampoule', 0.1)] }),
      mob({ id: 'automaton_keeper', name: 'Автоматон-Хранитель', level: 14, hp: 620, atk: 40, def: 28, attackMs: 2300, exp: 210, gold: [28, 55], sprite: 'automaton',
        loot: [l('burnt_board', 0.3, 1, 2), l('glass_shard', 0.25), l('cryo_flake', 0.18), l('keeper_glaive', 0.025), l('capsule_shell', 0.02), l('frost_lens', 0.015), l('monolith_armor', 0.012), l('cryo_visor', 0.012), l('chip_improved', 0.025), l('chip_safe', 0.01), l('antirad', 0.1)] }),
      mob({ id: 'capsule_warden', name: 'Смотритель Капсул', level: 18, hp: 6500, atk: 80, def: 30, attackMs: 2400, exp: 3000, gold: [600, 1000], miniBoss: true, sprite: 'automaton',
        loot: [l('chip_improved', 0.7, 1, 3), l('chip_safe', 0.18), l('warden_visor', 0.22), l('stasis_core', 0.2), l('keeper_glaive', 0.16), l('capsule_shell', 0.14), l('psi_staff', 0.12), l('monolith_armor', 0.1), l('glass_shard', 0.6, 2, 4), l('nano_dust', 0.5, 2, 4), l('cryo_flake', 0.5, 1, 3)] }),
    ],
  },
  {
    id: 4,
    name: 'Слой IV — Реакторные Ульи',
    short: 'Слой IV',
    radiation: 4,
    minLevel: 16,
    desc: 'Соты из оплавленного бетона, облепленные биомассой. Мутанты строят здесь гнёзда прямо на трубах охлаждения. Счётчик Гейгера не замолкает.',
    economy: 'Уклад: теократия Кардиналов. Экспресс-труба — только для своих.',
    mobs: [
      mob({ id: 'hive_drone', name: 'Улейный трутень', level: 17, hp: 750, atk: 58, def: 34, attackMs: 1800, exp: 380, gold: [45, 80], sprite: 'insect',
        loot: [l('mutant_cartilage', 0.45, 1, 2), l('nano_dust', 0.15), l('hive_wax', 0.2), l('drone_stinger', 0.025), l('chitin_mail', 0.02), l('hive_carapace', 0.012), l('chip_basic', 0.04), l('chip_improved', 0.02), l('stim_kit', 0.1)] }),
      mob({ id: 'core_mantis', name: 'Ядерный богомол', level: 20, hp: 900, atk: 75, def: 30, attackMs: 1600, exp: 480, gold: [60, 110], sprite: 'insect',
        loot: [l('reactor_slag', 0.35, 1, 2), l('hive_wax', 0.2), l('brood_spike', 0.022), l('incubator_plate', 0.018), l('mantis_scythe', 0.012), l('chip_improved', 0.025), l('chip_safe', 0.008), l('antirad', 0.12)] }),
      mob({ id: 'brood_mother', name: 'Матка-инкубатор', level: 22, hp: 1300, atk: 70, def: 48, attackMs: 2500, exp: 600, gold: [80, 140], sprite: 'beast',
        loot: [l('nano_dust', 0.3, 1, 3), l('hive_wax', 0.25, 1, 2), l('ether_ampoule', 0.12), l('queen_gland', 0.02), l('hive_sensor', 0.018), l('chitin_mail', 0.015), l('chip_improved', 0.03), l('chip_safe', 0.01)] }),
      mob({ id: 'hive_heart', name: 'Сердце Улья', level: 25, hp: 16000, atk: 135, def: 50, attackMs: 2300, exp: 9000, gold: [1500, 2500], miniBoss: true, sprite: 'insect',
        loot: [l('chip_improved', 0.9, 2, 4), l('chip_safe', 0.3), l('heart_splinter', 0.28), l('queen_gland', 0.22), l('hive_sensor', 0.18), l('hive_carapace', 0.16), l('mantis_scythe', 0.14), l('hive_wax', 0.6, 2, 3), l('antirad', 0.7, 2, 4)] }),
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
      mob({ id: 'rift_stalker', name: 'Разрывной сталкер', level: 24, hp: 1900, atk: 105, def: 60, attackMs: 1700, exp: 950, gold: [100, 180], sprite: 'phantom',
        loot: [l('glass_shard', 0.35, 1, 2), l('nano_dust', 0.25, 1, 2), l('rift_thread', 0.12), l('rift_knife', 0.02), l('stalker_coat', 0.018), l('bio_reactor', 0.01), l('chip_improved', 0.03), l('stim_kit', 0.1)] }),
      mob({ id: 'precursor_sentinel', name: 'Страж-автомат Предтеч', level: 27, hp: 2600, atk: 125, def: 85, attackMs: 2200, exp: 1250, gold: [140, 240], sprite: 'automaton',
        loot: [l('burnt_board', 0.4, 1, 3), l('sealed_canister', 0.08), l('rift_thread', 0.1), l('void_mantle', 0.015), l('stalker_coat', 0.012), l('sentinel_helm', 0.015), l('precursor_lance', 0.01), l('chip_improved', 0.03), l('chip_safe', 0.012)] }),
      mob({ id: 'void_seraph', name: 'Серафим Пустоты', level: 29, hp: 3000, atk: 150, def: 70, attackMs: 1800, exp: 1500, gold: [180, 300], sprite: 'phantom',
        loot: [l('nano_dust', 0.4, 2, 3), l('rift_thread', 0.12), l('ether_ampoule', 0.15), l('seraph_crown', 0.018), l('void_mantle', 0.015), l('echo_gland', 0.012), l('antirad', 0.12), l('chip_improved', 0.035), l('chip_safe', 0.015)] }),
      mob({ id: 'reactor_echo', name: 'Эхо Реактора', level: 32, hp: 42000, atk: 230, def: 90, attackMs: 2200, exp: 30000, gold: [5000, 8000], miniBoss: true, sprite: 'drone',
        loot: [l('chip_improved', 1, 2, 5), l('chip_safe', 0.5, 1, 2), l('echo_gland', 0.25), l('seraph_crown', 0.2), l('rift_knife', 0.18), l('void_mantle', 0.16), l('precursor_lance', 0.14), l('bio_reactor', 0.12), l('sentinel_helm', 0.12), l('sealed_canister', 0.45), l('rift_thread', 0.7, 1, 3)] }),
    ],
  },
];
