import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAppTheme, type AppTheme } from '../theme';

type ScreenStateProps = {
  variant: 'loading' | 'empty' | 'error';
  title: string;
  description?: string;
  icon?: LucideIconName;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
};

export function ScreenState({
  variant,
  title,
  description,
  icon,
  actionLabel,
  onAction,
  compact = false,
}: ScreenStateProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const color =
    variant === 'error' ? theme.colors.danger : theme.colors.textSoft;

  return (
    <View
      accessibilityLiveRegion={variant === 'loading' ? 'polite' : undefined}
      style={[styles.container, compact && styles.compact]}
    >
      {variant === 'loading' ? (
        <ActivityIndicator color={theme.colors.primary} size="large" />
      ) : (
        <View style={[styles.icon, variant === 'error' && styles.errorIcon]}>
          <Lucide
            color={color}
            name={icon ?? (variant === 'error' ? 'circle-alert' : 'inbox')}
            size={compact ? 28 : 38}
          />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, spacing, radii, sizes, typography } = theme;
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      minHeight: 300,
      padding: spacing.xxl,
    },
    compact: { flex: 0, minHeight: 220 },
    icon: {
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.xl,
      height: 72,
      justifyContent: 'center',
      marginBottom: spacing.lg,
      width: 72,
    },
    errorIcon: { backgroundColor: colors.dangerSoft },
    title: { ...typography.title, color: colors.text, textAlign: 'center' },
    description: {
      ...typography.body,
      color: colors.textMuted,
      marginTop: spacing.sm,
      maxWidth: 320,
      textAlign: 'center',
    },
    action: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: radii.md,
      justifyContent: 'center',
      marginTop: spacing.lg,
      minHeight: sizes.minTouchTarget,
      paddingHorizontal: spacing.xl,
    },
    actionText: { ...typography.label, color: '#ffffff' },
  });
}
