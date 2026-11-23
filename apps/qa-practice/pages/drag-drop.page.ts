import type { Locator, Page } from '@playwright/test';
import { KanbanBoard } from '../components/kanban-board.component';
import { moduleHeading, openModule } from '../support/module';

/** /ui-elements/drag-drop/ — kanban board with native HTML5 drag and drop. */
export class DragDropPage {
  static readonly path = '/ui-elements/drag-drop/';
  readonly heading: Locator;
  readonly board: KanbanBoard;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Drag & Drop');
    this.board = new KanbanBoard(page.locator('body'));
  }

  async goto(): Promise<void> {
    await openModule(this.page, { path: DragDropPage.path, heading: this.heading, ready: this.board.card('QA review') });
  }
}
