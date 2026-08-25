import * as Crypto from 'expo-crypto';
import { Lucide } from '@react-native-vector-icons/lucide';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { addLocalDays } from '../domain/dateUtils';
import type { TodoDraft } from '../hooks/useTodos';
import type { Translator } from '../i18n';
import { useAppTheme, type AppTheme } from '../theme';
import type {
  Project,
  RecurrenceFrequency,
  Todo,
  TodoPriority,
} from '../types/todo';
import { DateTimeField } from './DateTimeField';

type TodoEditorModalProps = {
  visible: boolean;
  todo: Todo | null;
  projects: Project[];
  locale: 'ko' | 'en';
  t: Translator;
  onClose: () => void;
  onSave: (draft: TodoDraft) => Promise<boolean>;
};

const PRIORITIES: TodoPriority[] = ['low', 'normal', 'high'];
const RECURRENCES: (RecurrenceFrequency | 'none')[] = [
  'none',
  'daily',
  'weekly',
  'weekdays',
  'monthly',
  'custom',
];

function draftFromTodo(todo: Todo | null, projectId: string | null): TodoDraft {
  return todo
    ? {
        title: todo.title,
        notes: todo.notes,
        priority: todo.priority,
        dueAt: todo.dueAt,
        reminderAt: todo.reminderAt,
        projectId: todo.projectId,
        tags: todo.tags,
        subtasks: todo.subtasks,
        recurrence: todo.recurrence,
      }
    : {
        title: '',
        notes: '',
        priority: 'normal',
        dueAt: null,
        reminderAt: null,
        projectId,
        tags: [],
        subtasks: [],
        recurrence: null,
      };
}

export function TodoEditorModal({
  visible,
  todo,
  projects,
  locale,
  t,
  onClose,
  onSave,
}: TodoEditorModalProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [draft, setDraft] = useState<TodoDraft>(() =>
    draftFromTodo(todo, projects[0]?.id ?? null),
  );
  const [tagText, setTagText] = useState('');
  const [subtaskText, setSubtaskText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      const nextDraft = draftFromTodo(todo, projects[0]?.id ?? null);
      setDraft(nextDraft);
      setTagText(nextDraft.tags.join(', '));
      setSubtaskText('');
    }
  }, [projects, todo, visible]);

  function updateDraft(changes: Partial<TodoDraft>) {
    setDraft((current) => ({ ...current, ...changes }));
  }

  function addSubtask() {
    const title = subtaskText.trim();

    if (!title) {
      return;
    }

    updateDraft({
      subtasks: [
        ...draft.subtasks,
        { id: Crypto.randomUUID(), title, completed: false },
      ],
    });
    setSubtaskText('');
  }

  function selectRecurrence(frequency: RecurrenceFrequency | 'none') {
    if (frequency === 'none') {
      updateDraft({ recurrence: null });
      return;
    }

    updateDraft({
      recurrence: { frequency, interval: draft.recurrence?.interval ?? 1 },
      dueAt:
        draft.dueAt ??
        (() => {
          const tomorrow = addLocalDays(Date.now(), 1);
          tomorrow.setHours(9, 0, 0, 0);
          return tomorrow.getTime();
        })(),
    });
  }

  async function submit() {
    if (!draft.title.trim() || isSaving) {
      return;
    }

    setIsSaving(true);
    const tags = [
      ...new Set(
        tagText
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    ];
    const saved = await onSave({ ...draft, tags });
    setIsSaving(false);

    if (saved) {
      onClose();
    }
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={onClose}
              style={styles.headerButton}
            >
              <Lucide color={theme.colors.text} name="x" size={22} />
            </Pressable>
            <Text style={styles.headerTitle}>
              {todo ? t('editTodo') : t('newTodo')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !draft.title.trim() || isSaving }}
              disabled={!draft.title.trim() || isSaving}
              onPress={() => void submit()}
              style={[
                styles.saveHeaderButton,
                (!draft.title.trim() || isSaving) && styles.disabled,
              ]}
              testID="todo-save-button"
            >
              <Text style={styles.saveHeaderText}>{t('save')}</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.sectionLabel}>{t('title')}</Text>
            <TextInput
              accessibilityLabel={t('title')}
              autoFocus={!todo}
              maxLength={120}
              onChangeText={(title) => updateDraft({ title })}
              placeholder={t('addPlaceholder')}
              placeholderTextColor={theme.colors.textSoft}
              style={styles.titleInput}
              testID="todo-title-input"
              value={draft.title}
            />

            <Text style={styles.sectionLabel}>{t('notes')}</Text>
            <TextInput
              accessibilityLabel={t('notes')}
              maxLength={2000}
              multiline
              onChangeText={(notes) => updateDraft({ notes })}
              placeholder={
                locale === 'ko'
                  ? '필요한 내용을 자세히 적어보세요'
                  : 'Add details for this task'
              }
              placeholderTextColor={theme.colors.textSoft}
              style={styles.notesInput}
              textAlignVertical="top"
              value={draft.notes}
            />

            <Text style={styles.sectionLabel}>{t('priority')}</Text>
            <View style={styles.chipRow}>
              {PRIORITIES.map((priority) => (
                <ChoiceChip
                  key={priority}
                  active={draft.priority === priority}
                  label={t(priority)}
                  onPress={() => updateDraft({ priority })}
                  theme={theme}
                />
              ))}
            </View>

            <View style={styles.fieldGap}>
              <DateTimeField
                label={t('dueDate')}
                locale={locale}
                onChange={(dueAt) => updateDraft({ dueAt })}
                t={t}
                value={draft.dueAt}
              />
              <DateTimeField
                label={t('reminderDate')}
                locale={locale}
                onChange={(reminderAt) => updateDraft({ reminderAt })}
                t={t}
                value={draft.reminderAt}
              />
            </View>

            <Text style={styles.sectionLabel}>{t('project')}</Text>
            <ScrollView
              contentContainerStyle={styles.horizontalChips}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <ChoiceChip
                active={draft.projectId === null}
                label={t('none')}
                onPress={() => updateDraft({ projectId: null })}
                theme={theme}
              />
              {projects.map((project) => (
                <ChoiceChip
                  key={project.id}
                  active={draft.projectId === project.id}
                  color={project.color}
                  label={project.name}
                  onPress={() => updateDraft({ projectId: project.id })}
                  theme={theme}
                />
              ))}
            </ScrollView>

            <Text style={styles.sectionLabel}>{t('tags')}</Text>
            <TextInput
              accessibilityLabel={t('tags')}
              autoCapitalize="none"
              onChangeText={setTagText}
              placeholder={t('tagsHint')}
              placeholderTextColor={theme.colors.textSoft}
              style={styles.standardInput}
              value={tagText}
            />

            <Text style={styles.sectionLabel}>{t('subtasks')}</Text>
            {draft.subtasks.map((subtask) => (
              <View key={subtask.id} style={styles.subtaskRow}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: subtask.completed }}
                  hitSlop={10}
                  onPress={() =>
                    updateDraft({
                      subtasks: draft.subtasks.map((item) =>
                        item.id === subtask.id
                          ? { ...item, completed: !item.completed }
                          : item,
                      ),
                    })
                  }
                  style={[
                    styles.subtaskCheckbox,
                    subtask.completed && styles.subtaskCheckboxActive,
                  ]}
                >
                  {subtask.completed ? (
                    <Lucide color="#ffffff" name="check" size={13} />
                  ) : null}
                </Pressable>
                <TextInput
                  onChangeText={(title) =>
                    updateDraft({
                      subtasks: draft.subtasks.map((item) =>
                        item.id === subtask.id ? { ...item, title } : item,
                      ),
                    })
                  }
                  style={styles.subtaskInput}
                  value={subtask.title}
                />
                <Pressable
                  accessibilityLabel={t('delete')}
                  onPress={() =>
                    updateDraft({
                      subtasks: draft.subtasks.filter(
                        (item) => item.id !== subtask.id,
                      ),
                    })
                  }
                  style={styles.subtaskDeleteButton}
                >
                  <Lucide color={theme.colors.danger} name="x" size={17} />
                </Pressable>
              </View>
            ))}
            <View style={styles.addSubtaskRow}>
              <TextInput
                onChangeText={setSubtaskText}
                onSubmitEditing={addSubtask}
                placeholder={t('addSubtask')}
                placeholderTextColor={theme.colors.textSoft}
                returnKeyType="done"
                style={styles.subtaskAddInput}
                value={subtaskText}
              />
              <Pressable
                accessibilityLabel={t('addSubtask')}
                onPress={addSubtask}
                style={styles.addSubtaskButton}
              >
                <Lucide color="#ffffff" name="plus" size={18} />
              </Pressable>
            </View>

            <Text style={styles.sectionLabel}>{t('recurrence')}</Text>
            <View style={styles.recurrenceRow}>
              {RECURRENCES.map((frequency) => (
                <ChoiceChip
                  key={frequency}
                  active={
                    frequency === 'none'
                      ? draft.recurrence === null
                      : draft.recurrence?.frequency === frequency
                  }
                  label={t(frequency)}
                  onPress={() => selectRecurrence(frequency)}
                  theme={theme}
                />
              ))}
            </View>
            {draft.recurrence?.frequency === 'custom' ? (
              <View style={styles.customIntervalRow}>
                <Text style={styles.customIntervalLabel}>
                  {locale === 'ko' ? '반복 간격(일)' : 'Repeat every (days)'}
                </Text>
                <TextInput
                  keyboardType="number-pad"
                  onChangeText={(value) =>
                    updateDraft({
                      recurrence: {
                        frequency: 'custom',
                        interval: Math.max(1, Number.parseInt(value, 10) || 1),
                      },
                    })
                  }
                  style={styles.intervalInput}
                  value={String(draft.recurrence.interval)}
                />
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function ChoiceChip({
  active,
  label,
  color,
  onPress,
  theme,
}: {
  active: boolean;
  label: string;
  color?: string;
  onPress: () => void;
  theme: AppTheme;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        choiceStyles.chip,
        { backgroundColor: theme.colors.surfaceMuted },
        active && {
          backgroundColor: color ?? theme.colors.primary,
        },
      ]}
    >
      {color ? (
        <View style={[choiceStyles.dot, { backgroundColor: color }]} />
      ) : null}
      <Text
        style={{
          color: active ? '#ffffff' : theme.colors.textMuted,
          fontSize: 12,
          fontWeight: '700',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const choiceStyles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 13,
  },
  dot: { borderRadius: 4, height: 7, width: 7 },
});

function createStyles(theme: AppTheme) {
  const { colors } = theme;
  return StyleSheet.create({
    safeArea: { backgroundColor: colors.background, flex: 1 },
    flex: { flex: 1 },
    header: {
      alignItems: 'center',
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 58,
      paddingHorizontal: 16,
    },
    headerButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    headerTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
    saveHeaderButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 11,
      justifyContent: 'center',
      minHeight: 40,
      minWidth: 58,
      paddingHorizontal: 12,
    },
    saveHeaderText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
    disabled: { opacity: 0.4 },
    content: { padding: 20, paddingBottom: 60 },
    sectionLabel: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
      marginBottom: 8,
      marginTop: 20,
    },
    titleInput: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 15,
      borderWidth: 1,
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      minHeight: 54,
      paddingHorizontal: 14,
    },
    notesInput: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 15,
      borderWidth: 1,
      color: colors.text,
      fontSize: 14,
      minHeight: 104,
      padding: 14,
    },
    standardInput: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      color: colors.text,
      fontSize: 14,
      minHeight: 50,
      paddingHorizontal: 14,
    },
    chipRow: { flexDirection: 'row', gap: 8 },
    horizontalChips: { gap: 8, paddingRight: 20 },
    fieldGap: { gap: 9, marginTop: 20 },
    subtaskRow: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 13,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 9,
      marginBottom: 7,
      minHeight: 48,
      paddingHorizontal: 11,
    },
    subtaskCheckbox: {
      alignItems: 'center',
      borderColor: colors.textSoft,
      borderRadius: 8,
      borderWidth: 1.5,
      height: 22,
      justifyContent: 'center',
      width: 22,
    },
    subtaskCheckboxActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    subtaskInput: { color: colors.text, flex: 1, fontSize: 13, minHeight: 44 },
    subtaskDeleteButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    addSubtaskRow: { flexDirection: 'row', gap: 8 },
    subtaskAddInput: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 13,
      color: colors.text,
      flex: 1,
      minHeight: 46,
      paddingHorizontal: 13,
    },
    addSubtaskButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 13,
      height: 46,
      justifyContent: 'center',
      width: 46,
    },
    recurrenceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    customIntervalRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    customIntervalLabel: { color: colors.textMuted, fontSize: 13 },
    intervalInput: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 10,
      color: colors.text,
      minHeight: 42,
      textAlign: 'center',
      width: 70,
    },
  });
}
