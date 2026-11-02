import './style.css';
import { createGame, createPlayer, loadPlayer, savePlayer, tick, wipeSave } from './game';
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
  let wiped = false;
  const save = () => {
    if (!wiped) savePlayer(g.player);
  };
  mountHud(root, g, () => {
    wiped = true;
    wipeSave();
    location.reload();
  });

  log(isNew ? `${player.name} делает первый шаг в Провал.` : `С возвращением, ${player.name}.`, 'level');
  log('Клик по «Атаковать» — удар. Навыки: 1, 2. Аптечка: Q, ампула: E.', 'system');

  setInterval(() => {
    const now = Date.now();
    tick(g, now);
    updateHud(g, now);
  }, TICK_MS);

  setInterval(save, SAVE_EVERY_MS);
  addEventListener('beforeunload', save);
}

boot();
