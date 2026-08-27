import { Lucide } from '@react-native-vector-icons/lucide';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTodoAppContext } from '../context/TodoAppContext';
import { useAppTheme, type AppTheme } from '../theme';

type DayStats = {
  total: number;
  completed: number;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayKey(date: Date | number) {
  const value = typeof date === 'number' ? new Date(date) : date;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildMonthGrid(month: Date, today: Date) {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(
    month.getFullYear(),
    month.getMonth(),
    1 - firstOfMonth.getDay(),
  );

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index,
    );
    return {
      date,
      key: dayKey(date),
      inMonth:
        date.getFullYear() === month.getFullYear() &&
        date.getMonth() === month.getMonth(),
      isToday: dayKey(date) === dayKey(today),
    };
  });
}

export function getWeekdayLabels(locale: 'ko' | 'en') {
  return locale === 'ko'
    ? ['일', '월', '화', '수', '목', '금', '토']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
}

export function CalendarScreen() {
  const { app, displayedProjects, locale, t } = useTodoAppContext();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const today = useMemo(() => startOfDay(new Date()), []);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDay, setSelectedDay] = useState(today);
  const calendarDays = useMemo(
    () => buildMonthGrid(visibleMonth, today),
    [today, visibleMonth],
  );
  const scheduledTodos = useMemo(
    () =>
      app.todos.filter(
        (todo) => todo.archivedAt === null && todo.dueAt !== null,
      ),
    [app.todos],
  );
  const statsByDay = useMemo(() => {
    const stats = new Map<string, DayStats>();
    scheduledTodos.forEach((todo) => {
      const key = dayKey(todo.dueAt!);
      const current = stats.get(key) ?? { total: 0, completed: 0 };
      current.total += 1;
      if (todo.completed) current.completed += 1;
      stats.set(key, current);
    });
    return stats;
  }, [scheduledTodos]);
  const monthTodos = useMemo(
    () =>
      scheduledTodos.filter((todo) => {
        const due = new Date(todo.dueAt!);
        return (
          due.getFullYear() === visibleMonth.getFullYear() &&
          due.getMonth() === visibleMonth.getMonth()
        );
      }),
    [scheduledTodos, visibleMonth],
  );
  const selectedTodos = useMemo(
    () =>
      scheduledTodos
        .filter((todo) => dayKey(todo.dueAt!) === dayKey(selectedDay))
        .sort((a, b) => a.dueAt! - b.dueAt!),
    [scheduledTodos, selectedDay],
  );
  const projectsById = useMemo(
    () => new Map(displayedProjects.map((project) => [project.id, project])),
    [displayedProjects],
  );
  const weekdays = getWeekdayLabels(locale);

  function changeMonth(offset: number) {
    const nextMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + offset,
      1,
    );
    const lastDay = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth() + 1,
      0,
    ).getDate();
    setVisibleMonth(nextMonth);
    setSelectedDay(
      new Date(
        nextMonth.getFullYear(),
        nextMonth.getMonth(),
        Math.min(selectedDay.getDate(), lastDay),
      ),
    );
  }

  function selectDate(date: Date) {
    setSelectedDay(date);
    if (
      date.getFullYear() !== visibleMonth.getFullYear() ||
      date.getMonth() !== visibleMonth.getMonth()
    ) {
      setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }

  function returnToToday() {
    setSelectedDay(today);
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  const monthLabel = new Intl.DateTimeFormat(
    locale === 'ko' ? 'ko-KR' : 'en-US',
    { month: 'long', year: 'numeric' },
  ).format(visibleMonth);
  const selectedDateLabel = new Intl.DateTimeFormat(
    locale === 'ko' ? 'ko-KR' : 'en-US',
    { day: 'numeric', month: 'long', weekday: 'long' },
  ).format(selectedDay);
  const completedThisMonth = monthTodos.filter((todo) => todo.completed).length;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <View style={styles.headingRow}>
        <View style={styles.headingIcon}>
          <Lucide color={theme.colors.primary} name="calendar-days" size={22} />
        </View>
        <View style={styles.headingCopy}>
          <Text style={styles.title}>{t('calendar')}</Text>
          <Text style={styles.subtitle}>
            {t('scheduledThisMonth')} ·{' '}
            {t('taskCount', { count: monthTodos.length })}
          </Text>
        </View>
        {monthTodos.length ? (
          <View style={styles.monthProgress}>
            <Text style={styles.monthProgressText}>
              {completedThisMonth}/{monthTodos.length}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.monthNavigation}>
          <Pressable
            accessibilityLabel={locale === 'ko' ? '이전 달' : 'Previous month'}
            onPress={() => changeMonth(-1)}
            style={styles.navigationButton}
          >
            <Lucide
              color={theme.colors.textMuted}
              name="chevron-left"
              size={20}
            />
          </Pressable>
          <View style={styles.monthCopy}>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <Pressable onPress={returnToToday} style={styles.todayButton}>
              <Text style={styles.todayButtonText}>{t('today')}</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityLabel={locale === 'ko' ? '다음 달' : 'Next month'}
            onPress={() => changeMonth(1)}
            style={styles.navigationButton}
          >
            <Lucide
              color={theme.colors.textMuted}
              name="chevron-right"
              size={20}
            />
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {weekdays.map((weekday, index) => (
            <Text
              key={weekday}
              style={[
                styles.weekday,
                index === 0 && styles.sunday,
                index === 6 && styles.saturday,
              ]}
            >
              {weekday}
            </Text>
          ))}
        </View>

        <View style={styles.dayGrid}>
          {calendarDays.map((day) => {
            const selected = day.key === dayKey(selectedDay);
            const stats = statsByDay.get(day.key);
            return (
              <View key={day.key} style={styles.daySlot}>
                <Pressable
                  accessibilityLabel={`${day.date.getDate()}, ${
                    stats?.total ?? 0
                  } ${locale === 'ko' ? '개의 할 일' : 'tasks'}`}
                  accessibilityState={{ selected }}
                  onPress={() => selectDate(day.date)}
                  style={[
                    styles.dayCell,
                    day.isToday && styles.todayCell,
                    selected && styles.selectedDayCell,
                    !day.inMonth && styles.outsideDayCell,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      day.date.getDay() === 0 && styles.sunday,
                      day.date.getDay() === 6 && styles.saturday,
                      !day.inMonth && styles.outsideDayText,
                      selected && styles.selectedDayText,
                    ]}
                  >
                    {day.date.getDate()}
                  </Text>
                  {stats?.total ? (
                    <View
                      style={[
                        styles.dayCount,
                        selected && styles.selectedDayCount,
                        stats.completed === stats.total && styles.doneDayCount,
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.dayCountText,
                          selected && styles.selectedDayText,
                        ]}
                      >
                        {locale === 'ko' ? `${stats.total}개` : stats.total}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.selectedHeader}>
        <View>
          <Text style={styles.selectedEyebrow}>{selectedDateLabel}</Text>
          <Text style={styles.selectedTitle}>
            {locale === 'ko' ? '선택한 날짜의 할 일' : 'Tasks for this date'}
          </Text>
        </View>
        <View style={styles.selectedCount}>
          <Text style={styles.selectedCountText}>{selectedTodos.length}</Text>
        </View>
      </View>

      {selectedTodos.length ? (
        selectedTodos.map((todo) => {
          const project = todo.projectId
            ? projectsById.get(todo.projectId)
            : undefined;
          const time = new Intl.DateTimeFormat(
            locale === 'ko' ? 'ko-KR' : 'en-US',
            { hour: 'numeric', minute: '2-digit' },
          ).format(todo.dueAt!);
          return (
            <View key={todo.id} style={styles.taskCard}>
              <Pressable
                accessibilityLabel={
                  todo.completed
                    ? locale === 'ko'
                      ? '완료 취소'
                      : 'Mark active'
                    : locale === 'ko'
                    ? '완료로 표시'
                    : 'Mark complete'
                }
                accessibilityRole="checkbox"
                accessibilityState={{ checked: todo.completed }}
                hitSlop={7}
                onPress={() => void app.toggleTodo(todo.id)}
                style={[
                  styles.taskCheckbox,
                  todo.completed && styles.taskCheckboxDone,
                ]}
              >
                {todo.completed ? (
                  <Lucide color="#ffffff" name="check" size={15} />
                ) : null}
              </Pressable>
              <View style={styles.taskBody}>
                <Text
                  numberOfLines={2}
                  style={[
                    styles.taskTitle,
                    todo.completed && styles.taskTitleDone,
                  ]}
                >
                  {todo.title}
                </Text>
                <View style={styles.taskMeta}>
                  <Lucide
                    color={theme.colors.textSoft}
                    name="clock-3"
                    size={12}
                  />
                  <Text style={styles.taskMetaText}>{time}</Text>
                  {project ? (
                    <>
                      <View
                        style={[
                          styles.projectDot,
                          { backgroundColor: project.color },
                        ]}
                      />
                      <Text style={styles.taskMetaText}>{project.name}</Text>
                    </>
                  ) : null}
                </View>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Lucide
              color={theme.colors.textSoft}
              name="calendar-x-2"
              size={20}
            />
          </View>
          <Text style={styles.emptyText}>{t('noTasksForDate')}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing, typography } = theme;
  return StyleSheet.create({
    screen: { backgroundColor: colors.background, flex: 1 },
    content: {
      paddingBottom: spacing.xxxl,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    headingRow: {
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: spacing.lg,
    },
    headingIcon: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: radii.md,
      height: 44,
      justifyContent: 'center',
      marginRight: spacing.md,
      width: 44,
    },
    headingCopy: { flex: 1 },
    title: { ...typography.heading, color: colors.text, fontSize: 22 },
    subtitle: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: spacing.xxs,
    },
    monthProgress: {
      alignItems: 'center',
      backgroundColor: colors.successSoft,
      borderRadius: radii.pill,
      justifyContent: 'center',
      minHeight: 32,
      paddingHorizontal: spacing.md,
    },
    monthProgressText: {
      ...typography.label,
      color: colors.success,
      fontSize: 11,
    },
    calendarCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.xl,
      borderWidth: 1,
      padding: spacing.md,
      ...theme.shadows.card,
    },
    monthNavigation: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    navigationButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.md,
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    monthCopy: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
    monthLabel: { ...typography.title, color: colors.text, fontSize: 16 },
    todayButton: {
      backgroundColor: colors.primarySoft,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    todayButtonText: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '800',
    },
    weekRow: { flexDirection: 'row', marginBottom: spacing.xs },
    weekday: {
      ...typography.caption,
      color: colors.textMuted,
      flex: 1,
      textAlign: 'center',
    },
    sunday: { color: colors.danger },
    saturday: { color: colors.primary },
    dayGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    daySlot: { padding: 2, width: '14.285714%' },
    dayCell: {
      alignItems: 'center',
      borderColor: 'transparent',
      borderRadius: radii.md,
      borderWidth: 1,
      minHeight: 58,
      paddingBottom: 5,
      paddingTop: 7,
    },
    todayCell: { borderColor: colors.primary },
    selectedDayCell: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    outsideDayCell: { opacity: 0.42 },
    dayNumber: {
      ...typography.bodyStrong,
      color: colors.text,
      fontSize: 12,
      lineHeight: 18,
    },
    outsideDayText: { color: colors.textSoft },
    selectedDayText: { color: '#ffffff' },
    dayCount: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: radii.pill,
      justifyContent: 'center',
      marginTop: 3,
      maxWidth: '92%',
      minHeight: 17,
      minWidth: 24,
      paddingHorizontal: 4,
    },
    selectedDayCount: { backgroundColor: 'rgba(255,255,255,0.2)' },
    doneDayCount: { borderColor: colors.success, borderWidth: 1 },
    dayCountText: {
      color: colors.primary,
      fontSize: 8,
      fontWeight: '900',
    },
    selectedHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: spacing.md,
      paddingTop: spacing.xxl,
    },
    selectedEyebrow: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '800',
    },
    selectedTitle: {
      ...typography.title,
      color: colors.text,
      fontSize: 16,
      marginTop: spacing.xxs,
    },
    selectedCount: {
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.pill,
      height: 30,
      justifyContent: 'center',
      minWidth: 30,
      paddingHorizontal: spacing.sm,
    },
    selectedCountText: {
      ...typography.label,
      color: colors.textMuted,
      fontWeight: '900',
    },
    taskCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.lg,
      borderWidth: 1,
      flexDirection: 'row',
      marginBottom: spacing.sm,
      minHeight: 66,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    taskCheckbox: {
      alignItems: 'center',
      borderColor: colors.textSoft,
      borderRadius: 10,
      borderWidth: 1.5,
      height: 26,
      justifyContent: 'center',
      marginRight: spacing.md,
      width: 26,
    },
    taskCheckboxDone: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    taskBody: { flex: 1 },
    taskTitle: { ...typography.bodyStrong, color: colors.text },
    taskTitleDone: {
      color: colors.textSoft,
      textDecorationLine: 'line-through',
    },
    taskMeta: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    taskMetaText: { ...typography.caption, color: colors.textMuted },
    projectDot: { borderRadius: 5, height: 9, marginLeft: 4, width: 9 },
    emptyCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.lg,
      borderStyle: 'dashed',
      borderWidth: 1,
      flexDirection: 'row',
      minHeight: 72,
      paddingHorizontal: spacing.lg,
    },
    emptyIcon: {
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.md,
      height: 40,
      justifyContent: 'center',
      marginRight: spacing.md,
      width: 40,
    },
    emptyText: { ...typography.body, color: colors.textMuted, flex: 1 },
  });
}
