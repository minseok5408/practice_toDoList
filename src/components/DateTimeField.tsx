import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Lucide } from '@react-native-vector-icons/lucide';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { formatLocalDateTime } from '../domain/dateUtils';
import type { Translator } from '../i18n';
import { useAppTheme, type AppTheme } from '../theme';

type DateTimeFieldProps = {
  label: string;
  value: number | null;
  locale: 'ko' | 'en';
  t: Translator;
  onChange: (value: number | null) => void;
};

export function DateTimeField({
  label,
  value,
  locale,
  t,
  onChange,
}: DateTimeFieldProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [showIosPicker, setShowIosPicker] = useState(false);
  const [draftDate, setDraftDate] = useState(
    new Date(value ?? Date.now() + 60 * 60 * 1000),
  );

  useEffect(() => {
    if (value !== null) {
      setDraftDate(new Date(value));
    }
  }, [value]);

  function applyDatePart(selectedDate: Date, baseDate: Date) {
    const result = new Date(baseDate);
    result.setFullYear(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
    );
    return result;
  }

  function openAndroidPicker() {
    const initialDate = new Date(value ?? Date.now() + 60 * 60 * 1000);

    DateTimePickerAndroid.open({
      value: initialDate,
      mode: 'date',
      onChange: (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type !== 'set' || !selectedDate) {
          return;
        }

        const dateWithOriginalTime = applyDatePart(selectedDate, initialDate);
        DateTimePickerAndroid.open({
          value: dateWithOriginalTime,
          mode: 'time',
          is24Hour: locale === 'ko',
          onChange: (timeEvent, selectedTime) => {
            if (timeEvent.type !== 'set' || !selectedTime) {
              return;
            }

            dateWithOriginalTime.setHours(
              selectedTime.getHours(),
              selectedTime.getMinutes(),
              0,
              0,
            );
            onChange(dateWithOriginalTime.getTime());
          },
        });
      },
    });
  }

  function openPicker() {
    if (Platform.OS === 'android') {
      openAndroidPicker();
      return;
    }

    setDraftDate(new Date(value ?? Date.now() + 60 * 60 * 1000));
    setShowIosPicker(true);
  }

  return (
    <>
      <View style={styles.row}>
        <Pressable
          accessibilityLabel={label}
          accessibilityRole="button"
          onPress={openPicker}
          style={({ pressed }) => [styles.field, pressed && styles.pressed]}
        >
          <Lucide
            color={theme.colors.primary}
            name="calendar-clock"
            size={18}
          />
          <View style={styles.textArea}>
            <Text style={styles.label}>{label}</Text>
            <Text style={[styles.value, value === null && styles.placeholder]}>
              {value === null ? t('none') : formatLocalDateTime(value, locale)}
            </Text>
          </View>
          <Lucide
            color={theme.colors.textSoft}
            name="chevron-right"
            size={17}
          />
        </Pressable>
        {value !== null ? (
          <Pressable
            accessibilityLabel={`${label} ${t('clear')}`}
            accessibilityRole="button"
            hitSlop={7}
            onPress={() => onChange(null)}
            style={({ pressed }) => [
              styles.clearButton,
              pressed && styles.pressed,
            ]}
          >
            <Lucide color={theme.colors.danger} name="x" size={17} />
          </Pressable>
        ) : null}
      </View>

      {Platform.OS === 'ios' ? (
        <Modal
          animationType="fade"
          onRequestClose={() => setShowIosPicker(false)}
          transparent
          visible={showIosPicker}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>{label}</Text>
              <DateTimePicker
                display="spinner"
                locale={locale === 'ko' ? 'ko-KR' : 'en-US'}
                mode="datetime"
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                    setDraftDate(selectedDate);
                  }
                }}
                textColor={theme.colors.text}
                value={draftDate}
              />
              <View style={styles.pickerActions}>
                <Pressable
                  onPress={() => setShowIosPicker(false)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelText}>{t('cancel')}</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    onChange(draftDate.getTime());
                    setShowIosPicker(false);
                  }}
                  style={styles.confirmButton}
                >
                  <Text style={styles.confirmText}>{t('done')}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

function createStyles(theme: AppTheme) {
  const { colors } = theme;
  return StyleSheet.create({
    row: { alignItems: 'center', flexDirection: 'row', gap: 8 },
    field: {
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderRadius: 14,
      flex: 1,
      flexDirection: 'row',
      gap: 10,
      minHeight: 58,
      paddingHorizontal: 13,
    },
    textArea: { flex: 1 },
    label: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
    value: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '700',
      marginTop: 3,
    },
    placeholder: { color: colors.textSoft },
    clearButton: {
      alignItems: 'center',
      backgroundColor: colors.dangerSoft,
      borderRadius: 12,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    pressed: { opacity: 0.55 },
    modalBackdrop: {
      alignItems: 'center',
      backgroundColor: colors.overlay,
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
    pickerCard: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      maxWidth: 420,
      padding: 18,
      width: '100%',
    },
    pickerTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
    pickerActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 22,
      justifyContent: 'flex-end',
    },
    cancelText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
    cancelButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: 10,
    },
    confirmButton: {
      backgroundColor: colors.primary,
      borderRadius: 11,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: 18,
      paddingVertical: 10,
    },
    confirmText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  });
}
