import './style.css';
import { tick } from './game/combat';
import { createGame, createPlayer, loadPlayer, savePlayer, wipeSave } from './game/state';
import { spawnLayer } from './game/travel';
import { showCharacterCreation } from './ui/create';
import { mountHud, updateHud } from './ui/hud';
import { log } from './ui/log';
import { $ } from './util';

const TICK_MS = 100;
const SAVE_EVERY_MS = 5000;

async function boot(): Promise<void> {
  const root = $('#app');
  let player = loadPlayer();
  const isNew = !player;
  if (!player) {
    const { name, classId } = await showCharacterCreation(root);
    player = createPlayer(name, classId);
    savePlayer(player);
  }

  const g = createGame(player);
  spawnLayer(g);
  let wiped = false;
  const save = () => {
    if (!wiped) savePlayer(g.player);
  };
  mountHud(root, g, () => {
    wiped = true;
    wipeSave();
    location.reload();
  });
  if (import.meta.env.DEV) Object.assign(window, { __game: g });

  log(isNew ? `${player.name} разбивает палатку в лагере у Провала.` : `С возвращением, ${player.name}.`, 'level');
  log('Клик по «Атаковать» или по силуэту — удар. Навыки: 1, 2. Аптечка: Q, ампула: E. ПКМ по предмету — на верстак.', 'system');

  const frame = () => {
    const now = Date.now();
    tick(g, now);
    updateHud(g, now);
  };
  frame();
  setInterval(frame, TICK_MS);

  setInterval(save, SAVE_EVERY_MS);
  addEventListener('beforeunload', save);
}

boot();
