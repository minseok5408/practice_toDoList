import { createTodo } from './todoFactory';
import { initialTodoState, todoReducer, type TodoState } from './todoState';
import type { Todo } from '../types/todo';

function todo(overrides: Partial<Todo> = {}): Todo {
  return {
    ...createTodo({
      id: overrides.id ?? 'todo-1',
      title: overrides.title ?? '테스트 할 일',
      order: overrides.order ?? 0,
      now: overrides.createdAt ?? 1,
    }),
    ...overrides,
  };
}

describe('todoReducer', () => {
  it('추가, 수정 및 완료 시간을 처리한다', () => {
    const added = todoReducer(initialTodoState, { type: 'add', todo: todo() });
    const updated = todoReducer(added, {
      type: 'update',
      id: 'todo-1',
      changes: { title: '수정됨' },
    });
    const completed = todoReducer(updated, {
      type: 'toggle',
      id: 'todo-1',
      now: 10,
    });
    expect(completed.todos[0]).toMatchObject({
      title: '수정됨',
      completed: true,
      completedAt: 10,
    });
    const active = todoReducer(completed, {
      type: 'toggle',
      id: 'todo-1',
      now: 20,
    });
    expect(active.todos[0]).toMatchObject({
      completed: false,
      completedAt: null,
    });
  });

  it('삭제한 여러 항목을 원래 순서로 되돌린다', () => {
    const state: TodoState = {
      todos: [todo({ id: 'a' }), todo({ id: 'b' }), todo({ id: 'c' })],
      projects: [],
      undo: null,
    };
    const deleted = todoReducer(state, {
      type: 'delete',
      ids: ['a', 'c'],
      message: '2개 삭제',
    });
    expect(deleted.todos.map((item) => item.id)).toEqual(['b']);
    expect(todoReducer(deleted, { type: 'undo' }).todos).toEqual(state.todos);
  });

  it('완료 항목 일괄 삭제와 되돌리기를 처리한다', () => {
    const state: TodoState = {
      todos: [
        todo({ id: 'active' }),
        todo({ id: 'done', completed: true, completedAt: 2 }),
      ],
      projects: [],
      undo: null,
    };
    const cleared = todoReducer(state, {
      type: 'clearCompleted',
      message: '1개 삭제',
    });
    expect(cleared.todos.map((item) => item.id)).toEqual(['active']);
    expect(todoReducer(cleared, { type: 'undo' }).todos).toEqual(state.todos);
  });

  it('하위 할 일, 보관, 복원 및 프로젝트 이동을 처리한다', () => {
    const state: TodoState = {
      todos: [
        todo({ subtasks: [{ id: 'sub', title: '단계', completed: false }] }),
      ],
      projects: [],
      undo: null,
    };
    const subtask = todoReducer(state, {
      type: 'toggleSubtask',
      todoId: 'todo-1',
      subtaskId: 'sub',
      now: 3,
    });
    expect(subtask.todos[0].subtasks[0].completed).toBe(true);
    const archived = todoReducer(subtask, {
      type: 'archive',
      ids: ['todo-1'],
      now: 4,
    });
    expect(archived.todos[0].archivedAt).toBe(4);
    const restored = todoReducer(archived, {
      type: 'restore',
      ids: ['todo-1'],
      now: 5,
    });
    const moved = todoReducer(restored, {
      type: 'move',
      ids: ['todo-1'],
      projectId: 'work',
      now: 6,
    });
    expect(moved.todos[0]).toMatchObject({
      archivedAt: null,
      projectId: 'work',
    });
  });

  it('직접 정렬 순서를 저장한다', () => {
    const state: TodoState = {
      todos: [todo({ id: 'a', order: 0 }), todo({ id: 'b', order: 1 })],
      projects: [],
      undo: null,
    };
    const result = todoReducer(state, {
      type: 'reorder',
      orderedIds: ['b', 'a'],
      now: 5,
    });
    expect(result.todos.find((item) => item.id === 'b')?.order).toBe(0);
    expect(result.todos.find((item) => item.id === 'a')?.order).toBe(1);
  });

  it('프로젝트와 태그 이름 변경 및 삭제를 전체 할 일에 반영한다', () => {
    const state: TodoState = {
      todos: [todo({ projectId: 'work', tags: ['old'] })],
      projects: [{ id: 'work', name: '업무', color: '#000', createdAt: 1 }],
      undo: null,
    };
    const renamed = todoReducer(state, {
      type: 'renameTag',
      oldTag: 'old',
      newTag: 'new',
      now: 2,
    });
    const deletedProject = todoReducer(renamed, {
      type: 'deleteProject',
      id: 'work',
      now: 3,
    });
    expect(deletedProject.todos[0]).toMatchObject({
      projectId: null,
      tags: ['new'],
    });
    expect(deletedProject.projects).toEqual([]);
  });
});
