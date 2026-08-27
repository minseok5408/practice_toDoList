import { Lucide } from '@react-native-vector-icons/lucide';
import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Translator } from '../i18n';
import { useAppTheme, type AppTheme } from '../theme';

type NotificationPermissionPromptProps = {
  visible: boolean;
  requesting: boolean;
  t: Translator;
  onAllow: () => void;
  onLater: () => void;
};

export function NotificationPermissionPrompt({
  visible,
  requesting,
  t,
  onAllow,
  onLater,
}: NotificationPermissionPromptProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onLater}
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.icon}>
            <Lucide color={theme.colors.primary} name="bell-ring" size={28} />
          </View>
          <Text style={styles.title}>{t('notificationPermissionTitle')}</Text>
          <Text style={styles.message}>
            {t('notificationPermissionMessage')}
          </Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={requesting}
              onPress={onLater}
              style={styles.laterButton}
              testID="notification-permission-later"
            >
              <Text style={styles.laterText}>{t('later')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: requesting }}
              disabled={requesting}
              onPress={onAllow}
              style={[styles.allowButton, requesting && styles.disabledButton]}
              testID="notification-permission-allow"
            >
              <Text style={styles.allowText}>{t('allowNotifications')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing, typography } = theme;
  return StyleSheet.create({
    backdrop: {
      alignItems: 'center',
      backgroundColor: colors.overlay,
      flex: 1,
      justifyContent: 'center',
      padding: spacing.xl,
    },
    card: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      maxWidth: 420,
      padding: spacing.xl,
      width: '100%',
      ...theme.shadows.floating,
    },
    icon: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 24,
      height: 56,
      justifyContent: 'center',
      width: 56,
    },
    title: {
      ...typography.title,
      color: colors.text,
      fontSize: 18,
      marginTop: spacing.lg,
      textAlign: 'center',
    },
    message: {
      ...typography.body,
      color: colors.textMuted,
      lineHeight: 22,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.xl,
      width: '100%',
    },
    laterButton: {
      alignItems: 'center',
      borderRadius: radii.md,
      flex: 1,
      justifyContent: 'center',
      minHeight: 48,
    },
    laterText: { ...typography.label, color: colors.textMuted },
    allowButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: radii.md,
      flex: 1.4,
      justifyContent: 'center',
      minHeight: 48,
    },
    allowText: { ...typography.label, color: '#ffffff' },
    disabledButton: { opacity: 0.55 },
  });
}
