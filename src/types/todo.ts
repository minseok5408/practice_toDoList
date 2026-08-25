export type TodoPriority = 'low' | 'normal' | 'high';

export type RecurrenceFrequency =
  | 'daily'
  | 'weekly'
  | 'weekdays'
  | 'monthly'
  | 'custom';

export type TodoRecurrence = {
  frequency: RecurrenceFrequency;
  interval: number;
};

export type Subtask = {
  id: string;
  title: string;
  completed: boolean;
};

export type Todo = {
  id: string;
  title: string;
  notes: string;
  completed: boolean;
  priority: TodoPriority;
  dueAt: number | null;
  reminderAt: number | null;
  notificationId: string | null;
  projectId: string | null;
  tags: string[];
  subtasks: Subtask[];
  recurrence: TodoRecurrence | null;
  order: number;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
  archivedAt: number | null;
};

export type Project = {
  id: string;
  name: string;
  color: string;
  createdAt: number;
};

export type TodoData = {
  todos: Todo[];
  projects: Project[];
};

export type TodoFilter = 'all' | 'active' | 'completed';
export type SmartView = 'all' | 'today' | 'tomorrow' | 'upcoming' | 'overdue';
export type TodoSort = 'manual' | 'created' | 'due' | 'priority' | 'completed';
export type MainScreen = 'tasks' | 'history' | 'archive' | 'settings';

const TODO_PRIORITIES: readonly TodoPriority[] = ['low', 'normal', 'high'];
const RECURRENCE_FREQUENCIES: readonly RecurrenceFrequency[] = [
  'daily',
  'weekly',
  'weekdays',
  'monthly',
  'custom',
];

function isNullableNumber(value: unknown): value is number | null {
  return (
    value === null || (typeof value === 'number' && Number.isFinite(value))
  );
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isSubtask(value: unknown): value is Subtask {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const subtask = value as Record<string, unknown>;
  return (
    typeof subtask.id === 'string' &&
    typeof subtask.title === 'string' &&
    subtask.title.trim().length > 0 &&
    typeof subtask.completed === 'boolean'
  );
}

function isRecurrence(value: unknown): value is TodoRecurrence {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const recurrence = value as Record<string, unknown>;
  return (
    typeof recurrence.frequency === 'string' &&
    RECURRENCE_FREQUENCIES.includes(
      recurrence.frequency as RecurrenceFrequency,
    ) &&
    typeof recurrence.interval === 'number' &&
    Number.isInteger(recurrence.interval) &&
    recurrence.interval > 0
  );
}

export function isTodo(value: unknown): value is Todo {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const todo = value as Record<string, unknown>;

  return (
    typeof todo.id === 'string' &&
    typeof todo.title === 'string' &&
    todo.title.trim().length > 0 &&
    typeof todo.notes === 'string' &&
    typeof todo.completed === 'boolean' &&
    typeof todo.priority === 'string' &&
    TODO_PRIORITIES.includes(todo.priority as TodoPriority) &&
    isNullableNumber(todo.dueAt) &&
    isNullableNumber(todo.reminderAt) &&
    isNullableString(todo.notificationId) &&
    isNullableString(todo.projectId) &&
    Array.isArray(todo.tags) &&
    todo.tags.every(
      (tag) => typeof tag === 'string' && tag.trim().length > 0,
    ) &&
    Array.isArray(todo.subtasks) &&
    todo.subtasks.every(isSubtask) &&
    (todo.recurrence === null || isRecurrence(todo.recurrence)) &&
    typeof todo.order === 'number' &&
    Number.isFinite(todo.order) &&
    typeof todo.createdAt === 'number' &&
    Number.isFinite(todo.createdAt) &&
    typeof todo.updatedAt === 'number' &&
    Number.isFinite(todo.updatedAt) &&
    isNullableNumber(todo.completedAt) &&
    isNullableNumber(todo.archivedAt)
  );
}

export function isProject(value: unknown): value is Project {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const project = value as Record<string, unknown>;
  return (
    typeof project.id === 'string' &&
    typeof project.name === 'string' &&
    project.name.trim().length > 0 &&
    typeof project.color === 'string' &&
    typeof project.createdAt === 'number' &&
    Number.isFinite(project.createdAt)
  );
}
