import { Lucide } from '@react-native-vector-icons/lucide';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppFeedback } from '../hooks/useTodos';
import type { Translator } from '../i18n';
import { useAppTheme, type AppTheme } from '../theme';

export function StorageErrorBanner({
  message,
  t,
  onRetry,
  onBackup,
}: {
  message: string;
  t: Translator;
  onRetry: () => void;
  onBackup: () => void;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.storageBanner}>
      <Lucide color={theme.colors.danger} name="triangle-alert" size={19} />
      <Text style={styles.storageText}>{message}</Text>
      <Pressable onPress={onBackup} style={styles.bannerButton}>
        <Text style={styles.bannerButtonText}>{t('exportRaw')}</Text>
      </Pressable>
      <Pressable onPress={onRetry} style={styles.bannerButton}>
        <Text style={styles.bannerButtonText}>{t('retry')}</Text>
      </Pressable>
    </View>
  );
}

export function FeedbackSnackbar({
  message,
  kind,
  action,
  onAction,
  onClose,
}: {
  message: string;
  kind: AppFeedback['kind'];
  action?: string;
  onAction?: () => void;
  onClose: () => void;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const color =
    kind === 'error'
      ? theme.colors.danger
      : kind === 'success'
      ? theme.colors.success
      : theme.colors.warning;

  return (
    <View style={styles.snackbar}>
      <Lucide
        color={color}
        name={
          kind === 'success'
            ? 'circle-check'
            : kind === 'error'
            ? 'circle-alert'
            : 'info'
        }
        size={18}
      />
      <Text style={styles.snackbarText}>{message}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} style={styles.snackbarAction}>
          <Text style={[styles.actionText, { color }]}>{action}</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onClose} style={styles.snackbarClose}>
        <Lucide color={theme.colors.textSoft} name="x" size={15} />
      </Pressable>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radii, sizes, spacing, typography } = theme;
  return StyleSheet.create({
    storageBanner: {
      alignItems: 'center',
      backgroundColor: colors.dangerSoft,
      bottom: 76,
      flexDirection: 'row',
      gap: spacing.sm,
      left: spacing.md,
      padding: spacing.sm,
      position: 'absolute',
      right: spacing.md,
      zIndex: 8,
    },
    storageText: {
      ...typography.caption,
      color: colors.danger,
      flex: 1,
      fontWeight: '700',
    },
    bannerButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: sizes.minTouchTarget,
      paddingHorizontal: spacing.xs,
    },
    bannerButtonText: {
      ...typography.caption,
      color: colors.danger,
      fontWeight: '800',
    },
    snackbar: {
      alignItems: 'center',
      backgroundColor: colors.text,
      borderRadius: radii.lg,
      bottom: 78,
      flexDirection: 'row',
      gap: spacing.sm,
      left: spacing.lg,
      minHeight: 52,
      paddingHorizontal: spacing.md,
      position: 'absolute',
      right: spacing.lg,
      zIndex: 9,
    },
    snackbarText: {
      ...typography.caption,
      color: colors.background,
      flex: 1,
      fontWeight: '700',
    },
    snackbarAction: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: sizes.minTouchTarget,
      paddingHorizontal: spacing.sm,
    },
    actionText: { ...typography.label, fontWeight: '900' },
    snackbarClose: {
      alignItems: 'center',
      height: sizes.minTouchTarget,
      justifyContent: 'center',
      width: 32,
    },
  });
}
