import { DEFAULT_PROJECTS } from '../domain/todoFactory';
import {
  saveTodoRepositoryWithRetry,
  type TodoRepository,
} from './TodoRepository';

function createRepository(): jest.Mocked<TodoRepository> {
  return {
    load: jest
      .fn()
      .mockResolvedValue({ todos: [], projects: DEFAULT_PROJECTS }),
    save: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn().mockResolvedValue(undefined),
    readRaw: jest.fn().mockResolvedValue(null),
  };
}

describe('TodoRepository', () => {
  it('저장 구현이 처음 실패하면 인터페이스를 통해 재시도한다', async () => {
    const repository = createRepository();
    repository.save
      .mockRejectedValueOnce(new Error('첫 저장 실패'))
      .mockResolvedValueOnce(undefined);

    await saveTodoRepositoryWithRetry(
      repository,
      { todos: [], projects: DEFAULT_PROJECTS },
      { maxAttempts: 2, retryDelayMs: 0 },
    );

    expect(repository.save).toHaveBeenCalledTimes(2);
  });

  it('최대 시도 횟수 이후 저장 오류를 전달한다', async () => {
    const repository = createRepository();
    repository.save.mockRejectedValue(new Error('계속 실패'));

    await expect(
      saveTodoRepositoryWithRetry(
        repository,
        { todos: [], projects: DEFAULT_PROJECTS },
        { maxAttempts: 2, retryDelayMs: 0 },
      ),
    ).rejects.toThrow('계속 실패');
    expect(repository.save).toHaveBeenCalledTimes(2);
  });
});
