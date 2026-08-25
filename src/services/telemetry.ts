import * as Sentry from '@sentry/react-native';

export type OperationalError =
  | 'backup_export'
  | 'backup_import'
  | 'notification_cancel'
  | 'notification_schedule'
  | 'todo_storage_load'
  | 'todo_storage_reset'
  | 'todo_storage_save';

export function initTelemetry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  Sentry.init({
    dsn,
    enabled: Boolean(dsn),
    sendDefaultPii: false,
    tracesSampleRate: !__DEV__ && dsn ? 0.1 : 0,
    beforeSend(event) {
      // 할 일 제목·메모·백업 내용은 오류 보고서에 포함하지 않습니다.
      delete event.user;
      delete event.extra;
      return event;
    },
  });
}

export function captureOperationalError(
  error: unknown,
  operation: OperationalError,
) {
  const normalizedError =
    error instanceof Error ? error : new Error('Unknown operational error');

  Sentry.captureException(normalizedError, {
    tags: { operation },
  });
}
