import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_PREFERENCES, type AppPreferences } from '../types/preferences';

const PREFERENCES_STORAGE_KEY = '@practice-todo/preferences-v1';

function isOneOf<T extends string>(
  value: unknown,
  values: readonly T[],
): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

export function parsePreferences(value: unknown): AppPreferences {
  if (!value || typeof value !== 'object') {
    return DEFAULT_PREFERENCES;
  }

  const data = value as Partial<AppPreferences>;
  return {
    language: isOneOf(data.language, ['system', 'ko', 'en'])
      ? data.language
      : DEFAULT_PREFERENCES.language,
    themeMode: isOneOf(data.themeMode, ['system', 'light', 'dark'])
      ? data.themeMode
      : DEFAULT_PREFERENCES.themeMode,
    completedDisplay: isOneOf(data.completedDisplay, [
      'mixed',
      'bottom',
      'collapsed',
    ])
      ? data.completedDisplay
      : DEFAULT_PREFERENCES.completedDisplay,
    statusFilter: isOneOf(data.statusFilter, ['all', 'active', 'completed'])
      ? data.statusFilter
      : DEFAULT_PREFERENCES.statusFilter,
    smartView: isOneOf(data.smartView, [
      'all',
      'today',
      'tomorrow',
      'upcoming',
      'overdue',
    ])
      ? data.smartView
      : DEFAULT_PREFERENCES.smartView,
    sort: isOneOf(data.sort, [
      'manual',
      'created',
      'due',
      'priority',
      'completed',
    ])
      ? data.sort
      : DEFAULT_PREFERENCES.sort,
    selectedProjectId:
      typeof data.selectedProjectId === 'string'
        ? data.selectedProjectId
        : DEFAULT_PREFERENCES.selectedProjectId,
    selectedTag:
      data.selectedTag === null || typeof data.selectedTag === 'string'
        ? data.selectedTag
        : DEFAULT_PREFERENCES.selectedTag,
    lastScreen: isOneOf(data.lastScreen, [
      'tasks',
      'calendar',
      'history',
      'archive',
      'settings',
    ])
      ? data.lastScreen
      : DEFAULT_PREFERENCES.lastScreen,
    hasOnboarded:
      typeof data.hasOnboarded === 'boolean'
        ? data.hasOnboarded
        : DEFAULT_PREFERENCES.hasOnboarded,
    notificationPermissionPrompted:
      typeof data.notificationPermissionPrompted === 'boolean'
        ? data.notificationPermissionPrompted
        : DEFAULT_PREFERENCES.notificationPermissionPrompted,
  };
}

export async function loadPreferences() {
  const rawData = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);

  if (!rawData) {
    return DEFAULT_PREFERENCES;
  }

  try {
    return parsePreferences(JSON.parse(rawData));
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(preferences: AppPreferences) {
  await AsyncStorage.setItem(
    PREFERENCES_STORAGE_KEY,
    JSON.stringify(preferences),
  );
}
