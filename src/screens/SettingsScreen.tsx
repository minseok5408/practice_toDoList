import { Alert } from 'react-native';

import { SettingsView } from '../components/AppViews';
import { useTodoAppContext } from '../context/TodoAppContext';
import { TodoDomainError } from '../domain/errors';
import {
  exportCsv,
  exportJsonBackup,
  pickJsonBackup,
} from '../services/dataTransfer';
import {
  captureOperationalError,
  type OperationalError,
} from '../services/telemetry';

export function SettingsScreen() {
  const {
    app,
    displayedProjects,
    locale,
    preferences,
    t,
    tags,
    updatePreferences,
  } = useTodoAppContext();

  function runDomainAction(action: () => void) {
    try {
      action();
    } catch (error) {
      Alert.alert(
        locale === 'ko' ? '입력값을 확인해주세요.' : 'Check your input.',
        error instanceof TodoDomainError ? error.message : undefined,
      );
    }
  }

  async function runDataAction(
    action: () => Promise<void>,
    success: string,
    operation: OperationalError,
  ) {
    try {
      await action();
      Alert.alert(success);
    } catch (error) {
      captureOperationalError(error, operation);
      Alert.alert(
        locale === 'ko'
          ? '작업을 완료하지 못했습니다.'
          : 'The action could not be completed.',
        error instanceof Error ? error.message : undefined,
      );
    }
  }

  async function importData() {
    try {
      const data = await pickJsonBackup();
      if (!data) return;
      Alert.alert(
        t('jsonRestore'),
        locale === 'ko'
          ? '현재 데이터와 합치거나 백업 내용으로 완전히 교체할 수 있습니다.'
          : 'Merge with current data or replace it completely.',
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: locale === 'ko' ? '합치기' : 'Merge',
            onPress: () => void app.importTodoData(data, 'merge'),
          },
          {
            text: locale === 'ko' ? '덮어쓰기' : 'Replace',
            style: 'destructive',
            onPress: () => void app.importTodoData(data, 'replace'),
          },
        ],
      );
    } catch (error) {
      captureOperationalError(error, 'backup_import');
      Alert.alert(
        locale === 'ko'
          ? '올바른 백업 파일이 아닙니다.'
          : 'This is not a valid backup file.',
        error instanceof Error ? error.message : undefined,
      );
    }
  }

  function confirmReset() {
    Alert.alert(
      t('reset'),
      locale === 'ko'
        ? '초기화하면 모든 할 일이 삭제됩니다. 먼저 원본을 내보낼 수 있습니다.'
        : 'Reset removes every task. You can export the raw data first.',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('exportRaw'),
          onPress: () => void app.exportStorageBackup(),
        },
        {
          text: t('reset'),
          style: 'destructive',
          onPress: () => void app.resetStorage(),
        },
      ],
    );
  }

  return (
    <SettingsView
      locale={locale}
      onAddProject={(name) => runDomainAction(() => app.addProject(name))}
      onCsvExport={() =>
        void runDataAction(
          () => exportCsv(app.data),
          locale === 'ko' ? 'CSV를 내보냈습니다.' : 'CSV exported.',
          'backup_export',
        )
      }
      onDeleteProject={app.deleteProject}
      onDeleteTag={app.deleteTag}
      onJsonExport={() =>
        void runDataAction(
          () => exportJsonBackup(app.data),
          locale === 'ko' ? '백업을 내보냈습니다.' : 'Backup exported.',
          'backup_export',
        )
      }
      onJsonImport={() => void importData()}
      onPreferences={updatePreferences}
      onRawExport={() =>
        void runDataAction(
          app.exportStorageBackup,
          locale === 'ko' ? '원본을 내보냈습니다.' : 'Raw data exported.',
          'backup_export',
        )
      }
      onRenameProject={(id, name) =>
        runDomainAction(() => app.renameProject(id, name))
      }
      onRenameTag={(tag, name) =>
        runDomainAction(() => app.renameTag(tag, name))
      }
      onReset={confirmReset}
      onRetry={() => void app.retryStorage()}
      preferences={preferences}
      projects={displayedProjects}
      t={t}
      tags={tags}
    />
  );
}
