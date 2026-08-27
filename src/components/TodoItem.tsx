import { Lucide } from '@react-native-vector-icons/lucide';
import { memo, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatLocalDateTime, isOverdue } from '../domain/dateUtils';
import type { Translator } from '../i18n';
import { useAppTheme, type AppTheme } from '../theme';
import type { Project, Todo } from '../types/todo';

type TodoItemProps = {
  todo: Todo;
  project?: Project;
  locale: 'ko' | 'en';
  t: Translator;
  selected?: boolean;
  selectionMode?: boolean;
  dragEnabled?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onToggle: (id: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onSelect: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

const PRIORITY_ICONS = {
  high: 'chevrons-up',
  normal: 'minus',
  low: 'chevrons-down',
} as const;

function TodoItemComponent({
  todo,
  project,
  locale,
  t,
  selected = false,
  selectionMode = false,
  dragEnabled = false,
  canMoveUp = false,
  canMoveDown = false,
  onToggle,
  onToggleSubtask,
  onEdit,
  onDelete,
  onArchive,
  onSelect,
  onMoveUp,
  onMoveDown,
}: TodoItemProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const longPressed = useRef(false);
  const completedSubtasks = todo.subtasks.filter(
    (subtask) => subtask.completed,
  ).length;
  const dueLabel =
    todo.dueAt === null ? null : formatLocalDateTime(todo.dueAt, locale);
  const overdue = !todo.completed && isOverdue(todo.dueAt);

  return (
    <View
      style={[
        styles.card,
        todo.completed && styles.completedCard,
        selected && styles.selectedCard,
      ]}
    >
      <Pressable
        accessibilityLabel={
          selectionMode
            ? selected
              ? locale === 'ko'
                ? '선택 해제'
                : 'Deselect'
              : t('select')
            : todo.completed
            ? locale === 'ko'
              ? '완료 취소'
              : 'Mark active'
            : locale === 'ko'
            ? '완료로 표시'
            : 'Mark complete'
        }
        accessibilityRole="checkbox"
        accessibilityState={{
          checked: selectionMode ? selected : todo.completed,
        }}
        hitSlop={8}
        onPress={() => (selectionMode ? onSelect(todo.id) : onToggle(todo.id))}
        style={[
          styles.checkbox,
          (selectionMode ? selected : todo.completed) && styles.checkedCheckbox,
        ]}
      >
        {(selectionMode ? selected : todo.completed) ? (
          <Lucide color="#ffffff" name="check" size={17} />
        ) : null}
      </Pressable>

      <Pressable
        accessibilityLabel={`${todo.title}, ${t(todo.priority)}, ${
          todo.completed ? t('completed') : t('active')
        }${dueLabel ? `, ${t('dueDate')} ${dueLabel}` : ''}`}
        accessibilityRole="button"
        delayLongPress={300}
        onLongPress={() => {
          longPressed.current = true;
          onSelect(todo.id);
        }}
        onPress={() => {
          if (longPressed.current) {
            longPressed.current = false;
            return;
          }
          if (selectionMode) onSelect(todo.id);
          else onEdit(todo);
        }}
        style={styles.body}
      >
        <View style={styles.titleRow}>
          <Text
            maxFontSizeMultiplier={1.8}
            numberOfLines={3}
            style={[styles.title, todo.completed && styles.completedText]}
          >
            {todo.title}
          </Text>
          <View style={[styles.priority, styles[`${todo.priority}Priority`]]}>
            <Lucide
              color={
                todo.priority === 'high'
                  ? theme.colors.danger
                  : todo.priority === 'low'
                  ? theme.colors.success
                  : theme.colors.textMuted
              }
              name={PRIORITY_ICONS[todo.priority]}
              size={13}
            />
            <Text style={styles.priorityText}>{t(todo.priority)}</Text>
          </View>
        </View>

        {todo.notes ? (
          <Text numberOfLines={2} style={styles.notes}>
            {todo.notes}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          {dueLabel ? (
            <View style={[styles.metaChip, overdue && styles.overdueChip]}>
              <Lucide
                color={overdue ? theme.colors.danger : theme.colors.textMuted}
                name="calendar-clock"
                size={13}
              />
              <Text style={[styles.metaText, overdue && styles.overdueText]}>
                {dueLabel}
              </Text>
            </View>
          ) : null}
          {project ? (
            <View style={styles.metaChip}>
              <View
                style={[styles.projectDot, { backgroundColor: project.color }]}
              />
              <Text style={styles.metaText}>{project.name}</Text>
            </View>
          ) : null}
          {todo.recurrence ? (
            <View style={styles.metaChip}>
              <Lucide
                color={theme.colors.textMuted}
                name="repeat-2"
                size={13}
              />
              <Text style={styles.metaText}>
                {t(todo.recurrence.frequency)}
              </Text>
            </View>
          ) : null}
        </View>

        {todo.tags.length ? (
          <View style={styles.tagRow}>
            {todo.tags.slice(0, 4).map((tag) => (
              <Text key={tag} style={styles.tag}>
                #{tag}
              </Text>
            ))}
          </View>
        ) : null}

        {todo.subtasks.length ? (
          <View style={styles.subtasksBlock}>
            <Text style={styles.progressText}>
              {completedSubtasks}/{todo.subtasks.length} {t('subtasks')}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      (completedSubtasks / todo.subtasks.length) * 100
                    }%`,
                  },
                ]}
              />
            </View>
            {todo.subtasks.map((subtask) => (
              <Pressable
                key={subtask.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: subtask.completed }}
                onPress={() => onToggleSubtask(todo.id, subtask.id)}
                style={styles.subtaskRow}
              >
                <Lucide
                  color={
                    subtask.completed
                      ? theme.colors.success
                      : theme.colors.textSoft
                  }
                  name={subtask.completed ? 'circle-check' : 'circle'}
                  size={16}
                />
                <Text
                  style={[
                    styles.subtaskText,
                    subtask.completed && styles.completedText,
                  ]}
                >
                  {subtask.title}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </Pressable>

      <View style={styles.actions}>
        {dragEnabled ? (
          <>
            <Pressable
              accessibilityLabel={locale === 'ko' ? '위로 이동' : 'Move up'}
              disabled={!canMoveUp}
              hitSlop={4}
              onPress={onMoveUp}
              style={[
                styles.reorderButton,
                !canMoveUp && styles.disabledButton,
              ]}
            >
              <Lucide
                color={theme.colors.textMuted}
                name="chevron-up"
                size={17}
              />
            </Pressable>
            <Pressable
              accessibilityLabel={locale === 'ko' ? '아래로 이동' : 'Move down'}
              disabled={!canMoveDown}
              hitSlop={4}
              onPress={onMoveDown}
              style={[
                styles.reorderButton,
                !canMoveDown && styles.disabledButton,
              ]}
            >
              <Lucide
                color={theme.colors.textMuted}
                name="chevron-down"
                size={17}
              />
            </Pressable>
          </>
        ) : null}
        <Pressable
          accessibilityLabel={t('archive')}
          hitSlop={4}
          onPress={() => onArchive(todo.id)}
          style={styles.iconButton}
        >
          <Lucide color={theme.colors.textMuted} name="archive" size={18} />
        </Pressable>
        <Pressable
          accessibilityLabel={t('delete')}
          hitSlop={4}
          onPress={() => onDelete(todo.id)}
          style={styles.iconButton}
        >
          <Lucide color={theme.colors.danger} name="trash-2" size={17} />
        </Pressable>
      </View>
    </View>
  );
}

export const TodoItem = memo(TodoItemComponent);

function createStyles(theme: AppTheme) {
  const { colors } = theme;
  return StyleSheet.create({
    card: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      minHeight: 68,
      paddingHorizontal: 12,
      paddingVertical: 11,
      marginBottom: 8,
      ...theme.shadows.card,
    },
    completedCard: { backgroundColor: colors.surfaceMuted, opacity: 0.8 },
    selectedCard: { borderColor: colors.primary, borderWidth: 2 },
    checkbox: {
      alignItems: 'center',
      borderColor: colors.textSoft,
      borderRadius: 12,
      borderWidth: 1.7,
      height: 28,
      justifyContent: 'center',
      marginRight: 11,
      width: 28,
    },
    checkedCheckbox: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    body: { flex: 1, minWidth: 0 },
    titleRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 8 },
    title: {
      color: colors.text,
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      lineHeight: 21,
    },
    completedText: {
      color: colors.textSoft,
      textDecorationLine: 'line-through',
    },
    priority: {
      alignItems: 'center',
      borderRadius: 9,
      flexDirection: 'row',
      gap: 3,
      minHeight: 25,
      paddingHorizontal: 7,
    },
    highPriority: { backgroundColor: colors.dangerSoft },
    normalPriority: { backgroundColor: colors.surfaceMuted },
    lowPriority: { backgroundColor: colors.successSoft },
    priorityText: { color: colors.textMuted, fontSize: 10, fontWeight: '800' },
    notes: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 5,
    },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 },
    metaChip: {
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderRadius: 8,
      flexDirection: 'row',
      gap: 4,
      minHeight: 24,
      paddingHorizontal: 7,
    },
    overdueChip: { backgroundColor: colors.dangerSoft },
    metaText: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
    overdueText: { color: colors.danger },
    projectDot: {
      borderColor: colors.surface,
      borderRadius: 5,
      borderWidth: 1,
      height: 10,
      width: 10,
    },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 },
    tag: { color: colors.primary, fontSize: 10, fontWeight: '700' },
    subtasksBlock: { marginTop: 10 },
    progressText: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
    progressTrack: {
      backgroundColor: colors.border,
      borderRadius: 3,
      height: 4,
      marginBottom: 7,
      marginTop: 4,
      overflow: 'hidden',
    },
    progressFill: {
      backgroundColor: colors.success,
      borderRadius: 3,
      height: 4,
    },
    subtaskRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 7,
      minHeight: 44,
    },
    subtaskText: { color: colors.textMuted, flex: 1, fontSize: 11 },
    actions: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: colors.surfaceMuted,
      borderRadius: 12,
      flexDirection: 'row',
      marginLeft: 6,
    },
    iconButton: {
      alignItems: 'center',
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    reorderButton: {
      alignItems: 'center',
      height: 30,
      justifyContent: 'center',
      width: 30,
    },
    disabledButton: { opacity: 0.28 },
  });
}
