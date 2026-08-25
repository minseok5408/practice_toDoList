import { useCallback, useEffect, useState } from 'react';

import {
  loadPreferences,
  savePreferences,
} from '../storage/preferencesStorage';
import { DEFAULT_PREFERENCES, type AppPreferences } from '../types/preferences';

export function usePreferences() {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    void loadPreferences()
      .then((storedPreferences) => {
        if (active) {
          setPreferences(storedPreferences);
          setIsHydrated(true);
        }
      })
      .catch(() => {
        if (active) {
          setPreferences(DEFAULT_PREFERENCES);
          setIsHydrated(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isHydrated) {
      void savePreferences(preferences).catch(() => undefined);
    }
  }, [isHydrated, preferences]);

  const updatePreferences = useCallback((changes: Partial<AppPreferences>) => {
    setPreferences((current) => ({ ...current, ...changes }));
  }, []);

  return { preferences, isHydrated, updatePreferences };
}
