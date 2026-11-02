import type { ItemDef } from '../types';

const list: ItemDef[] = [
  // Мусор
  { id: 'scrap_gear', name: 'Ржавая шестерня', kind: 'trash', rarity: 'common', price: 2, desc: 'Остатки механизмов Предтеч. Барыги берут на переплавку.' },
  { id: 'mutant_cartilage', name: 'Мутировавший хрящ', kind: 'trash', rarity: 'common', price: 3, desc: 'Ещё подёргивается. Алхимики слоя что-то из этого варят.' },
  { id: 'rotten_cable', name: 'Сгнивший кабель', kind: 'trash', rarity: 'common', price: 5, desc: 'Медь внутри ещё можно выжечь.' },
  { id: 'burnt_board', name: 'Обугленная плата', kind: 'trash', rarity: 'common', price: 6, desc: 'Микросхемы выгорели, но золотые контакты целы.' },
  { id: 'glass_shard', name: 'Осколок стекла Предтеч', kind: 'trash', rarity: 'uncommon', price: 14, desc: 'Не режет кожу — режет пространство. Ценится коллекционерами.' },
  { id: 'reactor_slag', name: 'Реакторный шлак', kind: 'trash', rarity: 'uncommon', price: 25, desc: 'Тёплый на ощупь. Лучше не держать в кармане.' },
  { id: 'junk_pile', name: 'Кучка мусора', kind: 'trash', rarity: 'common', price: 1, desc: 'Всё, что осталось от дезинтегрированного предмета.' },

  // Материалы
  { id: 'nano_dust', name: 'Нано-пыль', kind: 'material', rarity: 'uncommon', price: 18, desc: 'Светящийся эфир. Основа «магии» Бездны.' },

  // Расходники
  { id: 'stim_kit', name: 'Стим-аптечка', kind: 'consumable', rarity: 'common', price: 15, use: { hpPct: 0.4 }, desc: 'Восстанавливает 40% HP.' },
  { id: 'ether_ampoule', name: 'Эфирная ампула', kind: 'consumable', rarity: 'common', price: 18, use: { mpPct: 0.5 }, desc: 'Восстанавливает 50% MP.' },
  { id: 'antirad', name: 'Антирад-таблетка', kind: 'consumable', rarity: 'common', price: 20, desc: 'Защищает от радиации при эвакуации на поверхность.' },

  // Заточка
  { id: 'chip', name: 'Чип Предтеч', kind: 'chip', rarity: 'rare', price: 80, desc: 'Микрочип стимуляции материи. Вставляется в предмет на Верстаке Заточки.' },
  { id: 'blessed_chip', name: 'Благословлённый чип', kind: 'chip', rarity: 'epic', price: 600, desc: 'При неудаче предмет не сгорает, а лишь теряет заточку.' },

  // Снаряжение классов
  { id: 'w_guardian', name: 'Ударный щит-молот', kind: 'weapon', rarity: 'common', price: 40, atk: 6, desc: 'Тяжёлый, неуклюжий, надёжный.' },
  { id: 'a_guardian', name: 'Тяжёлые пластины Стража', kind: 'armor', rarity: 'common', price: 40, def: 10, desc: 'Отражают часть урона обратно в нападающего.' },
  { id: 'w_psionic', name: 'Нейро-имплант «Шёпот»', kind: 'weapon', rarity: 'common', price: 40, atk: 8, desc: 'Вживлён за ухом. Иногда шепчет сам.' },
  { id: 'a_psionic', name: 'Изолирующая ряса', kind: 'armor', rarity: 'common', price: 40, def: 4, desc: 'Экранирует мозг от чужих мыслей.' },
  { id: 'w_gunner', name: 'Прицельный комплекс М-3', kind: 'weapon', rarity: 'common', price: 40, atk: 9, desc: 'Оптика Предтеч, приклад из местного железа.' },
  { id: 'a_gunner', name: 'Разгрузка стрелка', kind: 'armor', rarity: 'common', price: 40, def: 4, desc: 'Много карманов, мало защиты.' },
  { id: 'w_assassin', name: 'Мономолекулярный клинок', kind: 'weapon', rarity: 'common', price: 40, atk: 8, desc: 'Толщина лезвия — одна молекула.' },
  { id: 'a_assassin', name: 'Плащ-хамелеон', kind: 'armor', rarity: 'common', price: 40, def: 5, desc: 'Сливается с тьмой Провала.' },
  { id: 'w_titan', name: 'Двуручный дробитель', kind: 'weapon', rarity: 'common', price: 40, atk: 12, desc: 'Кусок арматуры с реактивным ускорителем.' },
  { id: 'a_titan', name: 'Обмотки Титана', kind: 'armor', rarity: 'common', price: 40, def: 1, desc: 'Броня — для тех, кто боится.' },
];

export const ITEMS: Record<string, ItemDef> = Object.fromEntries(list.map((i) => [i.id, i]));

export const KIND_ORDER: Record<string, number> = {
  consumable: 0,
  chip: 1,
  material: 2,
  weapon: 3,
  armor: 4,
  trash: 5,
};
