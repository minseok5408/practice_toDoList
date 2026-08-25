import { createTodo } from './todoFactory';
import {
  canUseManualDrag,
  selectArchivedTodos,
  selectCompletedTodos,
  selectTodos,
} from './todoSelectors';
import type { Todo } from '../types/todo';

const now = new Date(2026, 7, 25, 12).getTime();
function todo(id: string, overrides: Partial<Todo> = {}) {
  return {
    ...createTodo({
      id,
      title: overrides.title ?? id,
      order: overrides.order ?? 0,
      now: overrides.createdAt ?? 1,
    }),
    ...overrides,
  };
}
const baseQuery = {
  statusFilter: 'all',
  smartView: 'all',
  sort: 'manual',
  projectId: 'all',
  tag: null,
  search: '',
  completedDisplay: 'mixed',
  now,
} as const;

describe('todoSelectors', () => {
  const todos = [
    todo('today', {
      title: '회의 준비',
      notes: '문서 확인',
      dueAt: new Date(2026, 7, 25, 18).getTime(),
      projectId: 'work',
      tags: ['중요'],
      priority: 'high',
      order: 2,
    }),
    todo('tomorrow', { dueAt: new Date(2026, 7, 26, 9).getTime(), order: 1 }),
    todo('overdue', { dueAt: new Date(2026, 7, 24, 9).getTime(), order: 0 }),
    todo('done', { completed: true, completedAt: now, order: 3 }),
    todo('archived', { archivedAt: now, order: 4 }),
  ];

  it('스마트 날짜 화면을 현지 날짜 기준으로 분리한다', () => {
    expect(
      selectTodos(todos, { ...baseQuery, smartView: 'today' }).map(
        (item) => item.id,
      ),
    ).toEqual(['today']);
    expect(
      selectTodos(todos, { ...baseQuery, smartView: 'tomorrow' }).map(
        (item) => item.id,
      ),
    ).toEqual(['tomorrow']);
    expect(
      selectTodos(todos, { ...baseQuery, smartView: 'overdue' }).map(
        (item) => item.id,
      ),
    ).toEqual(['overdue']);
  });

  it('검색, 프로젝트, 태그와 상태 필터를 함께 적용한다', () => {
    const result = selectTodos(todos, {
      ...baseQuery,
      statusFilter: 'active',
      projectId: 'work',
      tag: '중요',
      search: '문서',
    });
    expect(result.map((item) => item.id)).toEqual(['today']);
  });

  it('우선순위, 마감일 및 완료 하단 정렬을 처리한다', () => {
    expect(selectTodos(todos, { ...baseQuery, sort: 'priority' })[0].id).toBe(
      'today',
    );
    expect(selectTodos(todos, { ...baseQuery, sort: 'due' })[0].id).toBe(
      'overdue',
    );
    expect(
      selectTodos(todos, { ...baseQuery, completedDisplay: 'bottom' }).at(-1)
        ?.id,
    ).toBe('done');
  });

  it('완료 기록과 보관함을 분리한다', () => {
    expect(selectCompletedTodos(todos).map((item) => item.id)).toEqual([
      'done',
    ]);
    expect(selectArchivedTodos(todos).map((item) => item.id)).toEqual([
      'archived',
    ]);
  });

  it('직접 정렬이 안전한 화면에서만 드래그를 허용한다', () => {
    expect(canUseManualDrag(baseQuery)).toBe(true);
    expect(canUseManualDrag({ ...baseQuery, search: '회의' })).toBe(false);
    expect(canUseManualDrag({ ...baseQuery, completedDisplay: 'bottom' })).toBe(
      false,
    );
  });

  it('1,000개 항목의 복합 필터와 정렬을 반복 처리한다', () => {
    const manyTodos = Array.from({ length: 1000 }, (_, index) =>
      todo(`performance-${index}`, {
        title: index % 2 ? `일반 작업 ${index}` : `검색 작업 ${index}`,
        notes: index % 3 ? '' : '성능 측정 메모',
        priority: index % 5 === 0 ? 'high' : 'normal',
        order: index,
        createdAt: index,
      }),
    );
    const startedAt = performance.now();
    let result: Todo[] = [];

    for (let iteration = 0; iteration < 30; iteration += 1) {
      result = selectTodos(manyTodos, {
        ...baseQuery,
        search: '검색',
        sort: 'priority',
      });
    }

    const elapsed = performance.now() - startedAt;
    expect(result).toHaveLength(500);
    expect(elapsed).toBeLessThan(2000);
  });
});
