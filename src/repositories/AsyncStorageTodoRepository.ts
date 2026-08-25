import {
  loadTodoData,
  readRawTodoStorage,
  resetTodoStorage,
  saveTodoData,
} from '../storage/todoStorage';
import type { TodoRepository } from './TodoRepository';

export const asyncStorageTodoRepository: TodoRepository = {
  load: loadTodoData,
  save: saveTodoData,
  reset: resetTodoStorage,
  readRaw: readRawTodoStorage,
};
