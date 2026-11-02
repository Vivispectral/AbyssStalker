import { chance, clockTime, el, pick, randInt } from '../util';

export type ChatKind = 'say' | 'trade' | 'good' | 'fail' | 'system' | 'self';

const MAX_LINES = 150;

const NAMES = [
  'Кровопуск', 'xX_Strazh_Xx', 'ТёмныйЖнец', 'NanoBaron', 'Ржавый_Пёс', 'Шептунья', 'Kardinal_Orlov',
  'Liara', 'СтарыйКурьер', 'Molot', 'Громила', 'Тень_Провала', 'ZeroCool', 'Бабка_с_Антирадом',
  'Литейщик_Петрович', 'Vex', 'ЯдоваяМоль', 'Sn1per', 'Psi_Kitty', 'Дробитель3000',
];

const GEAR = [
  'Мономолекулярный клинок', 'Тяжёлые пластины Стража', 'Прицельный комплекс М-3', 'Нейро-имплант «Шёпот»',
  'Двуручный дробитель', 'Плащ-хамелеон', 'Изолирующая ряса', 'Ударный щит-молот', 'Разгрузка стрелка',
];

const CHATTER = [
  'кто на Крысиного Короля? нужен танк',
  'опять курьера ганкнули на третьем слое...',
  'Кардиналы подняли пошлину на трубу, грабёж',
  'есть пати в Шахты Литейщиков?',
  'антирад по 25, кто дешевле?',
  'Мутный взор опять порезал дроп, я же руками кликаю!!',
  'видел вход в Лабиринт на втором слое, закрылся через минуту',
  'на +4 не точите без благословлённого, проверено',
  'ищу курьера до поверхности, плачу 10%',
  'кто знает, где спот нано-пиявок на третьем?',
  'ассасин у лифта на IV слое, осторожно',
  'гильдия «Пепел» набирает, от 15 уровня',
  'когда респ Смотрителя Капсул?',
  'сгорел клинок +6. всё, я спать',
  'Титаны без хила — это просто смертники',
  'продал почку за чип, точу',
];

const ARCH_BOSSES = [
  'Архи-босс «Пожиратель Реактора» пробудился в Сердце Провала!',
  'Архи-босс «Мать Ульев» вышла из спячки на Слое IV!',
  'Над Затопленным Некрополем поднялся «Утопший Предтеча»!',
];

let list: HTMLElement | null = null;

function push(author: string | null, text: string, kind: ChatKind): void {
  if (!list) return;
  const stick = list.scrollTop + list.clientHeight >= list.scrollHeight - 24;
  const line = el('div', `line chat-${kind}`);
  line.append(el('span', 'ts', clockTime()));
  if (author) line.append(el('span', 'author', `${author}: `));
  line.append(document.createTextNode(text));
  list.append(line);
  while (list.childElementCount > MAX_LINES) list.firstElementChild?.remove();
  if (stick) list.scrollTop = list.scrollHeight;
}

export function systemChat(text: string, kind: ChatKind = 'system'): void {
  push('[Система]', text, kind);
}

function fakeMessage(): void {
  const name = pick(NAMES);
  const gear = pick(GEAR);
  const roll = Math.random();
  if (roll < 0.22) {
    const lvl = randInt(4, 12);
    systemChat(`${name} успешно заточил «${gear}» до +${lvl}!`, 'good');
  } else if (roll < 0.42) {
    const lvl = randInt(4, 11);
    systemChat(`${name} пытался заточить «${gear}» +${lvl - 1} → +${lvl}. Предмет дезинтегрирован. Осталась Кучка мусора.`, 'fail');
  } else if (roll < 0.55) {
    push(name, `ПРОДАМ «${gear}» +${randInt(3, 9)}, ${randInt(2, 90)}к, пм`, 'trade');
  } else if (roll < 0.62) {
    push(name, `КУПЛЮ Чип Предтеч, ${randInt(70, 140)} за штуку`, 'trade');
  } else if (roll < 0.65) {
    systemChat(pick(ARCH_BOSSES), 'fail');
  } else {
    push(name, pick(CHATTER), 'say');
  }
}

const REPLIES = ['+', 'лол', 'ты кто такой вообще', 'согласен', 'иди фарми', 'пм', 'не флуди', 'ахах, бывает', 'и что?'];

function scheduleFake(): void {
  setTimeout(() => {
    fakeMessage();
    scheduleFake();
  }, randInt(2500, 7000));
}

export function mountChat(target: HTMLElement, form: HTMLFormElement, input: HTMLInputElement, getName: () => string): void {
  list = target;
  systemChat('Добро пожаловать в Бездну. Помните: Мутный взор следит за ботами.');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    push(getName(), text, 'self');
    input.value = '';
    if (chance(0.35)) setTimeout(() => push(pick(NAMES), pick(REPLIES), 'say'), randInt(1200, 4000));
  });
  scheduleFake();
}
