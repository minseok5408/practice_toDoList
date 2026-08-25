import { createNextRecurringTodo, createTodo } from './todoFactory';

describe('반복 일정', () => {
  it('매일 반복 시 마감일과 알림 간격을 유지한다', () => {
    const dueAt = new Date(2026, 7, 25, 9).getTime();
    const todo = createTodo({
      id: 'daily',
      title: '물 마시기',
      order: 0,
      dueAt,
      reminderAt: dueAt - 30 * 60 * 1000,
      recurrence: { frequency: 'daily', interval: 1 },
    });
    const next = createNextRecurringTodo(todo, () => 'new', 10)!;
    expect(next.dueAt).toBe(new Date(2026, 7, 26, 9).getTime());
    expect(next.dueAt! - next.reminderAt!).toBe(30 * 60 * 1000);
    expect(next.completed).toBe(false);
  });

  it('평일 반복은 주말을 건너뛴다', () => {
    const friday = new Date(2026, 7, 28, 9).getTime();
    const todo = createTodo({
      id: 'weekday',
      title: '출근',
      order: 0,
      dueAt: friday,
      recurrence: { frequency: 'weekdays', interval: 1 },
    });
    expect(
      new Date(createNextRecurringTodo(todo, () => 'new')!.dueAt!).getDay(),
    ).toBe(1);
  });

  it('매월 반복은 짧은 달의 마지막 날짜를 사용한다', () => {
    const january31 = new Date(2027, 0, 31, 9).getTime();
    const todo = createTodo({
      id: 'monthly',
      title: '결제',
      order: 0,
      dueAt: january31,
      recurrence: { frequency: 'monthly', interval: 1 },
    });
    expect(
      new Date(createNextRecurringTodo(todo, () => 'new')!.dueAt!).getDate(),
    ).toBe(28);
  });
});
