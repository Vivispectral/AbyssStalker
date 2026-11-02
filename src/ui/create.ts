import { CLASS_LIST } from '../data/classes';
import type { ClassId } from '../types';
import { $, el } from '../util';

export function showCharacterCreation(root: HTMLElement): Promise<{ name: string; classId: ClassId }> {
  return new Promise((resolve) => {
    root.innerHTML = `
      <div class="create">
        <h1 class="title">ABYSS STALKER</h1>
        <p class="subtitle">Пространственный Реактор взорвался. Провал зовёт.</p>
        <form class="create-form panel">
          <label class="field">
            <span>Имя сталкера</span>
            <input name="name" maxlength="16" autocomplete="off" required placeholder="Например, Пепельный" />
          </label>
          <div class="class-grid"></div>
          <button type="submit" class="btn-primary">Спуститься в Бездну</button>
        </form>
      </div>`;

    const grid = $('.class-grid', root);
    let selected: ClassId = CLASS_LIST[0].id;

    for (const c of CLASS_LIST) {
      const card = el('button', 'class-card');
      card.type = 'button';
      card.dataset.id = c.id;
      card.append(
        el('div', 'class-name', c.name),
        el('div', 'class-role', c.role),
        el('div', 'class-desc', c.desc),
        el('div', 'class-passive', c.passiveDesc),
      );
      card.addEventListener('click', () => {
        selected = c.id;
        grid.querySelectorAll('.class-card').forEach((n) => n.classList.toggle('selected', n === card));
      });
      if (c.id === selected) card.classList.add('selected');
      grid.append(card);
    }

    const form = $<HTMLFormElement>('.create-form', root);
    const input = $<HTMLInputElement>('input[name=name]', root);
    input.focus();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = input.value.trim();
      if (name) resolve({ name, classId: selected });
    });
  });
}
