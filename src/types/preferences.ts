import type { MainScreen, SmartView, TodoFilter, TodoSort } from './todo';

export type AppLanguage = 'system' | 'ko' | 'en';
export type ThemeMode = 'system' | 'light' | 'dark';
export type CompletedDisplay = 'mixed' | 'bottom' | 'collapsed';

export type AppPreferences = {
  language: AppLanguage;
  themeMode: ThemeMode;
  completedDisplay: CompletedDisplay;
  statusFilter: TodoFilter;
  smartView: SmartView;
  sort: TodoSort;
  selectedProjectId: string | 'all';
  selectedTag: string | null;
  lastScreen: MainScreen;
  hasOnboarded: boolean;
  notificationPermissionPrompted: boolean;
};

export const DEFAULT_PREFERENCES: AppPreferences = {
  language: 'system',
  themeMode: 'system',
  completedDisplay: 'mixed',
  statusFilter: 'all',
  smartView: 'all',
  sort: 'manual',
  selectedProjectId: 'all',
  selectedTag: null,
  lastScreen: 'tasks',
  hasOnboarded: false,
  notificationPermissionPrompted: false,
};
