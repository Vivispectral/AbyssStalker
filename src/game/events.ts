interface GameEvents {
  mobHit: { uid: number; dmg: number; crit: boolean };
  playerHit: { dmg: number };
  enchant: { success: boolean; broke: boolean };
}

type Listener<K extends keyof GameEvents> = (e: GameEvents[K]) => void;

const listeners = new Map<keyof GameEvents, Listener<never>[]>();

export function on<K extends keyof GameEvents>(type: K, fn: Listener<K>): void {
  const list = listeners.get(type) ?? [];
  list.push(fn as Listener<never>);
  listeners.set(type, list);
}

export function emit<K extends keyof GameEvents>(type: K, e: GameEvents[K]): void {
  for (const fn of listeners.get(type) ?? []) (fn as Listener<K>)(e);
}
