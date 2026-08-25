import type { LucideIconName } from '@react-native-vector-icons/lucide';

import type { SmartView, TodoSort } from '../types/todo';

export const SMART_VIEWS: { value: SmartView; icon: LucideIconName }[] = [
  { value: 'all', icon: 'inbox' },
  { value: 'today', icon: 'sun' },
  { value: 'tomorrow', icon: 'sunrise' },
  { value: 'upcoming', icon: 'calendar-days' },
  { value: 'overdue', icon: 'clock-alert' },
];

export const TODO_SORTS: TodoSort[] = [
  'manual',
  'created',
  'due',
  'priority',
  'completed',
];

export const PROJECT_COLORS = [
  '#6657e8',
  '#2d9b72',
  '#e4a33b',
  '#d34f67',
  '#3d89d8',
] as const;
