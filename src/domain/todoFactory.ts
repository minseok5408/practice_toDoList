import { addLocalDays, addLocalMonths, getNextWeekday } from './dateUtils';
import { assertRecurrence, assertTodoTitle } from './errors';
import type {
  Project,
  Subtask,
  Todo,
  TodoPriority,
  TodoRecurrence,
} from '../types/todo';

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'project-personal',
    name: '개인',
    color: '#6657e8',
    createdAt: 0,
  },
  {
    id: 'project-work',
    name: '업무',
    color: '#2d9b72',
    createdAt: 0,
  },
  {
    id: 'project-study',
    name: '공부',
    color: '#e4a33b',
    createdAt: 0,
  },
];

export type CreateTodoInput = {
  id: string;
  title: string;
  notes?: string;
  priority?: TodoPriority;
  dueAt?: number | null;
  reminderAt?: number | null;
  projectId?: string | null;
  tags?: string[];
  subtasks?: Subtask[];
  recurrence?: TodoRecurrence | null;
  order: number;
  now?: number;
};

export function createTodo({
  id,
  title,
  notes = '',
  priority = 'normal',
  dueAt = null,
  reminderAt = null,
  projectId = DEFAULT_PROJECTS[0].id,
  tags = [],
  subtasks = [],
  recurrence = null,
  order,
  now = Date.now(),
}: CreateTodoInput): Todo {
  assertTodoTitle(title);
  if (recurrence) {
    assertRecurrence(recurrence.interval);
  }

  return {
    id,
    title: title.trim(),
    notes: notes.trim(),
    completed: false,
    priority,
    dueAt,
    reminderAt,
    notificationId: null,
    projectId,
    tags: [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))],
    subtasks,
    recurrence,
    order,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    archivedAt: null,
  };
}

function nextDueDate(todo: Todo) {
  if (!todo.recurrence || todo.dueAt === null) {
    return null;
  }

  const { frequency, interval } = todo.recurrence;

  if (frequency === 'weekly') {
    return addLocalDays(todo.dueAt, 7 * interval).getTime();
  }

  if (frequency === 'weekdays') {
    return getNextWeekday(todo.dueAt, interval).getTime();
  }

  if (frequency === 'monthly') {
    return addLocalMonths(todo.dueAt, interval).getTime();
  }

  return addLocalDays(todo.dueAt, interval).getTime();
}

export function createNextRecurringTodo(
  todo: Todo,
  createId: () => string,
  now = Date.now(),
): Todo | null {
  const dueAt = nextDueDate(todo);

  if (dueAt === null) {
    return null;
  }

  const reminderOffset =
    todo.reminderAt !== null && todo.dueAt !== null
      ? todo.dueAt - todo.reminderAt
      : null;

  return {
    ...todo,
    id: createId(),
    completed: false,
    dueAt,
    reminderAt: reminderOffset === null ? null : dueAt - reminderOffset,
    notificationId: null,
    subtasks: todo.subtasks.map((subtask) => ({
      ...subtask,
      id: createId(),
      completed: false,
    })),
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    archivedAt: null,
  };
}
