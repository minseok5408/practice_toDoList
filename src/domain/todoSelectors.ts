import { addLocalDays, isSameLocalDay, startOfLocalDay } from './dateUtils';
import type { CompletedDisplay } from '../types/preferences';
import type { SmartView, Todo, TodoFilter, TodoSort } from '../types/todo';

export type TodoQuery = {
  statusFilter: TodoFilter;
  smartView: SmartView;
  sort: TodoSort;
  projectId: string | 'all';
  tag: string | null;
  search: string;
  completedDisplay: CompletedDisplay;
  now?: number;
};

const PRIORITY_WEIGHT = {
  high: 0,
  normal: 1,
  low: 2,
} as const;

function matchesSmartView(todo: Todo, view: SmartView, now: number) {
  if (view === 'all') {
    return true;
  }

  if (todo.dueAt === null) {
    return false;
  }

  if (view === 'today') {
    return isSameLocalDay(todo.dueAt, now);
  }

  if (view === 'tomorrow') {
    return isSameLocalDay(todo.dueAt, addLocalDays(now, 1));
  }

  if (view === 'overdue') {
    return !todo.completed && todo.dueAt < now;
  }

  const dayAfterTomorrow = addLocalDays(startOfLocalDay(now), 2).getTime();
  return todo.dueAt >= dayAfterTomorrow;
}

function compareTodos(first: Todo, second: Todo, sort: TodoSort) {
  if (sort === 'created') {
    return second.createdAt - first.createdAt;
  }

  if (sort === 'due') {
    if (first.dueAt === null && second.dueAt === null) {
      return 0;
    }

    if (first.dueAt === null) {
      return 1;
    }

    if (second.dueAt === null) {
      return -1;
    }

    return first.dueAt - second.dueAt;
  }

  if (sort === 'priority') {
    return PRIORITY_WEIGHT[first.priority] - PRIORITY_WEIGHT[second.priority];
  }

  if (sort === 'completed') {
    return Number(first.completed) - Number(second.completed);
  }

  return first.order - second.order;
}

export function selectTodos(todos: Todo[], query: TodoQuery) {
  const now = query.now ?? Date.now();
  const normalizedSearch = query.search.trim().toLocaleLowerCase();

  const filteredTodos = todos.filter((todo) => {
    if (todo.archivedAt !== null) {
      return false;
    }

    if (query.statusFilter === 'active' && todo.completed) {
      return false;
    }

    if (query.statusFilter === 'completed' && !todo.completed) {
      return false;
    }

    if (
      query.completedDisplay === 'collapsed' &&
      query.statusFilter === 'all' &&
      todo.completed
    ) {
      return false;
    }

    if (!matchesSmartView(todo, query.smartView, now)) {
      return false;
    }

    if (query.projectId !== 'all' && todo.projectId !== query.projectId) {
      return false;
    }

    if (query.tag && !todo.tags.includes(query.tag)) {
      return false;
    }

    if (
      normalizedSearch &&
      !`${todo.title} ${todo.notes}`
        .toLocaleLowerCase()
        .includes(normalizedSearch)
    ) {
      return false;
    }

    return true;
  });

  return [...filteredTodos].sort((first, second) => {
    if (
      query.completedDisplay === 'bottom' &&
      first.completed !== second.completed
    ) {
      return Number(first.completed) - Number(second.completed);
    }

    const comparison = compareTodos(first, second, query.sort);
    return comparison || first.createdAt - second.createdAt;
  });
}

export function selectArchivedTodos(todos: Todo[]) {
  return todos
    .filter((todo) => todo.archivedAt !== null)
    .sort(
      (first, second) => (second.archivedAt ?? 0) - (first.archivedAt ?? 0),
    );
}

export function selectCompletedTodos(todos: Todo[]) {
  return todos
    .filter((todo) => todo.completedAt !== null && todo.archivedAt === null)
    .sort(
      (first, second) => (second.completedAt ?? 0) - (first.completedAt ?? 0),
    );
}

export function selectTags(todos: Todo[]) {
  return [...new Set(todos.flatMap((todo) => todo.tags))].sort(
    (first, second) => first.localeCompare(second),
  );
}

export function canUseManualDrag(query: TodoQuery) {
  return (
    query.sort === 'manual' &&
    query.statusFilter === 'all' &&
    query.smartView === 'all' &&
    query.projectId === 'all' &&
    query.tag === null &&
    query.search.trim() === '' &&
    query.completedDisplay === 'mixed'
  );
}
