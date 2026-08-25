import { DEFAULT_PROJECTS, createTodo } from '../domain/todoFactory';
import { migrateStoredTodoData, TODO_STORAGE_VERSION } from './todoMigrations';
import { TodoMigrationError } from './todoStorageError';

const legacyTodo = {
  id: 'legacy-1',
  text: '이전 할 일',
  completed: true,
  createdAt: 1,
};

describe('todoMigrations', () => {
  it('버전 없는 배열을 v2 전체 스키마로 순차 마이그레이션한다', () => {
    const result = migrateStoredTodoData([legacyTodo]);
    expect(result.version).toBe(TODO_STORAGE_VERSION);
    expect(result.projects).toEqual(DEFAULT_PROJECTS);
    expect(result.todos[0]).toMatchObject({
      id: 'legacy-1',
      title: '이전 할 일',
      notes: '',
      priority: 'normal',
      completedAt: 1,
      archivedAt: null,
    });
  });

  it('버전 1 객체도 v2로 마이그레이션한다', () => {
    expect(
      migrateStoredTodoData({ version: 1, todos: [legacyTodo] }).todos[0]
        .projectId,
    ).toBe(DEFAULT_PROJECTS[0].id);
  });

  it('현재 버전 데이터는 검증 후 보존한다', () => {
    const current = {
      version: TODO_STORAGE_VERSION,
      todos: [createTodo({ id: 'new', title: '새 형식', order: 0 })],
      projects: DEFAULT_PROJECTS,
    };
    expect(migrateStoredTodoData(current)).toEqual(current);
  });

  it('미래 버전과 손상 데이터를 거부한다', () => {
    expect(() =>
      migrateStoredTodoData({ version: 99, todos: [], projects: [] }),
    ).toThrow(TodoMigrationError);
    expect(() =>
      migrateStoredTodoData({ version: 1, todos: [{ broken: true }] }),
    ).toThrow(TodoMigrationError);
  });
});
