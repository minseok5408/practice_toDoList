import { createContext, useContext } from 'react';

import type { usePreferences } from '../hooks/usePreferences';
import type { useTodos } from '../hooks/useTodos';
import type { Translator } from '../i18n';
import type { Project } from '../types/todo';

export type TodoAppContextValue = {
  app: ReturnType<typeof useTodos>;
  preferences: ReturnType<typeof usePreferences>['preferences'];
  updatePreferences: ReturnType<typeof usePreferences>['updatePreferences'];
  locale: 'ko' | 'en';
  t: Translator;
  displayedProjects: Project[];
  tags: string[];
};

export const TodoAppContext = createContext<TodoAppContextValue | null>(null);

export function useTodoAppContext() {
  const value = useContext(TodoAppContext);
  if (!value) {
    throw new Error('TodoAppContext.Provider 안에서 사용해야 합니다.');
  }
  return value;
}
