import { DEFAULT_PREFERENCES } from '../types/preferences';
import { parsePreferences } from './preferencesStorage';

describe('preferencesStorage', () => {
  it('유효한 필터, 정렬, 화면 및 외관 설정을 보존한다', () => {
    const preferences = {
      ...DEFAULT_PREFERENCES,
      language: 'en' as const,
      themeMode: 'dark' as const,
      completedDisplay: 'bottom' as const,
      statusFilter: 'active' as const,
      smartView: 'today' as const,
      sort: 'priority' as const,
      selectedProjectId: 'work',
      selectedTag: 'important',
      lastScreen: 'settings' as const,
      hasOnboarded: true,
      notificationPermissionPrompted: true,
    };

    expect(parsePreferences(preferences)).toEqual(preferences);
  });

  it('손상된 값은 필드별 기본값으로 복구한다', () => {
    expect(
      parsePreferences({
        language: 'wrong',
        themeMode: 3,
        statusFilter: 'missing',
        hasOnboarded: 'yes',
        notificationPermissionPrompted: 'yes',
      }),
    ).toEqual(DEFAULT_PREFERENCES);
  });
});
