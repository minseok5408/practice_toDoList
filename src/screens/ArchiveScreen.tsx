import { useMemo } from 'react';

import { ArchiveView } from '../components/AppViews';
import { useTodoAppContext } from '../context/TodoAppContext';
import { selectArchivedTodos } from '../domain/todoSelectors';

export function ArchiveScreen() {
  const { app, locale, t } = useTodoAppContext();
  const todos = useMemo(() => selectArchivedTodos(app.todos), [app.todos]);
  return (
    <ArchiveView
      locale={locale}
      onDelete={(id) => void app.permanentDeleteTodos([id])}
      onRestore={(id) => void app.restoreTodos([id])}
      t={t}
      todos={todos}
    />
  );
}
