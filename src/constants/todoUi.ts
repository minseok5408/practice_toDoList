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
  '#3282f6',
  '#12a17d',
  '#e49a25',
  '#df5d72',
  '#258ea6',
] as const;
