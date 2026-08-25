import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { parseStoredTodoData, serializeTodoData } from '../storage/todoStorage';
import type { Project, Todo, TodoData } from '../types/todo';

function timestampForFileName() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function shareTextFile(
  fileName: string,
  contents: string,
  mimeType: string,
  UTI: string,
) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('이 기기에서는 파일 공유 기능을 사용할 수 없습니다.');
  }

  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(contents);

  await Sharing.shareAsync(file.uri, {
    dialogTitle: 'Practice Todo 데이터 내보내기',
    mimeType,
    UTI,
  });
}

export async function exportJsonBackup(data: TodoData) {
  await shareTextFile(
    `practice-todo-backup-${timestampForFileName()}.json`,
    serializeTodoData(data),
    'application/json',
    'public.json',
  );
}

function escapeCsv(value: string | number | boolean | null) {
  const text = value === null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function projectName(projects: Project[], projectId: string | null) {
  return projects.find((project) => project.id === projectId)?.name ?? '';
}

function todoToCsvRow(todo: Todo, projects: Project[]) {
  return [
    todo.id,
    todo.title,
    todo.notes,
    todo.completed,
    todo.priority,
    todo.dueAt === null ? '' : new Date(todo.dueAt).toISOString(),
    todo.reminderAt === null ? '' : new Date(todo.reminderAt).toISOString(),
    projectName(projects, todo.projectId),
    todo.tags.join('|'),
    `${todo.subtasks.filter((subtask) => subtask.completed).length}/${
      todo.subtasks.length
    }`,
    todo.recurrence?.frequency ?? '',
    new Date(todo.createdAt).toISOString(),
    todo.completedAt === null ? '' : new Date(todo.completedAt).toISOString(),
    todo.archivedAt === null ? '' : new Date(todo.archivedAt).toISOString(),
  ]
    .map(escapeCsv)
    .join(',');
}

export async function exportCsv(data: TodoData) {
  const headers = [
    'id',
    'title',
    'notes',
    'completed',
    'priority',
    'dueAt',
    'reminderAt',
    'project',
    'tags',
    'subtasks',
    'recurrence',
    'createdAt',
    'completedAt',
    'archivedAt',
  ];
  const csv = [
    headers.map(escapeCsv).join(','),
    ...data.todos.map((todo) => todoToCsvRow(todo, data.projects)),
  ].join('\n');

  await shareTextFile(
    `practice-todo-${timestampForFileName()}.csv`,
    `\uFEFF${csv}`,
    'text/csv',
    'public.comma-separated-values-text',
  );
}

export async function pickJsonBackup(): Promise<TodoData | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/json', 'text/plain'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled) {
    return null;
  }

  const selectedFile = new File(result.assets[0].uri);
  const contents = await selectedFile.text();
  const storedData = parseStoredTodoData(contents);
  return { todos: storedData.todos, projects: storedData.projects };
}
