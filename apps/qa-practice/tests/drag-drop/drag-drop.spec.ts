import { test, expect, tc } from '../../fixtures';
import { BOARD } from '../../data/phase2c.data';

test.describe('Drag & Drop', () => {
  test.beforeEach(async ({ dragDropPage }) => {
    await dragDropPage.goto();
  });

  test('the board starts with the expected cards per column', { tag: ['@smoke'], annotation: [tc('TC-DND-001')] }, async ({ dragDropPage: { board } }) => {
    await expect(board.cards('todo')).toHaveText([...BOARD.todo]);
    await expect(board.cards('doing')).toHaveText([...BOARD.doing]);
    await expect(board.cards('done')).toHaveText([...BOARD.done]);
  });

  test('dragging a card to another column moves it to the end', { tag: ['@functional'], annotation: [tc('TC-DND-002')] }, async ({ dragDropPage: { board } }) => {
    await test.step('Drag "Design test pyramid" from todo to done', () => board.move('Design test pyramid', 'done'));

    await expect(board.cards('todo')).toHaveCount(0);
    await expect(board.cards('done')).toHaveText(['Lint config', 'Design test pyramid']);
  });

  test('cards can be moved back and forth without duplication', { tag: ['@functional'], annotation: [tc('TC-DND-003')] }, async ({ dragDropPage: { board } }) => {
    await test.step('Drag "QA review" to done, then back to doing', async () => {
      await board.move('QA review', 'done');
      await expect(board.cards('done')).toHaveText(['Lint config', 'QA review']);
      await board.move('QA review', 'doing');
    });

    await expect(board.cards('doing')).toHaveText(['Perf budget', 'QA review']);
    await expect(board.cards('done')).toHaveText(['Lint config']);
    await expect(board.card('QA review')).toHaveCount(1);
  });

  test('dropping a card on its own column moves it to the end of that column', { tag: ['@edge'], annotation: [tc('TC-DND-004')] }, async ({ dragDropPage: { board } }) => {
    await test.step('Drag "QA review" onto the doing column', () => board.move('QA review', 'doing'));

    await expect(board.cards('doing')).toHaveText(['Perf budget', 'QA review']);
  });

  test('dropping outside any column changes nothing', { tag: ['@negative'], annotation: [tc('TC-DND-005')] }, async ({ dragDropPage: { board }, dragDropPage }) => {
    await test.step('Drag "Lint config" onto the page heading', () => board.card('Lint config').dragTo(dragDropPage.heading));

    await expect(board.cards('todo')).toHaveText([...BOARD.todo]);
    await expect(board.cards('doing')).toHaveText([...BOARD.doing]);
    await expect(board.cards('done')).toHaveText([...BOARD.done]);
  });

  test('every card can end up in one column', { tag: ['@edge'], annotation: [tc('TC-DND-006')] }, async ({ dragDropPage: { board } }) => {
    for (const title of ['Design test pyramid', 'QA review', 'Perf budget']) {
      await test.step(`Drag "${title}" to done`, () => board.move(title, 'done'));
    }
    await expect(board.cards('done')).toHaveText(['Lint config', 'Design test pyramid', 'QA review', 'Perf budget']);
    await expect(board.cards('todo')).toHaveCount(0);
    await expect(board.cards('doing')).toHaveCount(0);
  });
});
