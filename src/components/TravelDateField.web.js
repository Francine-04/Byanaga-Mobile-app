import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import AppTextInput from './AppTextInput';

const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function TravelDateField({ value, onChange, style, error }) {
  const { theme } = useApp();
  const [open, setOpen] = useState(false);
  const selectedDate = useMemo(() => parseDateValue(value), [value]);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const days = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);

  const moveMonth = (amount) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const moveYear = (amount) => {
    setVisibleMonth((current) => new Date(current.getFullYear() + amount, current.getMonth(), 1));
  };

  const selectDay = (day) => {
    const nextDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
    onChange(formatDate(nextDate));
    setOpen(false);
  };

  return (
    <View style={style}>
      <Pressable accessibilityRole="button" accessibilityLabel="Open travel date calendar" onPress={() => setOpen(true)}>
        <View pointerEvents="none">
          <AppTextInput label="Travel Date" value={value} placeholder="Select travel date" rightIcon="calendar-outline" editable={false} error={error} />
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modal}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={[styles.calendar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.header}>
              <Pressable accessibilityRole="button" accessibilityLabel="Previous year" onPress={() => moveYear(-1)} style={styles.navButton}>
                <Ionicons name="play-skip-back" size={17} color={theme.colors.text} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => moveMonth(-1)} style={styles.navButton}>
                <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
              </Pressable>
              <Text style={[styles.monthTitle, { color: theme.colors.text }]}>
                {monthNames[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
              </Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => moveMonth(1)} style={styles.navButton}>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Next year" onPress={() => moveYear(1)} style={styles.navButton}>
                <Ionicons name="play-skip-forward" size={17} color={theme.colors.text} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {weekDays.map((day, index) => (
                <Text key={`${day}-${index}`} style={[styles.weekDay, { color: theme.colors.textMuted }]}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {days.map((day, index) => {
                const selected =
                  day &&
                  selectedDate.getFullYear() === visibleMonth.getFullYear() &&
                  selectedDate.getMonth() === visibleMonth.getMonth() &&
                  selectedDate.getDate() === day;

                return (
                  <Pressable
                    key={`${day || 'blank'}-${index}`}
                    accessibilityRole={day ? 'button' : undefined}
                    accessibilityLabel={day ? `Select day ${day}` : undefined}
                    disabled={!day}
                    onPress={() => selectDay(day)}
                    style={[
                      styles.day,
                      {
                        backgroundColor: selected ? theme.colors.primary : 'transparent',
                      },
                    ]}
                  >
                    <Text style={[styles.dayText, { color: selected ? theme.colors.onPrimary : day ? theme.colors.text : 'transparent' }]}>
                      {day || 0}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function buildCalendarDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: firstDay }, () => null);

  for (let day = 1; day <= lastDate; day += 1) {
    days.push(day);
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

function parseDateValue(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date();
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  calendar: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
  },
  weekRow: {
    marginTop: 8,
    flexDirection: 'row',
  },
  weekDay: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '900',
  },
  grid: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  day: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
