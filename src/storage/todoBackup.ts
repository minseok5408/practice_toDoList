import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { readRawTodoStorage } from './todoStorage';

export type TodoBackupDependencies = {
  readRawData: () => Promise<string | null>;
  isSharingAvailable: () => Promise<boolean>;
  writeBackupFile: (rawData: string) => string;
  shareBackupFile: (fileUri: string) => Promise<void>;
};

function createBackupFileName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `practice-todo-recovery-${timestamp}.txt`;
}

export function createTodoBackupDependencies(
  readRawData: () => Promise<string | null> = readRawTodoStorage,
): TodoBackupDependencies {
  return {
    readRawData,
    isSharingAvailable: Sharing.isAvailableAsync,
    writeBackupFile(rawData) {
      const backupFile = new File(Paths.cache, createBackupFileName());
      backupFile.create({ overwrite: true });
      backupFile.write(rawData);
      return backupFile.uri;
    },
    shareBackupFile(fileUri) {
      return Sharing.shareAsync(fileUri, {
        dialogTitle: 'Practice Todo 원본 데이터 내보내기',
        mimeType: 'text/plain',
        UTI: 'public.plain-text',
      });
    },
  };
}

export async function exportRawTodoStorageBackup(
  dependencies: TodoBackupDependencies = createTodoBackupDependencies(),
): Promise<void> {
  const rawData = await dependencies.readRawData();

  if (rawData === null) {
    throw new Error('내보낼 원본 저장 데이터가 없습니다.');
  }

  if (!(await dependencies.isSharingAvailable())) {
    throw new Error('이 기기에서는 파일 공유 기능을 사용할 수 없습니다.');
  }

  const backupFileUri = dependencies.writeBackupFile(rawData);
  await dependencies.shareBackupFile(backupFileUri);
}
