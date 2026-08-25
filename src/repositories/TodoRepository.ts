import type { TodoData } from '../types/todo';

export interface TodoRepository {
  load(): Promise<TodoData>;
  save(data: TodoData): Promise<void>;
  reset(): Promise<void>;
  readRaw(): Promise<string | null>;
}

export type TodoRepositoryRetryOptions = {
  maxAttempts?: number;
  retryDelayMs?: number;
};

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

export async function saveTodoRepositoryWithRetry(
  repository: TodoRepository,
  data: TodoData,
  { maxAttempts = 3, retryDelayMs = 150 }: TodoRepositoryRetryOptions = {},
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await repository.save(data);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts && retryDelayMs > 0) {
        await wait(retryDelayMs * attempt);
      }
    }
  }

  throw lastError;
}
