import type { Project, Subtask, Todo } from '../types/todo';

type UndoEntry = {
  todo: Todo;
  index: number;
};

export type TodoUndoState = {
  entries: UndoEntry[];
  message: string;
};

export type TodoState = {
  todos: Todo[];
  projects: Project[];
  undo: TodoUndoState | null;
};

export type TodoImportMode = 'merge' | 'replace';

export type TodoAction =
  | { type: 'hydrate'; todos: Todo[]; projects: Project[] }
  | { type: 'add'; todo: Todo }
  | { type: 'update'; id: string; changes: Partial<Todo> }
  | { type: 'toggle'; id: string; now: number; nextTodo?: Todo | null }
  | { type: 'toggleSubtask'; todoId: string; subtaskId: string; now: number }
  | { type: 'delete'; ids: string[]; message: string }
  | { type: 'clearCompleted'; message: string }
  | { type: 'bulkComplete'; ids: string[]; now: number }
  | { type: 'archive'; ids: string[]; now: number }
  | { type: 'restore'; ids: string[]; now: number }
  | { type: 'permanentDelete'; ids: string[] }
  | { type: 'move'; ids: string[]; projectId: string | null; now: number }
  | { type: 'reorder'; orderedIds: string[]; now: number }
  | { type: 'addProject'; project: Project }
  | { type: 'renameProject'; id: string; name: string }
  | { type: 'deleteProject'; id: string; now: number }
  | { type: 'renameTag'; oldTag: string; newTag: string; now: number }
  | { type: 'deleteTag'; tag: string; now: number }
  | {
      type: 'import';
      mode: TodoImportMode;
      todos: Todo[];
      projects: Project[];
    }
  | { type: 'undo' }
  | { type: 'dismissUndo' };

export const initialTodoState: TodoState = {
  todos: [],
  projects: [],
  undo: null,
};

function restoreDeletedTodos(todos: Todo[], entries: UndoEntry[]) {
  const restoredTodos = [...todos];

  [...entries]
    .sort((first, second) => first.index - second.index)
    .forEach(({ todo, index }) => {
      if (restoredTodos.some((currentTodo) => currentTodo.id === todo.id)) {
        return;
      }

      restoredTodos.splice(Math.min(index, restoredTodos.length), 0, todo);
    });

  return restoredTodos;
}

function deleteTodos(state: TodoState, ids: string[], message: string) {
  const idSet = new Set(ids);
  const entries = state.todos.flatMap((todo, index) =>
    idSet.has(todo.id) ? [{ todo, index }] : [],
  );

  if (entries.length === 0) {
    return state;
  }

  return {
    ...state,
    todos: state.todos.filter((todo) => !idSet.has(todo.id)),
    undo: { entries, message },
  };
}

function updateSubtasks(subtasks: Subtask[], subtaskId: string): Subtask[] {
  return subtasks.map((subtask) =>
    subtask.id === subtaskId
      ? { ...subtask, completed: !subtask.completed }
      : subtask,
  );
}

function uniqueById<T extends { id: string }>(first: T[], second: T[]) {
  const values = new Map(first.map((value) => [value.id, value]));
  second.forEach((value) => values.set(value.id, value));
  return [...values.values()];
}

export function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'hydrate':
      return { todos: action.todos, projects: action.projects, undo: null };
    case 'add':
      return { ...state, todos: [action.todo, ...state.todos], undo: null };
    case 'update':
      return {
        ...state,
        todos: state.todos.map((todo) =>
          todo.id === action.id ? { ...todo, ...action.changes } : todo,
        ),
      };
    case 'toggle':
      return {
        ...state,
        todos: state.todos.flatMap((todo) => {
          if (todo.id !== action.id) {
            return [todo];
          }

          const completed = !todo.completed;
          const updatedTodo: Todo = {
            ...todo,
            completed,
            completedAt: completed ? action.now : null,
            notificationId: completed ? null : todo.notificationId,
            updatedAt: action.now,
          };

          return action.nextTodo
            ? [updatedTodo, action.nextTodo]
            : [updatedTodo];
        }),
      };
    case 'toggleSubtask':
      return {
        ...state,
        todos: state.todos.map((todo) =>
          todo.id === action.todoId
            ? {
                ...todo,
                subtasks: updateSubtasks(todo.subtasks, action.subtaskId),
                updatedAt: action.now,
              }
            : todo,
        ),
      };
    case 'delete':
      return deleteTodos(state, action.ids, action.message);
    case 'clearCompleted':
      return deleteTodos(
        state,
        state.todos.filter((todo) => todo.completed).map((todo) => todo.id),
        action.message,
      );
    case 'bulkComplete': {
      const idSet = new Set(action.ids);
      return {
        ...state,
        todos: state.todos.map((todo) =>
          idSet.has(todo.id)
            ? {
                ...todo,
                completed: true,
                completedAt: todo.completedAt ?? action.now,
                notificationId: null,
                updatedAt: action.now,
              }
            : todo,
        ),
      };
    }
    case 'archive': {
      const idSet = new Set(action.ids);
      return {
        ...state,
        todos: state.todos.map((todo) =>
          idSet.has(todo.id)
            ? { ...todo, archivedAt: action.now, updatedAt: action.now }
            : todo,
        ),
      };
    }
    case 'restore': {
      const idSet = new Set(action.ids);
      return {
        ...state,
        todos: state.todos.map((todo) =>
          idSet.has(todo.id)
            ? { ...todo, archivedAt: null, updatedAt: action.now }
            : todo,
        ),
      };
    }
    case 'permanentDelete': {
      const idSet = new Set(action.ids);
      return {
        ...state,
        todos: state.todos.filter((todo) => !idSet.has(todo.id)),
      };
    }
    case 'move': {
      const idSet = new Set(action.ids);
      return {
        ...state,
        todos: state.todos.map((todo) =>
          idSet.has(todo.id)
            ? {
                ...todo,
                projectId: action.projectId,
                updatedAt: action.now,
              }
            : todo,
        ),
      };
    }
    case 'reorder': {
      const orderMap = new Map(
        action.orderedIds.map((id, index) => [id, index]),
      );
      return {
        ...state,
        todos: state.todos.map((todo) =>
          orderMap.has(todo.id)
            ? {
                ...todo,
                order: orderMap.get(todo.id) ?? todo.order,
                updatedAt: action.now,
              }
            : todo,
        ),
      };
    }
    case 'addProject':
      return { ...state, projects: [...state.projects, action.project] };
    case 'renameProject':
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.id
            ? { ...project, name: action.name.trim() }
            : project,
        ),
      };
    case 'deleteProject':
      return {
        ...state,
        projects: state.projects.filter((project) => project.id !== action.id),
        todos: state.todos.map((todo) =>
          todo.projectId === action.id
            ? { ...todo, projectId: null, updatedAt: action.now }
            : todo,
        ),
      };
    case 'renameTag':
      return {
        ...state,
        todos: state.todos.map((todo) => ({
          ...todo,
          tags: [
            ...new Set(
              todo.tags.map((tag) =>
                tag === action.oldTag ? action.newTag.trim() : tag,
              ),
            ),
          ].filter(Boolean),
          updatedAt: todo.tags.includes(action.oldTag)
            ? action.now
            : todo.updatedAt,
        })),
      };
    case 'deleteTag':
      return {
        ...state,
        todos: state.todos.map((todo) => ({
          ...todo,
          tags: todo.tags.filter((tag) => tag !== action.tag),
          updatedAt: todo.tags.includes(action.tag)
            ? action.now
            : todo.updatedAt,
        })),
      };
    case 'import':
      return action.mode === 'replace'
        ? { todos: action.todos, projects: action.projects, undo: null }
        : {
            todos: uniqueById(state.todos, action.todos),
            projects: uniqueById(state.projects, action.projects),
            undo: null,
          };
    case 'undo':
      return state.undo
        ? {
            ...state,
            todos: restoreDeletedTodos(state.todos, state.undo.entries),
            undo: null,
          }
        : state;
    case 'dismissUndo':
      return { ...state, undo: null };
  }
}
