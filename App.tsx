import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import * as Sentry from '@sentry/react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  NavigationContainer,
  type NavigationState,
  type PartialState,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useLocales } from 'expo-localization';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Platform,
  StyleSheet,
  UIManager,
  useColorScheme,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

import { OnboardingView } from './src/components/AppViews';
import {
  FeedbackSnackbar,
  StorageErrorBanner,
} from './src/components/FeedbackOverlay';
import { ScreenState } from './src/components/ScreenState';
import { NotificationPermissionPrompt } from './src/components/NotificationPermissionPrompt';
import {
  TodoAppContext,
  type TodoAppContextValue,
} from './src/context/TodoAppContext';
import { selectTags } from './src/domain/todoSelectors';
import { usePreferences } from './src/hooks/usePreferences';
import { useTodos } from './src/hooks/useTodos';
import { createTranslator, resolveLanguage } from './src/i18n';
import type { RootTabParamList } from './src/navigation/types';
import { ArchiveScreen } from './src/screens/ArchiveScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TodoScreen } from './src/screens/TodoScreen';
import {
  hasNotificationPermission,
  requestNotificationPermission,
} from './src/services/notifications';
import {
  darkTheme,
  lightTheme,
  ThemeContext,
  type AppTheme,
} from './src/theme';
import type { AppPreferences } from './src/types/preferences';
import type { MainScreen } from './src/types/todo';
import { localizeProjects } from './src/utils/projectLocalization';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Tab = createBottomTabNavigator<RootTabParamList>();

const ROUTE_TO_SCREEN: Record<keyof RootTabParamList, MainScreen> = {
  Tasks: 'tasks',
  Calendar: 'calendar',
  History: 'history',
  Archive: 'archive',
  Settings: 'settings',
};

const SCREEN_TO_ROUTE: Record<MainScreen, keyof RootTabParamList> = {
  tasks: 'Tasks',
  calendar: 'Calendar',
  history: 'History',
  archive: 'Archive',
  settings: 'Settings',
};

const TAB_ICONS: Record<keyof RootTabParamList, LucideIconName> = {
  Tasks: 'list-checks',
  Calendar: 'calendar-days',
  History: 'history',
  Archive: 'archive',
  Settings: 'settings',
};

function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(App);

function AppContent() {
  const systemTheme = useColorScheme();
  const systemLocales = useLocales();
  const {
    preferences,
    isHydrated: preferencesHydrated,
    updatePreferences,
  } = usePreferences();
  const locale = resolveLanguage(
    preferences.language,
    systemLocales.map(
      (systemLocale) => systemLocale.languageCode ?? systemLocale.languageTag,
    ),
  );
  const t = useMemo(() => createTranslator(locale), [locale]);
  const theme =
    preferences.themeMode === 'dark' ||
    (preferences.themeMode === 'system' && systemTheme === 'dark')
      ? darkTheme
      : lightTheme;

  return (
    <ThemeContext.Provider value={theme}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.flex, { backgroundColor: theme.colors.background }]}
      >
        {!preferencesHydrated ? (
          <ScreenState title={t('loading')} variant="loading" />
        ) : !preferences.hasOnboarded ? (
          <OnboardingView
            locale={locale}
            onDone={() => updatePreferences({ hasOnboarded: true })}
          />
        ) : (
          <MainApp
            locale={locale}
            preferences={preferences}
            t={t}
            theme={theme}
            updatePreferences={updatePreferences}
          />
        )}
      </SafeAreaView>
    </ThemeContext.Provider>
  );
}

function MainApp({
  locale,
  preferences,
  t,
  theme,
  updatePreferences,
}: {
  locale: 'ko' | 'en';
  preferences: AppPreferences;
  t: ReturnType<typeof createTranslator>;
  theme: AppTheme;
  updatePreferences: (changes: Partial<AppPreferences>) => void;
}) {
  const app = useTodos(locale);
  const notificationPromptStarted = useRef(false);
  const [notificationPromptVisible, setNotificationPromptVisible] =
    useState(false);
  const [
    requestingNotificationPermission,
    setRequestingNotificationPermission,
  ] = useState(false);
  const tags = useMemo(() => selectTags(app.todos), [app.todos]);
  const displayedProjects = useMemo(
    () => localizeProjects(app.projects, locale),
    [app.projects, locale],
  );

  useEffect(() => {
    if (
      preferences.selectedProjectId !== 'all' &&
      !app.projects.some(
        (project) => project.id === preferences.selectedProjectId,
      )
    ) {
      updatePreferences({ selectedProjectId: 'all' });
    }
  }, [app.projects, preferences.selectedProjectId, updatePreferences]);

  useEffect(() => {
    if (preferences.selectedTag && !tags.includes(preferences.selectedTag)) {
      updatePreferences({ selectedTag: null });
    }
  }, [preferences.selectedTag, tags, updatePreferences]);

  useEffect(() => {
    if (
      !app.isHydrated ||
      preferences.notificationPermissionPrompted ||
      notificationPromptStarted.current
    ) {
      return;
    }

    notificationPromptStarted.current = true;
    let active = true;

    void hasNotificationPermission()
      .then((granted) => {
        if (!active) return;
        if (granted) {
          updatePreferences({ notificationPermissionPrompted: true });
          return;
        }
        setNotificationPromptVisible(true);
      })
      .catch(() => {
        if (active) setNotificationPromptVisible(true);
      });

    return () => {
      active = false;
    };
  }, [
    app.isHydrated,
    preferences.notificationPermissionPrompted,
    updatePreferences,
  ]);

  function postponeNotificationPermission() {
    setNotificationPromptVisible(false);
    updatePreferences({ notificationPermissionPrompted: true });
  }

  async function allowNotificationPermission() {
    if (requestingNotificationPermission) return;

    setRequestingNotificationPermission(true);
    let granted = false;
    try {
      granted = await requestNotificationPermission();
    } finally {
      setRequestingNotificationPermission(false);
      setNotificationPromptVisible(false);
      updatePreferences({ notificationPermissionPrompted: true });
    }

    if (!granted) {
      Alert.alert(
        t('notificationPermissionTitle'),
        t('notificationPermissionOff'),
      );
    }
  }

  const contextValue = useMemo<TodoAppContextValue>(
    () => ({
      app,
      displayedProjects,
      locale,
      preferences,
      t,
      tags,
      updatePreferences,
    }),
    [app, displayedProjects, locale, preferences, t, tags, updatePreferences],
  );

  function routeNameFromState(
    state: NavigationState | PartialState<NavigationState> | undefined,
  ): keyof RootTabParamList | null {
    if (!state || state.index === undefined) return null;
    const route = state.routes[state.index];
    if (route.state) return routeNameFromState(route.state);
    return route.name as keyof RootTabParamList;
  }

  if (!app.isHydrated) {
    return <ScreenState title={t('loading')} variant="loading" />;
  }

  return (
    <TodoAppContext.Provider value={contextValue}>
      <View style={styles.flex}>
        <NavigationContainer
          onStateChange={(state) => {
            const route = routeNameFromState(state);
            if (!route) return;
            const lastScreen = ROUTE_TO_SCREEN[route];
            if (lastScreen !== preferences.lastScreen) {
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
              );
              updatePreferences({ lastScreen });
            }
          }}
          theme={{
            dark: theme.dark,
            colors: {
              primary: theme.colors.primary,
              background: theme.colors.background,
              card: theme.colors.surface,
              text: theme.colors.text,
              border: theme.colors.border,
              notification: theme.colors.danger,
            },
            fonts: {
              regular: { fontFamily: 'System', fontWeight: '400' },
              medium: { fontFamily: 'System', fontWeight: '500' },
              bold: { fontFamily: 'System', fontWeight: '700' },
              heavy: { fontFamily: 'System', fontWeight: '900' },
            },
          }}
        >
          <Tab.Navigator
            initialRouteName={SCREEN_TO_ROUTE[preferences.lastScreen]}
            screenOptions={({ route }) => ({
              animation: 'shift',
              headerShown: false,
              tabBarActiveTintColor: theme.colors.primary,
              tabBarInactiveTintColor: theme.colors.textSoft,
              tabBarHideOnKeyboard: true,
              tabBarIcon: ({ color, size }) => (
                <Lucide
                  color={color}
                  name={TAB_ICONS[route.name]}
                  size={Math.min(size, 21)}
                />
              ),
              tabBarLabelStyle: {
                ...theme.typography.caption,
                fontSize: 9,
              },
              tabBarStyle: {
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.border,
              },
            })}
          >
            <Tab.Screen
              component={TodoScreen}
              name="Tasks"
              options={{ title: t('tasks') }}
            />
            <Tab.Screen
              component={CalendarScreen}
              name="Calendar"
              options={{ title: t('calendar') }}
            />
            <Tab.Screen
              component={HistoryScreen}
              name="History"
              options={{ title: t('history') }}
            />
            <Tab.Screen
              component={ArchiveScreen}
              name="Archive"
              options={{ title: t('archiveBox') }}
            />
            <Tab.Screen
              component={SettingsScreen}
              name="Settings"
              options={{ title: t('settings') }}
            />
          </Tab.Navigator>
        </NavigationContainer>

        {app.storageError ? (
          <StorageErrorBanner
            message={app.storageError.message}
            onBackup={() => void app.exportStorageBackup()}
            onRetry={() => void app.retryStorage()}
            t={t}
          />
        ) : null}
        {app.undoState ? (
          <FeedbackSnackbar
            action={t('undo')}
            kind="warning"
            message={app.undoState.message}
            onAction={() => void app.undoLastDelete()}
            onClose={app.dismissUndo}
          />
        ) : app.feedback ? (
          <FeedbackSnackbar
            kind={app.feedback.kind}
            message={app.feedback.message}
            onClose={app.dismissFeedback}
          />
        ) : null}
        <NotificationPermissionPrompt
          onAllow={() => void allowNotificationPermission()}
          onLater={postponeNotificationPermission}
          requesting={requestingNotificationPermission}
          t={t}
          visible={notificationPromptVisible}
        />
      </View>
    </TodoAppContext.Provider>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
