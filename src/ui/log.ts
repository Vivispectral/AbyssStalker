import { clockTime, el } from '../util';

export type LogKind = 'hit' | 'crit' | 'skill' | 'mob' | 'loot' | 'trash' | 'rare' | 'system' | 'danger' | 'level';

const MAX_LINES = 200;
let container: HTMLElement | null = null;

export function mountLog(target: HTMLElement): void {
  container = target;
}

export function log(text: string, kind: LogKind = 'system'): void {
  if (!container) return;
  const stick = container.scrollTop + container.clientHeight >= container.scrollHeight - 24;
  const line = el('div', `line log-${kind}`);
  line.append(el('span', 'ts', clockTime()), document.createTextNode(text));
  container.append(line);
  while (container.childElementCount > MAX_LINES) container.firstElementChild?.remove();
  if (stick) container.scrollTop = container.scrollHeight;
}
