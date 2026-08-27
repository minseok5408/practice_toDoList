import { createDefaultDueAt } from './TodoEditorModal';

describe('TodoEditorModal defaults', () => {
  it('새 할 일의 기본 마감일을 오늘 마지막 시간으로 설정한다', () => {
    const now = new Date(2026, 7, 27, 9, 44, 30, 123).getTime();
    const dueAt = new Date(createDefaultDueAt(now));

    expect(dueAt.getFullYear()).toBe(2026);
    expect(dueAt.getMonth()).toBe(7);
    expect(dueAt.getDate()).toBe(27);
    expect(dueAt.getHours()).toBe(23);
    expect(dueAt.getMinutes()).toBe(59);
    expect(dueAt.getSeconds()).toBe(0);
    expect(dueAt.getMilliseconds()).toBe(0);
  });
});
