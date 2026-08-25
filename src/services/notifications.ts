import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Todo } from '../types/todo';

const CHANNEL_ID = 'todo-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function prepareAndroidChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Todo reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: '#6657e8',
  });
}

function permissionGranted(
  permission: Notifications.NotificationPermissionsStatus,
) {
  return (
    permission.granted ||
    permission.ios?.status ===
      Notifications.IosAuthorizationStatus.PROVISIONAL ||
    permission.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

export async function requestNotificationPermission() {
  await prepareAndroidChannel();
  const existingPermission = await Notifications.getPermissionsAsync();

  if (permissionGranted(existingPermission)) {
    return true;
  }

  const requestedPermission = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });
  return permissionGranted(requestedPermission);
}

export type ScheduleReminderResult =
  | { status: 'scheduled'; notificationId: string }
  | { status: 'denied'; notificationId: null }
  | { status: 'skipped'; notificationId: null };

export async function scheduleTodoReminder(
  todo: Todo,
  language: 'ko' | 'en',
): Promise<ScheduleReminderResult> {
  if (
    todo.reminderAt === null ||
    todo.reminderAt <= Date.now() ||
    todo.completed ||
    todo.archivedAt !== null
  ) {
    return { status: 'skipped', notificationId: null };
  }

  if (!(await requestNotificationPermission())) {
    return { status: 'denied', notificationId: null };
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: language === 'ko' ? '할 일 알림' : 'Task reminder',
      body: todo.title,
      data: { todoId: todo.id },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(todo.reminderAt),
      channelId: CHANNEL_ID,
    },
  });

  return { status: 'scheduled', notificationId };
}

export async function cancelTodoReminder(notificationId: string | null) {
  if (notificationId) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }
}
