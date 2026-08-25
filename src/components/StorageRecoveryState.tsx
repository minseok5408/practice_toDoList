import { Lucide } from '@react-native-vector-icons/lucide';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Translator } from '../i18n';
import { useAppTheme, type AppTheme } from '../theme';
import { ScreenState } from './ScreenState';

export function StorageRecoveryState({
  message,
  t,
  onRetry,
  onBackup,
  onReset,
}: {
  message: string;
  t: Translator;
  onRetry: () => void;
  onBackup: () => void;
  onReset: () => void;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View accessibilityLiveRegion="assertive" style={styles.container}>
      <ScreenState
        compact
        description={message}
        icon="database-zap"
        title={t('storageProblem')}
        variant="error"
      />
      <View style={styles.actions}>
        <RecoveryButton
          icon="refresh-cw"
          label={t('retry')}
          onPress={onRetry}
          primary
          testID="storage-retry"
        />
        <RecoveryButton
          icon="file-down"
          label={t('exportRaw')}
          onPress={onBackup}
          testID="storage-backup"
        />
        <RecoveryButton
          danger
          icon="trash-2"
          label={t('reset')}
          onPress={onReset}
          testID="storage-reset"
        />
      </View>
    </View>
  );
}

function RecoveryButton({
  label,
  icon,
  testID,
  primary = false,
  danger = false,
  onPress,
}: {
  label: string;
  icon: 'file-down' | 'refresh-cw' | 'trash-2';
  testID: string;
  primary?: boolean;
  danger?: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const color = primary
    ? '#ffffff'
    : danger
    ? theme.colors.danger
    : theme.colors.textMuted;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.button,
        primary && styles.primaryButton,
        danger && styles.dangerButton,
      ]}
      testID={testID}
    >
      <Lucide color={color} name={icon} size={17} />
      <Text style={[styles.buttonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radii, sizes, spacing, typography } = theme;
  return StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      flex: 1,
      justifyContent: 'center',
      padding: spacing.xxl,
    },
    actions: {
      alignSelf: 'center',
      gap: spacing.sm,
      maxWidth: 360,
      width: '100%',
    },
    button: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.md,
      borderWidth: 1,
      flexDirection: 'row',
      gap: spacing.sm,
      justifyContent: 'center',
      minHeight: sizes.control,
      paddingHorizontal: spacing.lg,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dangerButton: {
      backgroundColor: colors.dangerSoft,
      borderColor: colors.dangerSoft,
    },
    buttonText: typography.label,
  });
}
