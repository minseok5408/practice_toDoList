import { useMemo } from 'react';

import { HistoryView } from '../components/AppViews';
import { useTodoAppContext } from '../context/TodoAppContext';
import { selectCompletedTodos } from '../domain/todoSelectors';

export function HistoryScreen() {
  const { app, locale, t } = useTodoAppContext();
  const todos = useMemo(() => selectCompletedTodos(app.todos), [app.todos]);
  return <HistoryView locale={locale} t={t} todos={todos} />;
}
