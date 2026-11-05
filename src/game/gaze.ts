import type { Game } from '../types';
import { log } from '../ui/log';
import { randFloat } from '../util';

const WINDOW = 12;
const MIN_STDDEV_MS = 12;
const MAX_MEAN_MS = 2000;
const DURATION_MS = 60_000;

export function gazeActive(g: Game, now = Date.now()): boolean {
  return g.gaze.until > now;
}

// GDD: под Мутным взором шанс любого лута и точек падает на 70–90%.
export function gazeDropMult(g: Game): number {
  return gazeActive(g) ? randFloat(0.1, 0.3) : 1;
}

function trigger(g: Game, now: number, reason: string): void {
  const wasActive = gazeActive(g, now);
  g.gaze.until = now + DURATION_MS;
  g.gaze.clicks = [];
  if (!wasActive) log(`Мутный взор: ${reason}. Шанс дропа снижен на 70–90% на 60 с.`, 'danger');
}

export function registerAttackClick(g: Game, now: number, trusted: boolean): void {
  if (!trusted) {
    trigger(g, now, 'обнаружены синтетические клики');
    return;
  }
  const clicks = g.gaze.clicks;
  clicks.push(now);
  if (clicks.length > WINDOW + 1) clicks.shift();
  if (clicks.length <= WINDOW) return;

  const intervals = clicks.slice(1).map((t, i) => t - clicks[i]);
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length;
  if (mean < MAX_MEAN_MS && Math.sqrt(variance) < MIN_STDDEV_MS) trigger(g, now, 'слишком ровные тайминги кликов');
}
