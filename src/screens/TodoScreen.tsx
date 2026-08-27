import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  LayoutAnimation,
  type ListRenderItemInfo,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenState } from '../components/ScreenState';
import { StorageRecoveryState } from '../components/StorageRecoveryState';
import { FilterTabs } from '../components/FilterTabs';
import { TodoEditorModal } from '../components/TodoEditorModal';
import { TodoItem } from '../components/TodoItem';
import { SMART_VIEWS, TODO_SORTS } from '../constants/todoUi';
import { useTodoAppContext } from '../context/TodoAppContext';
import {
  canUseManualDrag,
  selectTodos,
  type TodoQuery,
} from '../domain/todoSelectors';
import { useAppTheme, type AppTheme } from '../theme';
import type { SmartView, Todo } from '../types/todo';

export function TodoScreen() {
  const {
    app,
    displayedProjects,
    locale,
    preferences,
    t,
    tags,
    updatePreferences,
  } = useTodoAppContext();
  const { archiveTodos, deleteTodos, reorderTodos, toggleSubtask, toggleTodo } =
    app;
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [search, setSearch] = useState('');
  const [editorTodo, setEditorTodo] = useState<Todo | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moveVisible, setMoveVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);

  const query: TodoQuery = useMemo(
    () => ({
      statusFilter: preferences.statusFilter,
      smartView: preferences.smartView,
      sort: preferences.sort,
      projectId: preferences.selectedProjectId,
      tag: preferences.selectedTag,
      search,
      completedDisplay: preferences.completedDisplay,
    }),
    [preferences, search],
  );
  const visibleTodos = useMemo(
    () => selectTodos(app.todos, query),
    [app.todos, query],
  );
  const activeTodos = useMemo(
    () => app.todos.filter((todo) => todo.archivedAt === null),
    [app.todos],
  );
  const counts = useMemo(
    () => ({
      all: activeTodos.length,
      active: activeTodos.filter((todo) => !todo.completed).length,
      completed: activeTodos.filter((todo) => todo.completed).length,
    }),
    [activeTodos],
  );
  const smartCounts = useMemo(
    () =>
      Object.fromEntries(
        SMART_VIEWS.map(({ value }) => [
          value,
          selectTodos(app.todos, {
            statusFilter: 'all',
            smartView: value,
            sort: 'manual',
            projectId: 'all',
            tag: null,
            search: '',
            completedDisplay: 'mixed',
          }).length,
        ]),
      ) as Record<SmartView, number>,
    [app.todos],
  );
  const dragEnabled = canUseManualDrag(query);
  const projectById = useMemo(
    () => new Map(displayedProjects.map((project) => [project.id, project])),
    [displayedProjects],
  );

  const handleEditTodo = useCallback((todo: Todo) => {
    setEditorTodo(todo);
    setEditorVisible(true);
  }, []);
  const handleArchiveTodo = useCallback(
    (id: string) => void archiveTodos([id]),
    [archiveTodos],
  );
  const handleDeleteTodo = useCallback(
    (id: string) => void deleteTodos([id]),
    [deleteTodos],
  );
  const handleToggleTodo = useCallback(
    (id: string) => void toggleTodo(id),
    [toggleTodo],
  );

  function animatePreferences(
    changes: Parameters<typeof updatePreferences>[0],
  ) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    updatePreferences(changes);
  }

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function closeSelection() {
    setSelectedIds(new Set());
    setMoveVisible(false);
  }

  const moveTodo = useCallback(
    (index: number, offset: -1 | 1) => {
      const destination = index + offset;
      if (destination < 0 || destination >= visibleTodos.length) return;

      const reordered = [...visibleTodos];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(destination, 0, moved);
      void reorderTodos(reordered.map((todo) => todo.id));
    },
    [reorderTodos, visibleTodos],
  );

  const renderTodoItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Todo>) => (
      <TodoItem
        canMoveDown={dragEnabled && index < visibleTodos.length - 1}
        canMoveUp={dragEnabled && index > 0}
        dragEnabled={dragEnabled}
        locale={locale}
        onArchive={handleArchiveTodo}
        onDelete={handleDeleteTodo}
        onEdit={handleEditTodo}
        onMoveDown={() => moveTodo(index, 1)}
        onMoveUp={() => moveTodo(index, -1)}
        onSelect={toggleSelection}
        onToggle={handleToggleTodo}
        onToggleSubtask={toggleSubtask}
        project={item.projectId ? projectById.get(item.projectId) : undefined}
        selected={selectedIds.has(item.id)}
        selectionMode={selectedIds.size > 0}
        t={t}
        todo={item}
      />
    ),
    [
      dragEnabled,
      handleArchiveTodo,
      handleDeleteTodo,
      handleEditTodo,
      handleToggleTodo,
      locale,
      moveTodo,
      projectById,
      selectedIds,
      t,
      toggleSubtask,
      toggleSelection,
      visibleTodos.length,
    ],
  );

  if (!app.isReady && app.storageError?.kind === 'load') {
    return (
      <StorageRecoveryState
        message={app.storageError.message}
        onBackup={() => void app.exportStorageBackup()}
        onReset={() =>
          Alert.alert(
            t('reset'),
            locale === 'ko'
              ? '원본을 먼저 내보내는 것을 권장합니다. 초기화하면 복구할 수 없습니다.'
              : 'Export the raw data first. Reset data cannot be recovered.',
            [
              { text: t('cancel'), style: 'cancel' },
              {
                text: t('exportRaw'),
                onPress: () => void app.exportStorageBackup(),
              },
              {
                text: t('reset'),
                style: 'destructive',
                onPress: () => void app.resetStorage(),
              },
            ],
          )
        }
        onRetry={() => void app.retryStorage()}
        t={t}
      />
    );
  }

  const listHeader = (
    <View>
      <View style={styles.brandRow}>
        <View>
          <Text style={styles.brand}>{t('appName')}</Text>
          <Text style={styles.dateLabel}>
            {new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            }).format(new Date())}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={t('newTodo')}
          onPress={() => {
            setEditorTodo(null);
            setEditorVisible(true);
          }}
          style={styles.topAddButton}
        >
          <Lucide color="#ffffff" name="plus" size={22} />
        </Pressable>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>{t('todayTitle')}</Text>
          <Text style={styles.heroTitle}>
            {counts.active === 0
              ? t('allDone')
              : t('remainingCount', { count: counts.active })}
          </Text>
          <Text style={styles.heroBody}>{t('startSmall')}</Text>
        </View>
        <View style={styles.progressCircle}>
          <Text style={styles.progressNumber}>
            {counts.all ? Math.round((counts.completed / counts.all) * 100) : 0}
            %
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.smartRow}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {SMART_VIEWS.map((view) => {
          const active = preferences.smartView === view.value;
          return (
            <Pressable
              key={view.value}
              accessibilityState={{ selected: active }}
              onPress={() => animatePreferences({ smartView: view.value })}
              style={[styles.smartChip, active && styles.smartChipActive]}
            >
              <Lucide
                color={active ? '#ffffff' : theme.colors.textMuted}
                name={view.icon}
                size={15}
              />
              <Text style={[styles.smartText, active && styles.activeText]}>
                {t(view.value)}
              </Text>
              <Text style={[styles.smartCount, active && styles.activeText]}>
                {smartCounts[view.value]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.searchBox}>
        <Lucide color={theme.colors.textSoft} name="search" size={18} />
        <TextInput
          onChangeText={setSearch}
          placeholder={t('search')}
          placeholderTextColor={theme.colors.textSoft}
          style={styles.searchInput}
          value={search}
        />
        {search ? (
          <Pressable
            accessibilityLabel={t('clear')}
            onPress={() => setSearch('')}
            style={styles.clearSearch}
          >
            <Lucide color={theme.colors.textSoft} name="x" size={16} />
          </Pressable>
        ) : null}
      </View>

      <FilterTabs
        counts={counts}
        onChange={(statusFilter) => animatePreferences({ statusFilter })}
        t={t}
        value={preferences.statusFilter}
      />

      <View style={styles.projectToolbar}>
        <Text style={styles.projectLabel}>{t('project')}</Text>
        <Pressable
          accessibilityLabel={t('sort')}
          hitSlop={{ top: 5, bottom: 5 }}
          onPress={() => setSortVisible(true)}
          style={styles.sortButton}
        >
          <Lucide
            color={theme.colors.textMuted}
            name="arrow-up-down"
            size={14}
          />
          <Text style={styles.sortButtonText}>
            {t(
              preferences.sort === 'completed'
                ? 'completedSort'
                : preferences.sort,
            )}
          </Text>
          <Lucide color={theme.colors.textSoft} name="chevron-down" size={13} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.filterRow}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <FilterChip
          active={preferences.selectedProjectId === 'all'}
          label={t('all')}
          onPress={() => animatePreferences({ selectedProjectId: 'all' })}
        />
        {displayedProjects.map((project) => (
          <FilterChip
            key={project.id}
            active={preferences.selectedProjectId === project.id}
            color={project.color}
            label={`${project.name} ${
              app.todos.filter(
                (todo) =>
                  todo.projectId === project.id &&
                  !todo.completed &&
                  todo.archivedAt === null,
              ).length
            }`}
            onPress={() =>
              animatePreferences({ selectedProjectId: project.id })
            }
          />
        ))}
      </ScrollView>

      {tags.length ? (
        <ScrollView
          contentContainerStyle={styles.tagFilterRow}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <FilterChip
            active={preferences.selectedTag === null}
            label="#ALL"
            onPress={() => animatePreferences({ selectedTag: null })}
          />
          {tags.map((tag) => (
            <FilterChip
              key={tag}
              active={preferences.selectedTag === tag}
              label={`#${tag}`}
              onPress={() => animatePreferences({ selectedTag: tag })}
            />
          ))}
        </ScrollView>
      ) : null}
      {!dragEnabled && preferences.sort === 'manual' ? (
        <Text style={styles.dragHint}>{t('dragUnavailable')}</Text>
      ) : null}
      <View style={styles.listSectionHeader}>
        <Text style={styles.listSectionTitle}>{t('tasks')}</Text>
        <View style={styles.listCountBadge}>
          <Text style={styles.listCountText}>{visibleTodos.length}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <Pressable onPress={Keyboard.dismiss} style={styles.screen}>
      <FlatList
        ListEmptyComponent={
          <ScreenState compact title={t('noTodos')} variant="empty" />
        }
        ListFooterComponent={
          counts.completed ? (
            <Pressable
              onPress={() => void app.clearCompleted()}
              style={styles.clearCompleted}
            >
              <Lucide color={theme.colors.danger} name="trash-2" size={16} />
              <Text style={styles.clearCompletedText}>
                {locale === 'ko'
                  ? '완료 항목 일괄 삭제'
                  : 'Delete completed tasks'}
              </Text>
            </Pressable>
          ) : null
        }
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        data={visibleTodos}
        initialNumToRender={12}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={(todo) => todo.id}
        maxToRenderPerBatch={12}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={renderTodoItem}
        showsVerticalScrollIndicator={false}
        updateCellsBatchingPeriod={50}
        windowSize={7}
      />

      {selectedIds.size ? (
        <BulkActionBar
          count={selectedIds.size}
          onArchive={() => {
            void app.archiveTodos([...selectedIds]);
            closeSelection();
          }}
          onClose={closeSelection}
          onComplete={() => {
            void app.completeTodos([...selectedIds]);
            closeSelection();
          }}
          onDelete={() => {
            void app.deleteTodos([...selectedIds]);
            closeSelection();
          }}
          onMove={() => setMoveVisible(true)}
          t={t}
        />
      ) : null}

      <TodoEditorModal
        locale={locale}
        onClose={() => setEditorVisible(false)}
        onSave={(draft) =>
          editorTodo ? app.updateTodo(editorTodo.id, draft) : app.addTodo(draft)
        }
        projects={displayedProjects}
        t={t}
        todo={editorTodo}
        visible={editorVisible}
      />
      <ProjectMoveModal
        onClose={() => setMoveVisible(false)}
        onMove={(projectId) => {
          app.moveTodos([...selectedIds], projectId);
          closeSelection();
        }}
        projects={displayedProjects}
        t={t}
        visible={moveVisible}
      />
      <SortPickerModal
        onClose={() => setSortVisible(false)}
        onSelect={(sort) => {
          animatePreferences({ sort });
          setSortVisible(false);
        }}
        selected={preferences.sort}
        t={t}
        visible={sortVisible}
      />
    </Pressable>
  );
}

function FilterChip({
  active,
  label,
  color,
  onPress,
}: {
  active: boolean;
  label: string;
  color?: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <Pressable
      accessibilityState={{ selected: active }}
      hitSlop={{ top: 5, bottom: 5 }}
      onPress={onPress}
      style={[styles.filterChip, active && styles.filterChipActive]}
    >
      {color ? (
        <View
          style={[
            styles.filterDot,
            { backgroundColor: active ? '#ffffff' : color },
            active && styles.filterDotActive,
          ]}
        />
      ) : null}
      <Text style={[styles.filterChipText, active && styles.activeText]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SortPickerModal({
  visible,
  selected,
  t,
  onClose,
  onSelect,
}: {
  visible: boolean;
  selected: (typeof TODO_SORTS)[number];
  t: ReturnType<typeof useTodoAppContext>['t'];
  onClose: () => void;
  onSelect: (sort: (typeof TODO_SORTS)[number]) => void;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Pressable onPress={onClose} style={styles.modalOverlay}>
        <Pressable onPress={() => undefined} style={styles.sortCard}>
          <Text style={styles.moveTitle}>{t('sort')}</Text>
          {TODO_SORTS.map((sort) => {
            const active = selected === sort;
            return (
              <Pressable
                key={sort}
                accessibilityState={{ selected: active }}
                onPress={() => onSelect(sort)}
                style={[styles.sortOption, active && styles.sortOptionActive]}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    active && styles.sortOptionTextActive,
                  ]}
                >
                  {t(sort === 'completed' ? 'completedSort' : sort)}
                </Text>
                {active ? (
                  <Lucide color={theme.colors.primary} name="check" size={18} />
                ) : null}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function BulkActionBar({
  count,
  t,
  onClose,
  onComplete,
  onDelete,
  onArchive,
  onMove,
}: {
  count: number;
  t: ReturnType<typeof useTodoAppContext>['t'];
  onClose: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onMove: () => void;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const actions: {
    icon: LucideIconName;
    label: string;
    onPress: () => void;
  }[] = [
    { icon: 'check', label: t('done'), onPress: onComplete },
    { icon: 'folder-input', label: t('move'), onPress: onMove },
    { icon: 'archive', label: t('archive'), onPress: onArchive },
    { icon: 'trash-2', label: t('delete'), onPress: onDelete },
  ];
  return (
    <View style={styles.bulkBar}>
      <Pressable onPress={onClose} style={styles.bulkAction}>
        <Lucide color={theme.colors.text} name="x" size={19} />
        <Text style={styles.bulkLabel}>{count}</Text>
      </Pressable>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          onPress={action.onPress}
          style={styles.bulkAction}
        >
          <Lucide
            color={
              action.icon === 'trash-2'
                ? theme.colors.danger
                : theme.colors.primary
            }
            name={action.icon}
            size={19}
          />
          <Text style={styles.bulkLabel}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ProjectMoveModal({
  visible,
  projects,
  t,
  onClose,
  onMove,
}: {
  visible: boolean;
  projects: ReturnType<typeof useTodoAppContext>['displayedProjects'];
  t: ReturnType<typeof useTodoAppContext>['t'];
  onClose: () => void;
  onMove: (projectId: string | null) => void;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Pressable onPress={onClose} style={styles.modalOverlay}>
        <Pressable onPress={() => undefined} style={styles.moveCard}>
          <Text style={styles.moveTitle}>{t('selectProject')}</Text>
          <Pressable onPress={() => onMove(null)} style={styles.projectOption}>
            <Lucide
              color={theme.colors.textMuted}
              name="circle-slash"
              size={18}
            />
            <Text style={styles.projectOptionText}>{t('none')}</Text>
          </Pressable>
          {projects.map((project) => (
            <Pressable
              key={project.id}
              onPress={() => onMove(project.id)}
              style={styles.projectOption}
            >
              <View
                style={[styles.filterDot, { backgroundColor: project.color }]}
              />
              <Text style={styles.projectOptionText}>{project.name}</Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radii, sizes, spacing, typography } = theme;
  return StyleSheet.create({
    screen: { backgroundColor: colors.background, flex: 1 },
    listContent: {
      flexGrow: 1,
      paddingBottom: spacing.xxl,
      paddingHorizontal: spacing.lg,
    },
    brandRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: spacing.lg,
      paddingTop: spacing.md,
    },
    brand: {
      ...typography.label,
      color: colors.primary,
      fontWeight: '900',
      letterSpacing: 2.5,
    },
    dateLabel: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
    topAddButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: radii.lg,
      height: 48,
      justifyContent: 'center',
      width: 48,
      ...theme.shadows.floating,
    },
    heroCard: {
      backgroundColor: colors.primaryDark,
      borderRadius: radii.xl,
      flexDirection: 'row',
      minHeight: 136,
      overflow: 'hidden',
      padding: spacing.xl,
    },
    heroCopy: { flex: 1, justifyContent: 'center', paddingRight: spacing.sm },
    heroEyebrow: {
      ...typography.caption,
      color: 'rgba(255,255,255,0.72)',
      fontWeight: '800',
    },
    heroTitle: {
      ...typography.title,
      color: '#ffffff',
      fontSize: 20,
      lineHeight: 27,
      marginTop: spacing.sm,
    },
    heroBody: {
      ...typography.caption,
      color: 'rgba(255,255,255,0.72)',
      marginTop: spacing.sm,
    },
    progressCircle: {
      alignItems: 'center',
      alignSelf: 'center',
      borderColor: 'rgba(255,255,255,0.28)',
      borderRadius: 38,
      borderWidth: 8,
      height: 76,
      justifyContent: 'center',
      width: 76,
    },
    progressNumber: {
      ...typography.bodyStrong,
      color: '#ffffff',
      fontSize: 15,
    },
    smartRow: {
      gap: spacing.sm,
      paddingBottom: spacing.md,
      paddingTop: spacing.xl,
    },
    smartChip: {
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.md,
      flexDirection: 'row',
      gap: spacing.xs,
      minHeight: sizes.minTouchTarget,
      paddingHorizontal: spacing.md,
    },
    smartChipActive: { backgroundColor: colors.primary },
    smartText: { ...typography.label, color: colors.textMuted, fontSize: 11 },
    smartCount: { ...typography.caption, color: colors.textSoft, fontSize: 9 },
    activeText: { color: '#ffffff' },
    searchBox: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.md,
      borderWidth: 1,
      flexDirection: 'row',
      marginBottom: spacing.sm,
      minHeight: sizes.control,
      paddingLeft: spacing.md,
    },
    searchInput: {
      ...typography.body,
      color: colors.text,
      flex: 1,
      minHeight: 46,
      paddingHorizontal: spacing.sm,
    },
    clearSearch: {
      alignItems: 'center',
      height: sizes.minTouchTarget,
      justifyContent: 'center',
      width: sizes.minTouchTarget,
    },
    projectToolbar: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 36,
      paddingTop: spacing.sm,
    },
    projectLabel: {
      ...typography.caption,
      color: colors.textMuted,
      fontSize: 10,
    },
    sortButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.sm,
      flexDirection: 'row',
      gap: spacing.xs,
      height: 34,
      paddingHorizontal: spacing.sm,
    },
    sortButtonText: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: 10,
    },
    filterRow: { gap: spacing.sm, paddingBottom: spacing.xs },
    tagFilterRow: { gap: spacing.sm, paddingTop: spacing.xs },
    dragHint: {
      ...typography.caption,
      color: colors.textSoft,
      fontSize: 9,
      marginTop: spacing.xs,
    },
    filterChip: {
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.sm,
      flexDirection: 'row',
      gap: spacing.xs,
      minHeight: 34,
      paddingHorizontal: spacing.sm,
    },
    filterChipActive: { backgroundColor: colors.primary },
    filterChipText: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: 10,
    },
    filterDot: { borderRadius: 5, height: 9, width: 9 },
    filterDotActive: {
      borderColor: 'rgba(0,0,0,0.12)',
      borderWidth: 1,
    },
    listSectionHeader: {
      alignItems: 'center',
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.xl,
      paddingBottom: spacing.md,
      paddingTop: spacing.lg,
    },
    listSectionTitle: {
      ...typography.bodyStrong,
      color: colors.text,
      fontSize: 15,
    },
    listCountBadge: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: radii.pill,
      justifyContent: 'center',
      minHeight: 22,
      minWidth: 22,
      paddingHorizontal: spacing.sm,
    },
    listCountText: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '900',
    },
    clearCompleted: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
      justifyContent: 'center',
      minHeight: 50,
    },
    clearCompletedText: { ...typography.label, color: colors.danger },
    bulkBar: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderTopWidth: 1,
      bottom: 0,
      flexDirection: 'row',
      left: 0,
      minHeight: 66,
      position: 'absolute',
      right: 0,
      zIndex: 7,
    },
    bulkAction: {
      alignItems: 'center',
      flex: 1,
      gap: spacing.xxs,
      justifyContent: 'center',
      minHeight: 58,
    },
    bulkLabel: { ...typography.caption, color: colors.textMuted, fontSize: 9 },
    modalOverlay: {
      alignItems: 'center',
      backgroundColor: colors.overlay,
      flex: 1,
      justifyContent: 'center',
      padding: spacing.xxl,
    },
    moveCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      maxWidth: 420,
      padding: spacing.lg,
      width: '100%',
    },
    sortCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      maxWidth: 360,
      padding: spacing.lg,
      width: '100%',
    },
    moveTitle: {
      ...typography.title,
      color: colors.text,
      marginBottom: spacing.md,
    },
    projectOption: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.md,
      minHeight: 50,
    },
    projectOptionText: {
      ...typography.bodyStrong,
      color: colors.text,
      flex: 1,
    },
    sortOption: {
      alignItems: 'center',
      borderRadius: radii.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 48,
      paddingHorizontal: spacing.md,
    },
    sortOptionActive: { backgroundColor: colors.primarySoft },
    sortOptionText: { ...typography.bodyStrong, color: colors.textMuted },
    sortOptionTextActive: { color: colors.primary },
  });
}
