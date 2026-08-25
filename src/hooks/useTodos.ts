import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

import { PROJECT_COLORS } from '../constants/todoUi';
import { assertProjectName, assertTagName } from '../domain/errors';
import { createNextRecurringTodo, createTodo } from '../domain/todoFactory';
import {
  initialTodoState,
  todoReducer,
  type TodoImportMode,
  type TodoUndoState,
} from '../domain/todoState';
import {
  cancelTodoReminder,
  scheduleTodoReminder,
} from '../services/notifications';
import { captureOperationalError } from '../services/telemetry';
import { asyncStorageTodoRepository } from '../repositories/AsyncStorageTodoRepository';
import {
  saveTodoRepositoryWithRetry,
  type TodoRepository,
} from '../repositories/TodoRepository';
import {
  createTodoBackupDependencies,
  exportRawTodoStorageBackup,
} from '../storage/todoBackup';
import type {
  Subtask,
  Todo,
  TodoData,
  TodoPriority,
  TodoRecurrence,
} from '../types/todo';

type StorageErrorState = {
  kind: 'load' | 'save';
  message: string;
};

export type AppFeedback = {
  kind: 'success' | 'error' | 'warning';
  message: string;
};

export type TodoDraft = {
  title: string;
  notes: string;
  priority: TodoPriority;
  dueAt: number | null;
  reminderAt: number | null;
  projectId: string | null;
  tags: string[];
  subtasks: Subtask[];
  recurrence: TodoRecurrence | null;
};

const UNDO_TIMEOUT_MS = 6000;
const FEEDBACK_TIMEOUT_MS = 2400;
export function useTodos(
  language: 'ko' | 'en',
  repository: TodoRepository = asyncStorageTodoRepository,
) {
  const [state, dispatch] = useReducer(todoReducer, initialTodoState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [canPersist, setCanPersist] = useState(false);
  const [storageError, setStorageError] = useState<StorageErrorState | null>(
    null,
  );
  const [feedback, setFeedback] = useState<AppFeedback | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const hasUserChanges = useRef(false);

  const markChanged = useCallback(() => {
    hasUserChanges.current = true;
  }, []);

  const hydrateTodos = useCallback(async () => {
    setIsHydrated(false);

    try {
      const storedData = await repository.load();
      dispatch({ type: 'hydrate', ...storedData });
      setCanPersist(true);
      setStorageError(null);
    } catch (error) {
      captureOperationalError(error, 'todo_storage_load');
      setCanPersist(false);
      setStorageError({
        kind: 'load',
        message: '저장된 할 일을 불러오지 못했습니다.',
      });
    } finally {
      setIsHydrated(true);
    }
  }, [repository]);

  useEffect(() => {
    void hydrateTodos();
  }, [hydrateTodos]);

  useEffect(() => {
    if (!canPersist) {
      return;
    }

    let isCurrent = true;
    const shouldShowFeedback = hasUserChanges.current;
    hasUserChanges.current = false;
    const data = { todos: state.todos, projects: state.projects };

    saveQueue.current = saveQueue.current
      .catch(() => undefined)
      .then(() => saveTodoRepositoryWithRetry(repository, data));

    void saveQueue.current
      .then(() => {
        if (isCurrent) {
          setStorageError(null);

          if (shouldShowFeedback) {
            setFeedback({
              kind: 'success',
              message:
                language === 'ko'
                  ? '변경사항을 저장했습니다.'
                  : 'Changes saved.',
            });
          }
        }
      })
      .catch((error) => {
        captureOperationalError(error, 'todo_storage_save');
        if (isCurrent) {
          const message =
            language === 'ko'
              ? '변경사항을 기기에 저장하지 못했습니다.'
              : 'Could not save changes on this device.';
          setStorageError({ kind: 'save', message });
          setFeedback({ kind: 'error', message });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [canPersist, language, repository, state.projects, state.todos]);

  useEffect(() => {
    if (!state.undo) {
      return;
    }

    const timeout = setTimeout(() => {
      dispatch({ type: 'dismissUndo' });
    }, UNDO_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [state.undo]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeout = setTimeout(() => setFeedback(null), FEEDBACK_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const nextOrder = useMemo(
    () => Math.max(-1, ...state.todos.map((todo) => todo.order)) + 1,
    [state.todos],
  );

  const scheduleAndAttachReminder = useCallback(
    async (todo: Todo) => {
      try {
        const result = await scheduleTodoReminder(todo, language);

        if (result.status === 'denied') {
          setFeedback({
            kind: 'warning',
            message:
              language === 'ko'
                ? '알림 권한이 거절되어 알림을 예약하지 못했습니다.'
                : 'Notification permission was denied.',
          });
        }

        return result.notificationId;
      } catch (error) {
        captureOperationalError(error, 'notification_schedule');
        setFeedback({
          kind: 'warning',
          message:
            language === 'ko'
              ? '알림을 예약하지 못했습니다.'
              : 'Could not schedule the reminder.',
        });
        return null;
      }
    },
    [language],
  );

  const addTodo = useCallback(
    async (draft: TodoDraft) => {
      if (!draft.title.trim() || !isHydrated || !canPersist) {
        return false;
      }

      let todo = createTodo({
        ...draft,
        id: Crypto.randomUUID(),
        order: nextOrder,
      });
      const notificationId = await scheduleAndAttachReminder(todo);
      todo = { ...todo, notificationId };
      markChanged();
      dispatch({ type: 'add', todo });
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return true;
    },
    [canPersist, isHydrated, markChanged, nextOrder, scheduleAndAttachReminder],
  );

  const addQuickTodo = useCallback(
    (title: string) =>
      addTodo({
        title,
        notes: '',
        priority: 'normal',
        dueAt: null,
        reminderAt: null,
        projectId: state.projects[0]?.id ?? null,
        tags: [],
        subtasks: [],
        recurrence: null,
      }),
    [addTodo, state.projects],
  );

  const updateTodo = useCallback(
    async (id: string, draft: TodoDraft) => {
      const currentTodo = state.todos.find((todo) => todo.id === id);

      if (!currentTodo || !draft.title.trim()) {
        return false;
      }

      try {
        await cancelTodoReminder(currentTodo.notificationId);
      } catch (error) {
        captureOperationalError(error, 'notification_cancel');
        // 기존 알림 취소 실패가 할 일 수정을 막지 않게 합니다.
      }

      const updatedTodo: Todo = {
        ...currentTodo,
        ...draft,
        title: draft.title.trim(),
        notes: draft.notes.trim(),
        updatedAt: Date.now(),
        notificationId: null,
      };
      const notificationId = await scheduleAndAttachReminder(updatedTodo);
      markChanged();
      dispatch({
        type: 'update',
        id,
        changes: { ...updatedTodo, notificationId },
      });
      return true;
    },
    [markChanged, scheduleAndAttachReminder, state.todos],
  );

  const toggleTodo = useCallback(
    async (id: string) => {
      const todo = state.todos.find((item) => item.id === id);

      if (!todo) {
        return;
      }

      const now = Date.now();

      if (!todo.completed) {
        try {
          await cancelTodoReminder(todo.notificationId);
        } catch (error) {
          captureOperationalError(error, 'notification_cancel');
          // 취소 실패와 관계없이 완료 상태는 변경합니다.
        }

        let nextTodo = createNextRecurringTodo(
          todo,
          () => Crypto.randomUUID(),
          now,
        );

        if (nextTodo) {
          nextTodo = {
            ...nextTodo,
            order: nextOrder,
            notificationId: await scheduleAndAttachReminder(nextTodo),
          };
        }

        markChanged();
        dispatch({ type: 'toggle', id, now, nextTodo });
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        return;
      }

      const activeTodo = { ...todo, completed: false, completedAt: null };
      const notificationId = await scheduleAndAttachReminder(activeTodo);
      markChanged();
      dispatch({ type: 'toggle', id, now });
      dispatch({ type: 'update', id, changes: { notificationId } });
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [markChanged, nextOrder, scheduleAndAttachReminder, state.todos],
  );

  const toggleSubtask = useCallback(
    (todoId: string, subtaskId: string) => {
      markChanged();
      dispatch({ type: 'toggleSubtask', todoId, subtaskId, now: Date.now() });
      void Haptics.selectionAsync();
    },
    [markChanged],
  );

  const cancelRemindersForIds = useCallback(
    async (ids: string[]) => {
      const idSet = new Set(ids);
      const results = await Promise.allSettled(
        state.todos
          .filter((todo) => idSet.has(todo.id))
          .map((todo) => cancelTodoReminder(todo.notificationId)),
      );
      results.forEach((result) => {
        if (result.status === 'rejected') {
          captureOperationalError(result.reason, 'notification_cancel');
        }
      });
    },
    [state.todos],
  );

  const deleteTodos = useCallback(
    async (ids: string[]) => {
      await cancelRemindersForIds(ids);
      markChanged();
      dispatch({
        type: 'delete',
        ids,
        message:
          language === 'ko'
            ? `${ids.length}개의 할 일을 삭제했습니다.`
            : `${ids.length} task(s) deleted.`,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },
    [cancelRemindersForIds, language, markChanged],
  );

  const clearCompleted = useCallback(async () => {
    const completedIds = state.todos
      .filter((todo) => todo.completed && todo.archivedAt === null)
      .map((todo) => todo.id);
    await cancelRemindersForIds(completedIds);
    markChanged();
    dispatch({
      type: 'clearCompleted',
      message:
        language === 'ko'
          ? `완료한 ${completedIds.length}개의 할 일을 삭제했습니다.`
          : `${completedIds.length} completed task(s) deleted.`,
    });
  }, [cancelRemindersForIds, language, markChanged, state.todos]);

  const completeTodos = useCallback(
    async (ids: string[]) => {
      for (const id of ids) {
        const todo = state.todos.find((item) => item.id === id);

        if (todo && !todo.completed) {
          await toggleTodo(id);
        }
      }
    },
    [state.todos, toggleTodo],
  );

  const archiveTodos = useCallback(
    async (ids: string[]) => {
      await cancelRemindersForIds(ids);
      markChanged();
      dispatch({ type: 'archive', ids, now: Date.now() });
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [cancelRemindersForIds, markChanged],
  );

  const restoreTodos = useCallback(
    async (ids: string[]) => {
      markChanged();
      dispatch({ type: 'restore', ids, now: Date.now() });

      for (const id of ids) {
        const todo = state.todos.find((item) => item.id === id);

        if (todo) {
          const notificationId = await scheduleAndAttachReminder({
            ...todo,
            archivedAt: null,
          });
          dispatch({ type: 'update', id, changes: { notificationId } });
        }
      }
    },
    [markChanged, scheduleAndAttachReminder, state.todos],
  );

  const permanentDeleteTodos = useCallback(
    async (ids: string[]) => {
      await cancelRemindersForIds(ids);
      markChanged();
      dispatch({ type: 'permanentDelete', ids });
    },
    [cancelRemindersForIds, markChanged],
  );

  const moveTodos = useCallback(
    (ids: string[], projectId: string | null) => {
      markChanged();
      dispatch({ type: 'move', ids, projectId, now: Date.now() });
    },
    [markChanged],
  );

  const reorderTodos = useCallback(
    (orderedIds: string[]) => {
      markChanged();
      dispatch({ type: 'reorder', orderedIds, now: Date.now() });
      void Haptics.selectionAsync();
    },
    [markChanged],
  );

  const addProject = useCallback(
    (name: string) => {
      const trimmedName = name.trim();
      assertProjectName(trimmedName);

      markChanged();
      dispatch({
        type: 'addProject',
        project: {
          id: Crypto.randomUUID(),
          name: trimmedName,
          color: PROJECT_COLORS[state.projects.length % PROJECT_COLORS.length],
          createdAt: Date.now(),
        },
      });
    },
    [markChanged, state.projects.length],
  );

  const renameProject = useCallback(
    (id: string, name: string) => {
      assertProjectName(name);
      markChanged();
      dispatch({ type: 'renameProject', id, name });
    },
    [markChanged],
  );

  const deleteProject = useCallback(
    (id: string) => {
      markChanged();
      dispatch({ type: 'deleteProject', id, now: Date.now() });
    },
    [markChanged],
  );

  const renameTag = useCallback(
    (oldTag: string, newTag: string) => {
      assertTagName(newTag);
      markChanged();
      dispatch({ type: 'renameTag', oldTag, newTag, now: Date.now() });
    },
    [markChanged],
  );

  const deleteTag = useCallback(
    (tag: string) => {
      markChanged();
      dispatch({ type: 'deleteTag', tag, now: Date.now() });
    },
    [markChanged],
  );

  const importTodoData = useCallback(
    async (data: TodoData, mode: TodoImportMode) => {
      if (mode === 'replace') {
        await Promise.allSettled(
          state.todos.map((todo) => cancelTodoReminder(todo.notificationId)),
        );
      }

      const importedTodos: Todo[] = [];

      for (const todo of data.todos) {
        const preparedTodo = { ...todo, notificationId: null };
        importedTodos.push({
          ...preparedTodo,
          notificationId: await scheduleAndAttachReminder(preparedTodo),
        });
      }

      markChanged();
      dispatch({
        type: 'import',
        mode,
        todos: importedTodos,
        projects: data.projects,
      });
    },
    [markChanged, scheduleAndAttachReminder, state.todos],
  );

  const undoLastDelete = useCallback(async () => {
    const deletedTodos = state.undo?.entries.map((entry) => entry.todo) ?? [];
    markChanged();
    dispatch({ type: 'undo' });

    for (const todo of deletedTodos) {
      const notificationId = await scheduleAndAttachReminder(todo);
      dispatch({ type: 'update', id: todo.id, changes: { notificationId } });
    }
  }, [markChanged, scheduleAndAttachReminder, state.undo]);

  const dismissUndo = useCallback(() => {
    dispatch({ type: 'dismissUndo' });
  }, []);

  const retryStorage = useCallback(async () => {
    if (storageError?.kind === 'load') {
      await hydrateTodos();
      return;
    }

    try {
      await saveTodoRepositoryWithRetry(repository, {
        todos: state.todos,
        projects: state.projects,
      });
      setStorageError(null);
      setFeedback({
        kind: 'success',
        message: language === 'ko' ? '다시 저장했습니다.' : 'Saved again.',
      });
    } catch (error) {
      captureOperationalError(error, 'todo_storage_save');
      const message =
        language === 'ko'
          ? '변경사항을 다시 저장하지 못했습니다.'
          : 'Could not save changes again.';
      setStorageError({ kind: 'save', message });
      setFeedback({ kind: 'error', message });
    }
  }, [
    hydrateTodos,
    language,
    repository,
    state.projects,
    state.todos,
    storageError?.kind,
  ]);

  const resetStorage = useCallback(async () => {
    try {
      await Promise.allSettled(
        state.todos.map((todo) => cancelTodoReminder(todo.notificationId)),
      );
      await repository.reset();
      const emptyData = await repository.load();
      dispatch({ type: 'hydrate', ...emptyData });
      setCanPersist(true);
      setIsHydrated(true);
      setStorageError(null);
      markChanged();
    } catch (error) {
      captureOperationalError(error, 'todo_storage_reset');
      setStorageError({
        kind: 'save',
        message: '저장 데이터를 초기화하지 못했습니다.',
      });
    }
  }, [markChanged, repository, state.todos]);

  const exportStorageBackup = useCallback(async () => {
    try {
      await exportRawTodoStorageBackup(
        createTodoBackupDependencies(repository.readRaw),
      );
    } catch (error) {
      captureOperationalError(error, 'backup_export');
      throw error;
    }
  }, [repository]);

  return {
    todos: state.todos,
    projects: state.projects,
    data: { todos: state.todos, projects: state.projects },
    undoState: state.undo as TodoUndoState | null,
    feedback,
    storageError,
    isHydrated,
    isReady: isHydrated && canPersist,
    addTodo,
    addQuickTodo,
    updateTodo,
    toggleTodo,
    toggleSubtask,
    deleteTodos,
    clearCompleted,
    completeTodos,
    archiveTodos,
    restoreTodos,
    permanentDeleteTodos,
    moveTodos,
    reorderTodos,
    addProject,
    renameProject,
    deleteProject,
    renameTag,
    deleteTag,
    importTodoData,
    undoLastDelete,
    dismissUndo,
    dismissFeedback: () => setFeedback(null),
    retryStorage,
    resetStorage,
    exportStorageBackup,
  };
}
