import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Translator } from '../i18n';
import { useAppTheme, type AppTheme } from '../theme';
import type { TodoFilter } from '../types/todo';

export function FilterTabs({
  value,
  counts,
  t,
  onChange,
}: {
  value: TodoFilter;
  counts: Record<TodoFilter, number>;
  t: Translator;
  onChange: (value: TodoFilter) => void;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const filters: TodoFilter[] = ['all', 'active', 'completed'];

  return (
    <View accessibilityRole="tablist" style={styles.container}>
      {filters.map((filter) => {
        const active = value === filter;
        return (
          <Pressable
            key={filter}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(filter)}
            style={[styles.tab, active && styles.activeTab]}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>
              {t(filter)}
            </Text>
            <View style={[styles.count, active && styles.activeCount]}>
              <Text
                style={[styles.countText, active && styles.activeCountText]}
              >
                {counts[filter]}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: 15,
      flexDirection: 'row',
      padding: 4,
    },
    tab: {
      alignItems: 'center',
      borderRadius: 12,
      flex: 1,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      minHeight: 44,
    },
    activeTab: { backgroundColor: theme.colors.surface, ...theme.shadows.card },
    label: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '700' },
    activeLabel: { color: theme.colors.text },
    count: {
      alignItems: 'center',
      backgroundColor: theme.colors.border,
      borderRadius: 8,
      justifyContent: 'center',
      minHeight: 19,
      minWidth: 19,
      paddingHorizontal: 5,
    },
    activeCount: { backgroundColor: theme.colors.primarySoft },
    countText: {
      color: theme.colors.textMuted,
      fontSize: 9,
      fontWeight: '800',
    },
    activeCountText: { color: theme.colors.primary },
  });
}
