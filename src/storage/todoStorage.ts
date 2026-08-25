import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_PROJECTS } from '../domain/todoFactory';
import type { Todo, TodoData } from '../types/todo';
import {
  migrateStoredTodoData,
  TODO_STORAGE_VERSION,
  type StoredTodoData,
} from './todoMigrations';
import { TodoStorageDataError } from './todoStorageError';

export { TODO_STORAGE_VERSION } from './todoMigrations';
export { TodoStorageDataError } from './todoStorageError';

export const TODO_STORAGE_KEY = '@practice-todo/todos';

export function parseStoredTodoData(serializedData: string): StoredTodoData {
  let parsedData: unknown;

  try {
    parsedData = JSON.parse(serializedData);
  } catch {
    throw new TodoStorageDataError('저장된 JSON을 읽을 수 없습니다.');
  }

  return migrateStoredTodoData(parsedData);
}

export function parseStoredTodos(serializedData: string): Todo[] {
  return parseStoredTodoData(serializedData).todos;
}

export function serializeTodoData(data: TodoData) {
  const storedData: StoredTodoData = {
    version: TODO_STORAGE_VERSION,
    todos: data.todos,
    projects: data.projects,
  };

  return JSON.stringify(storedData);
}

export async function readRawTodoStorage(): Promise<string | null> {
  return AsyncStorage.getItem(TODO_STORAGE_KEY);
}

export async function loadTodoData(): Promise<TodoData> {
  const serializedData = await readRawTodoStorage();

  if (!serializedData) {
    return { todos: [], projects: DEFAULT_PROJECTS };
  }

  const storedData = parseStoredTodoData(serializedData);
  return { todos: storedData.todos, projects: storedData.projects };
}

export async function loadTodos(): Promise<Todo[]> {
  return (await loadTodoData()).todos;
}

export async function saveTodoData(data: TodoData): Promise<void> {
  await AsyncStorage.setItem(TODO_STORAGE_KEY, serializeTodoData(data));
}

export async function saveTodos(todos: Todo[]): Promise<void> {
  await saveTodoData({ todos, projects: DEFAULT_PROJECTS });
}

export async function resetTodoStorage(): Promise<void> {
  await AsyncStorage.removeItem(TODO_STORAGE_KEY);
}
