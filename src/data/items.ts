import type { ItemDef, ItemKind, Quality, SlotId } from '../types';

const list: ItemDef[] = [
  // Мусор
  { id: 'scrap_metal', name: 'Металлические обломки', kind: 'trash', rarity: 'common', price: 2, desc: 'Простые обломки конструкций Предтеч. Барыги берут на переплавку.' },
  { id: 'mutant_cartilage', name: 'Мутировавший хрящ', kind: 'trash', rarity: 'common', price: 3, desc: 'Ещё подёргивается. Алхимики лагеря что-то из этого варят.' },
  { id: 'rotten_cable', name: 'Сгнивший кабель', kind: 'trash', rarity: 'common', price: 5, desc: 'Медь внутри ещё можно выжечь.' },
  { id: 'burnt_board', name: 'Обугленная плата', kind: 'trash', rarity: 'common', price: 6, desc: 'Микросхемы выгорели, но золотые контакты целы.' },
  { id: 'glass_shard', name: 'Осколок стекла Предтеч', kind: 'trash', rarity: 'uncommon', price: 14, desc: 'Не режет кожу — режет пространство. Ценится коллекционерами.' },
  { id: 'reactor_slag', name: 'Реакторный шлак', kind: 'trash', rarity: 'uncommon', price: 25, desc: 'Тёплый на ощупь. Лучше не держать в кармане.' },
  { id: 'junk_pile', name: 'Кучка мусора', kind: 'trash', rarity: 'common', price: 1, desc: 'Всё, что осталось от дезинтегрированного предмета.' },

  // Материалы
  { id: 'nano_dust', name: 'Нано-пыль', kind: 'material', rarity: 'uncommon', price: 18, desc: 'Светящийся эфир. Основа «магии» Бездны. Богатые жилы встречаются в Шахтах.' },

  // Расходники
  { id: 'stim_kit', name: 'Стим-аптечка', kind: 'consumable', rarity: 'common', price: 15, use: { hpPct: 0.4 }, desc: 'Восстанавливает 40% HP.' },
  { id: 'ether_ampoule', name: 'Эфирная ампула', kind: 'consumable', rarity: 'common', price: 18, use: { mpPct: 0.5 }, desc: 'Восстанавливает 50% MP.' },
  { id: 'antirad', name: 'Антирад-таблетка', kind: 'consumable', rarity: 'common', price: 20, desc: 'Защищает от радиации при подъёме на поверхность. Нужна 1 шт. на каждый уровень радиации слоя.' },

  // Энергетические чипы (точки)
  { id: 'chip_basic', name: 'Базовый чип заточки', kind: 'chip', rarity: 'uncommon', price: 40, chip: { bonus: 1 }, desc: 'Даёт +1 к заточке. Выше +3 предмет может сгореть.' },
  { id: 'chip_improved', name: 'Улучшенный чип заточки', kind: 'chip', rarity: 'rare', price: 120, chip: { bonus: 2 }, desc: 'Даёт сразу +2 к заточке. Выше +3 предмет может сгореть.' },
  { id: 'chip_safe', name: 'Безопасный чип Предтеч', kind: 'chip', rarity: 'epic', price: 500, chip: { bonus: 1, safe: true }, desc: 'Даёт +1 к заточке. При неудаче предмет не сгорает.' },

  // Стартовое снаряжение классов
  { id: 'w_guardian', name: 'Ударный щит-молот', kind: 'equipment', slot: 'weapon', rarity: 'common', price: 30, stats: { atk: 6 }, desc: 'Тяжёлый, неуклюжий, надёжный.' },
  { id: 'a_guardian', name: 'Тяжёлые пластины Стража', kind: 'equipment', slot: 'armor', rarity: 'common', price: 30, stats: { def: 10 }, desc: 'Отражают часть урона обратно в нападающего.' },
  { id: 'w_psionic', name: 'Нейро-имплант «Шёпот»', kind: 'equipment', slot: 'weapon', rarity: 'common', price: 30, stats: { atk: 8, mp: 10 }, desc: 'Вживлён за ухом. Иногда шепчет сам.' },
  { id: 'a_psionic', name: 'Изолирующая ряса', kind: 'equipment', slot: 'armor', rarity: 'common', price: 30, stats: { def: 4 }, desc: 'Экранирует мозг от чужих мыслей.' },
  { id: 'w_gunner', name: 'Прицельный комплекс М-3', kind: 'equipment', slot: 'weapon', rarity: 'common', price: 30, stats: { atk: 9 }, desc: 'Оптика Предтеч, приклад из местного железа.' },
  { id: 'a_gunner', name: 'Разгрузка стрелка', kind: 'equipment', slot: 'armor', rarity: 'common', price: 30, stats: { def: 4 }, desc: 'Много карманов, мало защиты.' },
  { id: 'w_assassin', name: 'Мономолекулярный клинок', kind: 'equipment', slot: 'weapon', rarity: 'common', price: 30, stats: { atk: 8, crit: 0.02 }, desc: 'Толщина лезвия — одна молекула.' },
  { id: 'a_assassin', name: 'Плащ-хамелеон', kind: 'equipment', slot: 'armor', rarity: 'common', price: 30, stats: { def: 5 }, desc: 'Сливается с тьмой Провала.' },
  { id: 'w_titan', name: 'Двуручный дробитель', kind: 'equipment', slot: 'weapon', rarity: 'common', price: 30, stats: { atk: 12 }, desc: 'Кусок арматуры с реактивным ускорителем.' },
  { id: 'a_titan', name: 'Обмотки Титана', kind: 'equipment', slot: 'armor', rarity: 'common', price: 30, stats: { def: 1 }, desc: 'Броня — для тех, кто боится.' },

  // Слой I — Склепы Пепельных Полей
  { id: 'rusty_blade', name: 'Ржавый клинок', kind: 'equipment', slot: 'weapon', rarity: 'common', price: 25, stats: { atk: 9 }, desc: 'Сталь Предтеч под слоем ржавчины. Всё ещё режет.' },
  { id: 'miner_helmet', name: 'Шахтёрская каска', kind: 'equipment', slot: 'helmet', rarity: 'common', price: 20, stats: { def: 3, hp: 15 }, desc: 'Фонарь давно разбит, но голову держит.' },
  { id: 'bio_pulse', name: 'Био-модуль «Пульс»', kind: 'equipment', slot: 'bio', rarity: 'uncommon', price: 35, stats: { hp: 30 }, desc: 'Подкожный стимулятор сердечной мышцы.' },

  // Слой II — Ржавый Завод Смерти
  { id: 'energy_cutter', name: 'Энергетический резак', kind: 'equipment', slot: 'weapon', rarity: 'uncommon', price: 70, stats: { atk: 17 }, desc: 'Промышленный плазменный резак. Не для металла — для мяса.' },
  { id: 'steel_exo_vest', name: 'Стальной экзо-жилет', kind: 'equipment', slot: 'armor', rarity: 'uncommon', price: 70, stats: { def: 16, hp: 20 }, desc: 'Каркас рабочего экзоскелета Литейщиков.' },
  { id: 'gas_mask', name: 'Противогаз Литейщика', kind: 'equipment', slot: 'helmet', rarity: 'uncommon', price: 55, stats: { def: 6, hp: 30 }, desc: 'Фильтры пахнут кислотой и чужим потом.' },
  { id: 'bio_adrenal', name: 'Био-модуль «Адреналин»', kind: 'equipment', slot: 'bio', rarity: 'uncommon', price: 80, stats: { hp: 20, crit: 0.05 }, desc: 'Впрыскивает боевой коктейль в момент удара.' },

  // Слой III — Стеклянный Сектор Анабиоза
  { id: 'psi_staff', name: 'Импульсный пси-посох', kind: 'equipment', slot: 'weapon', rarity: 'rare', price: 160, stats: { atk: 26, mp: 30 }, desc: 'Резонатор, усиливающий нейро-импульсы владельца.' },
  { id: 'monolith_armor', name: 'Монолитная броня', kind: 'equipment', slot: 'armor', rarity: 'rare', price: 160, stats: { def: 28, hp: 50 }, desc: 'Цельная плита оплавленного стекла Предтеч.' },
  { id: 'cryo_visor', name: 'Крио-визор', kind: 'equipment', slot: 'helmet', rarity: 'rare', price: 130, stats: { def: 10, crit: 0.03 }, desc: 'Видит тепло сквозь лёд и стены.' },
  { id: 'bio_neuro', name: 'Био-модуль «Нейролинк»', kind: 'equipment', slot: 'bio', rarity: 'rare', price: 150, stats: { mp: 40, crit: 0.04 }, desc: 'Прямое подключение к эфирному полю.' },

  // Слои IV–V
  { id: 'mantis_scythe', name: 'Коса богомола', kind: 'equipment', slot: 'weapon', rarity: 'rare', price: 260, stats: { atk: 38, crit: 0.03 }, desc: 'Хитиновое лезвие, ещё помнящее охоту.' },
  { id: 'hive_carapace', name: 'Панцирь Улья', kind: 'equipment', slot: 'armor', rarity: 'rare', price: 260, stats: { def: 40, hp: 90 }, desc: 'Живая броня. Иногда шевелится.' },
  { id: 'sentinel_helm', name: 'Шлем Стража-автомата', kind: 'equipment', slot: 'helmet', rarity: 'epic', price: 380, stats: { def: 18, hp: 70 }, desc: 'Сенсоры Предтеч всё ещё ищут нарушителей.' },
  { id: 'precursor_lance', name: 'Копьё Предтеч', kind: 'equipment', slot: 'weapon', rarity: 'epic', price: 480, stats: { atk: 55 }, desc: 'Пространство вокруг наконечника дрожит.' },
  { id: 'bio_reactor', name: 'Био-модуль «Ядро»', kind: 'equipment', slot: 'bio', rarity: 'epic', price: 500, stats: { hp: 120, crit: 0.06 }, desc: 'Осколок Реактора, вшитый под рёбра.' },

  // Слой I. С мобов — своя железка, с кургана — набор побольше.
  { id: 'ash_resin', name: 'Пепельная смола', kind: 'trash', rarity: 'common', price: 4, desc: 'Застывший пепел Склепов. Барыга топит ею жаровню.' },
  { id: 'trench_spade', name: 'Шахтёрский тесак', kind: 'equipment', slot: 'weapon', rarity: 'common', price: 22, stats: { atk: 8 }, desc: 'Лопата, сточенная о кости до лезвия.' },
  { id: 'ash_bracer', name: 'Пепельный наруч', kind: 'equipment', slot: 'armor', rarity: 'common', price: 18, stats: { def: 5, hp: 10 }, desc: 'Жесть с замкового щита, согнутая по руке.' },
  { id: 'cracked_lamp', name: 'Треснувшая лампа', kind: 'equipment', slot: 'helmet', rarity: 'common', price: 16, stats: { def: 2, hp: 12 }, desc: 'Шахтёрский фонарь. Стекло сечёт лоб, но пепел не лезет в глаза.' },
  { id: 'turret_lance', name: 'Ствол турели', kind: 'equipment', slot: 'weapon', rarity: 'common', price: 28, stats: { atk: 11 }, desc: 'Обрезок автоматической пушки. Бьёт, только если бить самому.' },
  { id: 'servo_rib', name: 'Серворебро', kind: 'equipment', slot: 'armor', rarity: 'common', price: 24, stats: { def: 7 }, desc: 'Дуга от сгоревшего станка. Держит удар лучше кольчуги.' },
  { id: 'barrow_fang', name: 'Клык Пожирателя', kind: 'equipment', slot: 'weapon', rarity: 'uncommon', price: 40, stats: { atk: 13 }, desc: 'Кость кургана, ещё тёплая изнутри.' },
  { id: 'crypt_plate', name: 'Плита кургана', kind: 'equipment', slot: 'armor', rarity: 'uncommon', price: 42, stats: { def: 11, hp: 25 }, desc: 'Надгробный камень, обшитый ржавой кромкой.' },
  { id: 'ash_gland', name: 'Железа пепла', kind: 'equipment', slot: 'bio', rarity: 'uncommon', price: 38, stats: { hp: 35 }, desc: 'Узел, которым Пожиратель фильтровал радиоактивную пыль.' },

  // Слой II. Завод: инструмент, фартук, узел охлаждения.
  { id: 'acid_salt', name: 'Кислотная соль', kind: 'trash', rarity: 'uncommon', price: 10, desc: 'Осадок с труб Литейщиков. Разъедает карман, если полежать.' },
  { id: 'assembler_saw', name: 'Пила сборщика', kind: 'equipment', slot: 'weapon', rarity: 'uncommon', price: 65, stats: { atk: 16 }, desc: 'Дисковая пила с конвейера. Зубья забиты чужим хитином.' },
  { id: 'acid_apron', name: 'Кислотный фартук', kind: 'equipment', slot: 'armor', rarity: 'uncommon', price: 60, stats: { def: 12, hp: 12 }, desc: 'Прорезиненная шкура рабочего. Кислота её уже не берёт.' },
  { id: 'welder_hood', name: 'Капюшон сварщика', kind: 'equipment', slot: 'helmet', rarity: 'uncommon', price: 50, stats: { def: 5, hp: 18 }, desc: 'Светофильтр погас, но брызги металла он ещё держит.' },
  { id: 'drone_pincer', name: 'Клешня утилизатора', kind: 'equipment', slot: 'weapon', rarity: 'uncommon', price: 75, stats: { atk: 18, crit: 0.02 }, desc: 'Захват дрона. Сходится быстрее, чем кулак.' },
  { id: 'piston_cage', name: 'Поршневая клетка', kind: 'equipment', slot: 'armor', rarity: 'uncommon', price: 72, stats: { def: 15 }, desc: 'Каркас, который дрон носил вместо рёбер.' },
  { id: 'coolant_node', name: 'Узел хладагента', kind: 'equipment', slot: 'bio', rarity: 'uncommon', price: 78, stats: { hp: 18, crit: 0.03 }, desc: 'Впрыскивает холод в кровь в момент удара.' },
  { id: 'rivet_hammer', name: 'Клепальный молот', kind: 'equipment', slot: 'weapon', rarity: 'rare', price: 140, stats: { atk: 22 }, desc: 'Молот бригадира. Каждая клёпка — на чужой кости.' },
  { id: 'foundry_frame', name: 'Каркас литейщика', kind: 'equipment', slot: 'armor', rarity: 'rare', price: 150, stats: { def: 20, hp: 35 }, desc: 'Рама экзоскелета, с которой Хрящ не расставался.' },
  { id: 'overclock_gland', name: 'Железа разгона', kind: 'equipment', slot: 'bio', rarity: 'rare', price: 160, stats: { hp: 25, crit: 0.05 }, desc: 'Заводской стимулятор. Сердце стучит в такт станку.' },

  // Слой III. Капсулы: иглы, линзы, ядро стазиса.
  { id: 'cryo_flake', name: 'Крио-хлопья', kind: 'trash', rarity: 'uncommon', price: 16, desc: 'Иней с разбитой капсулы. Тает в ладони и пахнет озоном.' },
  { id: 'phantom_needle', name: 'Игла фантома', kind: 'equipment', slot: 'weapon', rarity: 'rare', price: 150, stats: { atk: 24, mp: 15, crit: 0.02 }, desc: 'Сгусток чужой мысли, который всё же режет.' },
  { id: 'static_veil', name: 'Покров помех', kind: 'equipment', slot: 'armor', rarity: 'rare', price: 155, stats: { def: 20, mp: 25 }, desc: 'Поле, в котором фантом прятал своё тело.' },
  { id: 'frost_lens', name: 'Линза инея', kind: 'equipment', slot: 'helmet', rarity: 'rare', price: 120, stats: { def: 8, crit: 0.02 }, desc: 'Стекло капсулы, всё ещё холоднее воздуха вокруг.' },
  { id: 'keeper_glaive', name: 'Глефа хранителя', kind: 'equipment', slot: 'weapon', rarity: 'rare', price: 180, stats: { atk: 28 }, desc: 'Церемониальный резак автоматона. Охранял сон, теперь охраняет вас.' },
  { id: 'capsule_shell', name: 'Оболочка капсулы', kind: 'equipment', slot: 'armor', rarity: 'rare', price: 175, stats: { def: 26, hp: 40 }, desc: 'Сегмент анабиозной колбы. Внутри до сих пор вакуум.' },
  { id: 'warden_visor', name: 'Визор смотрителя', kind: 'equipment', slot: 'helmet', rarity: 'epic', price: 360, stats: { def: 14, hp: 45 }, desc: 'Видит, кто ещё дышит в разбитых капсулах.' },
  { id: 'stasis_core', name: 'Ядро стазиса', kind: 'equipment', slot: 'bio', rarity: 'rare', price: 170, stats: { mp: 45, hp: 20 }, desc: 'Часы, которые для тела идут медленнее, чем для мира.' },

  // Слой IV. Улей: хитин, жало, железа матки.
  { id: 'hive_wax', name: 'Воск улья', kind: 'trash', rarity: 'rare', price: 28, desc: 'Тёплый, липкий, слегка радиоактивный. Кардиналы жгут его как ладан.' },
  { id: 'drone_stinger', name: 'Жало трутня', kind: 'equipment', slot: 'weapon', rarity: 'rare', price: 240, stats: { atk: 34, crit: 0.02 }, desc: 'Хитиновый шип. Яд выгорел, острота осталась.' },
  { id: 'chitin_mail', name: 'Хитиновая кольчуга', kind: 'equipment', slot: 'armor', rarity: 'rare', price: 240, stats: { def: 32, hp: 40 }, desc: 'Пластины трутня, сшитые кабелем охлаждения.' },
  { id: 'brood_spike', name: 'Шип выводка', kind: 'equipment', slot: 'weapon', rarity: 'rare', price: 280, stats: { atk: 36, crit: 0.04 }, desc: 'То, чем богомол вскрывал трубы.' },
  { id: 'incubator_plate', name: 'Плита инкубатора', kind: 'equipment', slot: 'armor', rarity: 'rare', price: 270, stats: { def: 38, hp: 60 }, desc: 'Створки матки. Внутри ещё тепло.' },
  { id: 'hive_sensor', name: 'Сенсор улья', kind: 'equipment', slot: 'helmet', rarity: 'epic', price: 400, stats: { def: 16, hp: 50 }, desc: 'Фасеточный узел. Слышит вибрацию бетона.' },
  { id: 'queen_gland', name: 'Железа матки', kind: 'equipment', slot: 'bio', rarity: 'epic', price: 480, stats: { hp: 90, crit: 0.05 }, desc: 'Впрыскивает то, на чём улей держал своих.' },
  { id: 'heart_splinter', name: 'Осколок Сердца', kind: 'equipment', slot: 'weapon', rarity: 'epic', price: 520, stats: { atk: 48, crit: 0.03 }, desc: 'Кусок реакторного сердца улья. Рука немеет, пока держишь.' },

  // Слой V. Дно: разрыв, нимб, запаянный контейнер Предтеч.
  { id: 'rift_thread', name: 'Нить разрыва', kind: 'trash', rarity: 'rare', price: 45, desc: 'Тонкая трещина в воздухе, пойманная в склянку. Барыга платит, не спрашивая.' },
  { id: 'sealed_canister', name: 'Запаянный контейнер', kind: 'trash', rarity: 'epic', price: 80, desc: 'Предтечи закрыли это раньше, чем Колодец провалился. Вскрыть нельзя — только продать.' },
  { id: 'rift_knife', name: 'Нож разрыва', kind: 'equipment', slot: 'weapon', rarity: 'epic', price: 420, stats: { atk: 46, crit: 0.04 }, desc: 'Лезвие короче ладони и длиннее комнаты, если смотреть сбоку.' },
  { id: 'stalker_coat', name: 'Плащ разрывника', kind: 'equipment', slot: 'armor', rarity: 'rare', price: 360, stats: { def: 34, hp: 50 }, desc: 'Ткань, которая помнит чужие шаги по дну.' },
  { id: 'void_mantle', name: 'Мантия пустоты', kind: 'equipment', slot: 'armor', rarity: 'epic', price: 500, stats: { def: 44, mp: 30 }, desc: 'Складки не сходятся с телом. Между ними — сквозняк из ниоткуда.' },
  { id: 'seraph_crown', name: 'Нимб серафима', kind: 'equipment', slot: 'helmet', rarity: 'epic', price: 540, stats: { def: 18, mp: 40, crit: 0.03 }, desc: 'Кольцо сенсоров. Смотрит туда, куда вы ещё не повернулись.' },
  { id: 'echo_gland', name: 'Железа эха', kind: 'equipment', slot: 'bio', rarity: 'epic', price: 560, stats: { hp: 80, atk: 6 }, desc: 'Осколок Реактора, который отвечает ударом на удар.' },
];

export const ITEMS: Record<string, ItemDef> = Object.fromEntries(list.map((i) => [i.id, i]));

export const KIND_LABEL: Record<ItemKind, string> = {
  trash: 'Хлам',
  consumable: 'Расходник',
  chip: 'Чип',
  material: 'Материал',
  equipment: 'Экипировка',
};

export const SLOT_LABEL: Record<SlotId, string> = {
  weapon: 'Оружие',
  armor: 'Броня',
  helmet: 'Шлем',
  bio: 'Био-модуль',
};

export const SLOTS: SlotId[] = ['weapon', 'armor', 'helmet', 'bio'];

export const QUALITY: Record<Quality, { name: string; mult: number; weight: number }> = {
  worn: { name: 'Изношенное', mult: 0.8, weight: 30 },
  common: { name: 'Обычное', mult: 1, weight: 45 },
  fine: { name: 'Добротное', mult: 1.25, weight: 20 },
  relic: { name: 'Реликвия', mult: 1.6, weight: 5 },
};

export const KIND_ORDER: Record<ItemKind, number> = {
  equipment: 0,
  chip: 1,
  consumable: 2,
  material: 3,
  trash: 4,
};

// Товары лавки на поверхности: id предмета → цена покупки.
export const SHOP: [string, number][] = [
  ['antirad', 25],
  ['stim_kit', 20],
  ['ether_ampoule', 24],
  ['chip_basic', 90],
];
