import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { TodoRepository } from '../repositories/TodoRepository';
import { TodoMigrationError } from '../storage/todoStorageError';
import { useTodos } from './useTodos';

jest.mock('../services/notifications', () => ({
  cancelTodoReminder: jest.fn(),
  scheduleTodoReminder: jest.fn(),
}));

describe('useTodos storage recovery', () => {
  it('마이그레이션 실패를 복구 가능한 로딩 오류 상태로 노출한다', async () => {
    let rejectLoad: (error: Error) => void = () => undefined;
    const repository: TodoRepository = {
      load: jest.fn(
        () =>
          new Promise((_, reject) => {
            rejectLoad = reject;
          }),
      ),
      save: jest.fn(),
      reset: jest.fn(),
      readRaw: jest.fn(),
    };

    const { result } = await renderHook(() => useTodos('ko', repository));

    await act(async () => {
      rejectLoad(new TodoMigrationError('지원하지 않는 버전'));
    });

    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    expect(result.current.isReady).toBe(false);
    expect(result.current.storageError).toEqual({
      kind: 'load',
      message: '저장된 할 일을 불러오지 못했습니다.',
    });
  });
});
