import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PROJECTS, createTodo } from '../domain/todoFactory';
import {
  TODO_STORAGE_KEY,
  TODO_STORAGE_VERSION,
  TodoStorageDataError,
  loadTodoData,
  loadTodos,
  parseStoredTodos,
  readRawTodoStorage,
  resetTodoStorage,
  saveTodoData,
} from './todoStorage';

const todo = createTodo({
  id: 'todo-1',
  title: '저장 테스트',
  order: 0,
  now: 1,
});

describe('todoStorage', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('이전 배열 데이터를 마이그레이션해 읽는다', () => {
    expect(
      parseStoredTodos(
        JSON.stringify([
          { id: 'old', text: '이전', completed: false, createdAt: 1 },
        ]),
      )[0].title,
    ).toBe('이전');
  });

  it('손상되거나 지원하지 않는 데이터를 거부한다', () => {
    expect(() => parseStoredTodos('{broken')).toThrow(TodoStorageDataError);
    expect(() =>
      parseStoredTodos(JSON.stringify({ version: 99, todos: [] })),
    ).toThrow(TodoStorageDataError);
  });

  it('마이그레이션 실패 시 원문을 보존한다', async () => {
    const raw = JSON.stringify({ version: 1, todos: [{ broken: true }] });
    await AsyncStorage.setItem(TODO_STORAGE_KEY, raw);
    await expect(loadTodos()).rejects.toThrow(TodoStorageDataError);
    await expect(readRawTodoStorage()).resolves.toBe(raw);
  });

  it('버전, 할 일 및 프로젝트를 함께 저장한다', async () => {
    await saveTodoData({ todos: [todo], projects: DEFAULT_PROJECTS });
    expect(
      JSON.parse((await AsyncStorage.getItem(TODO_STORAGE_KEY)) ?? '{}'),
    ).toEqual({
      version: TODO_STORAGE_VERSION,
      todos: [todo],
      projects: DEFAULT_PROJECTS,
    });
    await expect(loadTodoData()).resolves.toEqual({
      todos: [todo],
      projects: DEFAULT_PROJECTS,
    });
  });

  it('저장 데이터가 없으면 기본 프로젝트를 제공하고 초기화한다', async () => {
    await expect(loadTodoData()).resolves.toEqual({
      todos: [],
      projects: DEFAULT_PROJECTS,
    });
    await saveTodoData({ todos: [todo], projects: DEFAULT_PROJECTS });
    await resetTodoStorage();
    await expect(AsyncStorage.getItem(TODO_STORAGE_KEY)).resolves.toBeNull();
  });
});
