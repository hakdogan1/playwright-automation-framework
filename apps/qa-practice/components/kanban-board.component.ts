import type { Locator } from '@playwright/test';

export type KanbanColumn = 'todo' | 'doing' | 'done';

/** Drag & Drop board: three columns of draggable cards. */
export class KanbanBoard {
  readonly board: Locator;

  constructor(root: Locator) {
    this.board = root.getByTestId('dnd-board');
  }

  column(name: KanbanColumn): Locator {
    return this.board.getByTestId(`dnd-col-${name}`);
  }

  /** Cards of a column, in display order (each card is a draggable element). */
  cards(name: KanbanColumn): Locator {
    return this.column(name).locator('[draggable="true"]');
  }

  card(title: string): Locator {
    return this.board.locator('[draggable="true"]').filter({ hasText: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) });
  }

  /** Native HTML5 drag of a card onto a column. */
  async move(title: string, to: KanbanColumn): Promise<void> {
    await this.card(title).dragTo(this.column(to));
  }
}
