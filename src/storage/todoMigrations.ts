import { DEFAULT_PROJECTS } from '../domain/todoFactory';
import { isProject, isTodo, type Project, type Todo } from '../types/todo';
import { TodoMigrationError } from './todoStorageError';

export const TODO_STORAGE_VERSION = 2;

export type StoredTodoData = {
  version: typeof TODO_STORAGE_VERSION;
  todos: Todo[];
  projects: Project[];
};

type LegacyTodoV1 = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

type UnknownVersionedData = {
  version?: unknown;
  todos?: unknown;
  projects?: unknown;
};

type Migration = (data: unknown) => unknown;

function isLegacyTodoV1(value: unknown): value is LegacyTodoV1 {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const todo = value as Record<string, unknown>;
  return (
    typeof todo.id === 'string' &&
    typeof todo.text === 'string' &&
    todo.text.trim().length > 0 &&
    typeof todo.completed === 'boolean' &&
    typeof todo.createdAt === 'number' &&
    Number.isFinite(todo.createdAt)
  );
}

function validateLegacyTodos(value: unknown): LegacyTodoV1[] {
  if (!Array.isArray(value) || !value.every(isLegacyTodoV1)) {
    throw new TodoMigrationError(
      '이전 버전의 할 일 데이터 형식이 올바르지 않습니다.',
    );
  }

  return value;
}

function validateTodos(value: unknown): Todo[] {
  if (!Array.isArray(value) || !value.every(isTodo)) {
    throw new TodoMigrationError(
      '저장된 할 일 데이터 형식이 올바르지 않습니다.',
    );
  }

  return value;
}

function validateProjects(value: unknown): Project[] {
  if (!Array.isArray(value) || !value.every(isProject)) {
    throw new TodoMigrationError('프로젝트 데이터 형식이 올바르지 않습니다.');
  }

  return value;
}

function migrateVersion0ToVersion1(data: unknown) {
  const todos = Array.isArray(data)
    ? data
    : (data as UnknownVersionedData).todos;

  return {
    version: 1,
    todos: validateLegacyTodos(todos),
  };
}

function migrateVersion1ToVersion2(data: unknown): StoredTodoData {
  const storedData = data as UnknownVersionedData;
  const legacyTodos = validateLegacyTodos(storedData.todos);

  return {
    version: 2,
    todos: legacyTodos.map((todo, index) => ({
      id: todo.id,
      title: todo.text.trim(),
      notes: '',
      completed: todo.completed,
      priority: 'normal',
      dueAt: null,
      reminderAt: null,
      notificationId: null,
      projectId: DEFAULT_PROJECTS[0].id,
      tags: [],
      subtasks: [],
      recurrence: null,
      order: index,
      createdAt: todo.createdAt,
      updatedAt: todo.createdAt,
      completedAt: todo.completed ? todo.createdAt : null,
      archivedAt: null,
    })),
    projects: DEFAULT_PROJECTS,
  };
}

const MIGRATIONS: Record<number, Migration> = {
  0: migrateVersion0ToVersion1,
  1: migrateVersion1ToVersion2,
};

function getStorageVersion(data: unknown) {
  if (Array.isArray(data)) {
    return 0;
  }

  if (!data || typeof data !== 'object') {
    throw new TodoMigrationError('저장 데이터가 객체가 아닙니다.');
  }

  const version = (data as UnknownVersionedData).version;

  if (!Number.isInteger(version) || (version as number) < 0) {
    throw new TodoMigrationError('저장 데이터 버전이 올바르지 않습니다.');
  }

  return version as number;
}

function validateCurrentData(data: unknown): StoredTodoData {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new TodoMigrationError('현재 저장 데이터 형식이 올바르지 않습니다.');
  }

  const storedData = data as UnknownVersionedData;

  if (storedData.version !== TODO_STORAGE_VERSION) {
    throw new TodoMigrationError(
      `지원하지 않는 저장 데이터 버전입니다: ${String(storedData.version)}`,
    );
  }

  return {
    version: TODO_STORAGE_VERSION,
    todos: validateTodos(storedData.todos),
    projects: validateProjects(storedData.projects),
  };
}

export function migrateStoredTodoData(data: unknown): StoredTodoData {
  let currentData = data;
  let currentVersion = getStorageVersion(currentData);

  if (currentVersion > TODO_STORAGE_VERSION) {
    throw new TodoMigrationError(
      `지원하지 않는 미래 저장 데이터 버전입니다: ${currentVersion}`,
    );
  }

  while (currentVersion < TODO_STORAGE_VERSION) {
    const migration = MIGRATIONS[currentVersion];

    if (!migration) {
      throw new TodoMigrationError(
        `버전 ${currentVersion} 마이그레이션을 찾을 수 없습니다.`,
      );
    }

    currentData = migration(currentData);
    currentVersion = getStorageVersion(currentData);
  }

  return validateCurrentData(currentData);
}
