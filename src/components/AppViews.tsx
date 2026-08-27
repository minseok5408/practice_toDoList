import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { formatLocalDateTime, localDateKey } from '../domain/dateUtils';
import type { Translator } from '../i18n';
import { useAppTheme, type AppTheme } from '../theme';
import type {
  AppLanguage,
  AppPreferences,
  CompletedDisplay,
  ThemeMode,
} from '../types/preferences';
import type { Project, Todo } from '../types/todo';
import { ScreenState } from './ScreenState';

export function OnboardingView({
  locale,
  onDone,
}: {
  locale: 'ko' | 'en';
  onDone: () => void;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [page, setPage] = useState(0);
  const pages =
    locale === 'ko'
      ? [
          [
            '오늘을 가볍게 정리해요',
            '할 일, 메모, 마감일과 알림을 한곳에 모아보세요.',
            'sparkles',
          ],
          [
            '버튼으로 빠르게 정리해요',
            '위·아래 버튼으로 순서를 바꾸고 휴지통 버튼으로 삭제할 수 있어요.',
            'list-ordered',
          ],
          [
            '데이터는 이 기기에 저장돼요',
            '설정에서 JSON 백업과 복원, CSV 내보내기도 지원합니다.',
            'shield-check',
          ],
        ]
      : [
          [
            'Make today feel lighter',
            'Keep tasks, notes, due dates and reminders together.',
            'sparkles',
          ],
          [
            'Organize quickly with buttons',
            'Use the up and down buttons to reorder, or the trash button to delete.',
            'list-ordered',
          ],
          [
            'Your data stays on this device',
            'Back up JSON, restore it, or export CSV in Settings.',
            'shield-check',
          ],
        ];
  const current = pages[page];

  return (
    <View style={styles.onboarding}>
      <View style={styles.heroIcon}>
        <Lucide
          color={theme.colors.primary}
          name={current[2] as LucideIconName}
          size={42}
        />
      </View>
      <Text style={styles.onboardingBrand}>MOMENT</Text>
      <Text style={styles.onboardingTitle}>{current[0]}</Text>
      <Text style={styles.onboardingBody}>{current[1]}</Text>
      <View style={styles.dots}>
        {pages.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === page && styles.dotActive]}
          />
        ))}
      </View>
      <Pressable
        onPress={() =>
          page === pages.length - 1 ? onDone() : setPage(page + 1)
        }
        style={styles.primaryButton}
        testID="onboarding-next"
      >
        <Text style={styles.primaryButtonText}>
          {page === pages.length - 1
            ? locale === 'ko'
              ? '시작하기'
              : 'Get started'
            : locale === 'ko'
            ? '다음'
            : 'Next'}
        </Text>
        <Lucide color="#ffffff" name="arrow-right" size={19} />
      </Pressable>
    </View>
  );
}

export function HistoryView({
  todos,
  locale,
  t,
}: {
  todos: Todo[];
  locale: 'ko' | 'en';
  t: Translator;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const groups = useMemo(() => {
    const values = new Map<string, Todo[]>();
    todos.forEach((todo) => {
      if (todo.completedAt === null) return;
      const key = localDateKey(todo.completedAt);
      values.set(key, [...(values.get(key) ?? []), todo]);
    });
    return [...values.entries()];
  }, [todos]);

  return (
    <ScrollView contentContainerStyle={styles.viewContent}>
      <ScreenHeading icon="history" title={t('history')} />
      {groups.length === 0 ? (
        <ScreenState
          compact
          icon="calendar-check"
          title={t('noHistory')}
          variant="empty"
        />
      ) : null}
      {groups.map(([date, group]) => (
        <View key={date} style={styles.historySection}>
          <Text style={styles.groupTitle}>
            {new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
              dateStyle: 'full',
            }).format(new Date(`${date}T12:00:00`))}
          </Text>
          {group.map((todo) => (
            <View key={todo.id} style={styles.simpleCard}>
              <Lucide
                color={theme.colors.success}
                name="circle-check"
                size={20}
              />
              <View style={styles.simpleCardBody}>
                <Text style={styles.simpleTitle}>{todo.title}</Text>
                <Text style={styles.simpleMeta}>
                  {formatLocalDateTime(todo.completedAt!, locale)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

export function ArchiveView({
  todos,
  locale,
  t,
  onRestore,
  onDelete,
}: {
  todos: Todo[];
  locale: 'ko' | 'en';
  t: Translator;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <ScrollView contentContainerStyle={styles.viewContent}>
      <ScreenHeading icon="archive" title={t('archiveBox')} />
      {todos.length === 0 ? (
        <ScreenState
          compact
          icon="archive-restore"
          title={t('noArchive')}
          variant="empty"
        />
      ) : null}
      {todos.map((todo) => (
        <View key={todo.id} style={styles.simpleCard}>
          <View style={styles.simpleCardBody}>
            <Text style={styles.simpleTitle}>{todo.title}</Text>
            <Text style={styles.simpleMeta}>
              {todo.archivedAt
                ? formatLocalDateTime(todo.archivedAt, locale)
                : ''}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={t('restore')}
            onPress={() => onRestore(todo.id)}
            style={styles.smallButton}
          >
            <Lucide
              color={theme.colors.primary}
              name="archive-restore"
              size={17}
            />
          </Pressable>
          <Pressable
            accessibilityLabel={t('permanentDelete')}
            onPress={() =>
              Alert.alert(t('permanentDelete'), todo.title, [
                { text: t('cancel'), style: 'cancel' },
                {
                  text: t('delete'),
                  style: 'destructive',
                  onPress: () => onDelete(todo.id),
                },
              ])
            }
            style={styles.smallButton}
          >
            <Lucide color={theme.colors.danger} name="trash-2" size={17} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

type SettingsProps = {
  preferences: AppPreferences;
  projects: Project[];
  tags: string[];
  locale: 'ko' | 'en';
  t: Translator;
  onPreferences: (changes: Partial<AppPreferences>) => void;
  onAddProject: (name: string) => void;
  onRenameProject: (id: string, name: string) => void;
  onDeleteProject: (id: string) => void;
  onRenameTag: (tag: string, name: string) => void;
  onDeleteTag: (tag: string) => void;
  onJsonExport: () => void;
  onJsonImport: () => void;
  onCsvExport: () => void;
  onRawExport: () => void;
  onRetry: () => void;
  onReset: () => void;
};

export function SettingsView(props: SettingsProps) {
  const { preferences, projects, tags, locale, t } = props;
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [projectName, setProjectName] = useState('');
  const [editing, setEditing] = useState<{
    kind: 'project' | 'tag';
    id: string;
    value: string;
  } | null>(null);

  function commitEdit() {
    if (!editing?.value.trim()) return;
    if (editing.kind === 'project')
      props.onRenameProject(editing.id, editing.value);
    else props.onRenameTag(editing.id, editing.value);
    setEditing(null);
  }

  return (
    <ScrollView
      contentContainerStyle={styles.viewContent}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeading icon="settings" title={t('settings')} />
      <SettingsSection title={t('language')}>
        <Segmented
          options={(['system', 'ko', 'en'] as AppLanguage[]).map((value) => ({
            value,
            label:
              value === 'ko'
                ? '한국어'
                : value === 'en'
                ? 'English'
                : t('system'),
          }))}
          value={preferences.language}
          onChange={(language) => props.onPreferences({ language })}
        />
      </SettingsSection>
      <SettingsSection title={t('theme')}>
        <Segmented
          options={(['system', 'light', 'dark'] as ThemeMode[]).map(
            (value) => ({ value, label: t(value) }),
          )}
          value={preferences.themeMode}
          onChange={(themeMode) => props.onPreferences({ themeMode })}
        />
      </SettingsSection>
      <SettingsSection title={t('completedDisplay')}>
        <Segmented
          options={(['mixed', 'bottom', 'collapsed'] as CompletedDisplay[]).map(
            (value) => ({ value, label: t(value) }),
          )}
          value={preferences.completedDisplay}
          onChange={(completedDisplay) =>
            props.onPreferences({ completedDisplay })
          }
        />
      </SettingsSection>

      <SettingsSection title={t('projects')}>
        {projects.map((project) => (
          <EditableRow
            key={project.id}
            color={project.color}
            editing={editing?.kind === 'project' && editing.id === project.id}
            label={project.name}
            value={
              editing?.kind === 'project' && editing.id === project.id
                ? editing.value
                : project.name
            }
            onChange={(value) =>
              setEditing({ kind: 'project', id: project.id, value })
            }
            onDelete={() => props.onDeleteProject(project.id)}
            onEdit={() =>
              setEditing({
                kind: 'project',
                id: project.id,
                value: project.name,
              })
            }
            onSave={commitEdit}
          />
        ))}
        <View style={styles.addRow}>
          <TextInput
            onChangeText={setProjectName}
            onSubmitEditing={() => {
              props.onAddProject(projectName);
              setProjectName('');
            }}
            placeholder={t('addProject')}
            placeholderTextColor={theme.colors.textSoft}
            style={styles.settingsInput}
            value={projectName}
          />
          <Pressable
            accessibilityLabel={t('addProject')}
            onPress={() => {
              props.onAddProject(projectName);
              setProjectName('');
            }}
            style={styles.addButton}
          >
            <Lucide color="#ffffff" name="plus" size={19} />
          </Pressable>
        </View>
      </SettingsSection>

      <SettingsSection title={t('tagManagement')}>
        {tags.length === 0 ? (
          <Text style={styles.hint}>
            {locale === 'ko' ? '등록된 태그가 없습니다.' : 'No tags yet.'}
          </Text>
        ) : null}
        {tags.map((tag) => (
          <EditableRow
            key={tag}
            editing={editing?.kind === 'tag' && editing.id === tag}
            label={`#${tag}`}
            value={
              editing?.kind === 'tag' && editing.id === tag
                ? editing.value
                : tag
            }
            onChange={(value) => setEditing({ kind: 'tag', id: tag, value })}
            onDelete={() => props.onDeleteTag(tag)}
            onEdit={() => setEditing({ kind: 'tag', id: tag, value: tag })}
            onSave={commitEdit}
          />
        ))}
      </SettingsSection>

      <SettingsSection title={t('data')}>
        <DataButton
          icon="file-down"
          label={t('jsonBackup')}
          onPress={props.onJsonExport}
        />
        <DataButton
          icon="file-up"
          label={t('jsonRestore')}
          onPress={props.onJsonImport}
        />
        <DataButton
          icon="sheet"
          label={t('csvExport')}
          onPress={props.onCsvExport}
        />
        <DataButton
          icon="refresh-cw"
          label={t('retry')}
          onPress={props.onRetry}
        />
        <DataButton
          icon="file-warning"
          label={t('exportRaw')}
          onPress={props.onRawExport}
        />
        <DataButton
          danger
          icon="trash-2"
          label={t('reset')}
          onPress={props.onReset}
        />
        <DataButton
          icon="presentation"
          label={t('replayOnboarding')}
          onPress={() => props.onPreferences({ hasOnboarded: false })}
        />
      </SettingsSection>
    </ScrollView>
  );
}

function ScreenHeading({
  icon,
  title,
}: {
  icon: LucideIconName;
  title: string;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.screenHeading}>
      <View style={styles.headingIcon}>
        <Lucide color={theme.colors.primary} name={icon} size={23} />
      </View>
      <Text style={styles.screenTitle}>{title}</Text>
    </View>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.segmented}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityState={{ selected: value === option.value }}
          onPress={() => onChange(option.value)}
          style={[
            styles.segment,
            value === option.value && styles.segmentActive,
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.segmentText,
              value === option.value && styles.segmentTextActive,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function EditableRow({
  label,
  color,
  editing,
  value,
  onChange,
  onEdit,
  onSave,
  onDelete,
}: {
  label: string;
  color?: string;
  editing: boolean;
  value: string;
  onChange: (value: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.editableRow}>
      {color ? (
        <View style={[styles.projectColor, { backgroundColor: color }]} />
      ) : null}
      {editing ? (
        <TextInput
          autoFocus
          onChangeText={onChange}
          onSubmitEditing={onSave}
          style={styles.inlineInput}
          value={value}
        />
      ) : (
        <Text style={styles.rowLabel}>{label}</Text>
      )}
      <Pressable onPress={editing ? onSave : onEdit} style={styles.smallButton}>
        <Lucide
          color={theme.colors.primary}
          name={editing ? 'check' : 'pencil'}
          size={16}
        />
      </Pressable>
      <Pressable onPress={onDelete} style={styles.smallButton}>
        <Lucide color={theme.colors.danger} name="trash-2" size={16} />
      </Pressable>
    </View>
  );
}

function DataButton({
  icon,
  label,
  danger = false,
  onPress,
}: {
  icon: LucideIconName;
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <Pressable onPress={onPress} style={styles.dataButton}>
      <Lucide
        color={danger ? theme.colors.danger : theme.colors.primary}
        name={icon}
        size={19}
      />
      <Text style={[styles.dataText, danger && { color: theme.colors.danger }]}>
        {label}
      </Text>
      <Lucide color={theme.colors.textSoft} name="chevron-right" size={17} />
    </Pressable>
  );
}

function createStyles(theme: AppTheme) {
  const c = theme.colors;
  const { radii, sizes, spacing, typography } = theme;
  return StyleSheet.create({
    onboarding: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: spacing.xxxl,
    },
    heroIcon: {
      alignItems: 'center',
      backgroundColor: c.primarySoft,
      borderRadius: 36,
      height: 92,
      justifyContent: 'center',
      marginBottom: spacing.xxl,
      width: 92,
    },
    onboardingBrand: {
      color: c.primary,
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 3,
    },
    onboardingTitle: {
      ...typography.heading,
      color: c.text,
      fontSize: 25,
      marginTop: spacing.lg,
      textAlign: 'center',
    },
    onboardingBody: {
      ...typography.body,
      color: c.textMuted,
      fontSize: 15,
      lineHeight: 23,
      marginTop: spacing.md,
      maxWidth: 320,
      textAlign: 'center',
    },
    dots: { flexDirection: 'row', gap: 7, marginVertical: 30 },
    dot: { backgroundColor: c.border, borderRadius: 4, height: 7, width: 7 },
    dotActive: { backgroundColor: c.primary, width: 22 },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: c.primary,
      borderRadius: radii.lg,
      flexDirection: 'row',
      gap: 9,
      justifyContent: 'center',
      minHeight: 54,
      paddingHorizontal: 30,
      ...theme.shadows.floating,
    },
    primaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
    viewContent: { padding: spacing.xl, paddingBottom: 35 },
    screenHeading: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 11,
      marginBottom: 23,
    },
    headingIcon: {
      alignItems: 'center',
      backgroundColor: c.primarySoft,
      borderRadius: 14,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    screenTitle: { ...typography.heading, color: c.text },
    historySection: { marginBottom: 20 },
    groupTitle: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: '800',
      marginBottom: 8,
    },
    simpleCard: {
      alignItems: 'center',
      backgroundColor: c.surface,
      borderColor: c.border,
      borderRadius: 15,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      marginBottom: 8,
      minHeight: 64,
      paddingHorizontal: 14,
    },
    simpleCardBody: { flex: 1 },
    simpleTitle: { color: c.text, fontSize: 14, fontWeight: '700' },
    simpleMeta: { color: c.textMuted, fontSize: 10, marginTop: 4 },
    smallButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    settingsSection: {
      backgroundColor: c.surface,
      borderColor: c.border,
      borderRadius: radii.lg,
      borderWidth: 1,
      marginBottom: spacing.md,
      padding: spacing.md,
    },
    sectionTitle: {
      ...typography.bodyStrong,
      color: c.text,
      marginBottom: 11,
    },
    segmented: {
      backgroundColor: c.surfaceMuted,
      borderRadius: 13,
      flexDirection: 'row',
      padding: 3,
    },
    segment: {
      alignItems: 'center',
      borderRadius: 10,
      flex: 1,
      justifyContent: 'center',
      minHeight: sizes.minTouchTarget,
      paddingHorizontal: 4,
    },
    segmentActive: { backgroundColor: c.primary },
    segmentText: { color: c.textMuted, fontSize: 11, fontWeight: '700' },
    segmentTextActive: { color: '#ffffff' },
    editableRow: {
      alignItems: 'center',
      borderBottomColor: c.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      minHeight: 52,
    },
    projectColor: { borderRadius: 5, height: 10, marginRight: 9, width: 10 },
    rowLabel: { color: c.text, flex: 1, fontSize: 13, fontWeight: '600' },
    inlineInput: { color: c.text, flex: 1, fontSize: 13, minHeight: 44 },
    addRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    settingsInput: {
      backgroundColor: c.surfaceMuted,
      borderRadius: 12,
      color: c.text,
      flex: 1,
      minHeight: 46,
      paddingHorizontal: 12,
    },
    addButton: {
      alignItems: 'center',
      backgroundColor: c.primary,
      borderRadius: 12,
      height: 46,
      justifyContent: 'center',
      width: 46,
    },
    hint: { color: c.textMuted, fontSize: 12, paddingVertical: 8 },
    dataButton: {
      alignItems: 'center',
      borderBottomColor: c.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: 11,
      minHeight: 52,
    },
    dataText: { color: c.text, flex: 1, fontSize: 13, fontWeight: '700' },
  });
}
