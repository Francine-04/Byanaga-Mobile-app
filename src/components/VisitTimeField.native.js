import React, { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import AppTextInput from './AppTextInput';

export default function VisitTimeField({ value, onChange, style, error }) {
  const { theme } = useApp();
  const [open, setOpen] = useState(false);
  const timeValue = useMemo(() => parseTimeValue(value), [value]);

  const selectTime = (selectedTime) => {
    if (!selectedTime) {
      return;
    }

    onChange(formatTime(selectedTime));
    if (Platform.OS === 'android') {
      setOpen(false);
    }
  };

  return (
    <View style={style}>
      <Pressable accessibilityRole="button" accessibilityLabel="Open visit time picker" onPress={() => setOpen(true)}>
        <View pointerEvents="none">
          <AppTextInput
            label="Visit Time"
            value={value}
            placeholder="Select visit time"
            leftIcon="time-outline"
            editable={false}
            error={error}
          />
        </View>
      </Pressable>

      {Platform.OS === 'android' && open ? (
        <DateTimePicker
          value={timeValue}
          mode="time"
          display="clock"
          is24Hour={false}
          minuteInterval={5}
          onValueChange={(event, selectedTime) => selectTime(selectedTime)}
          onDismiss={() => setOpen(false)}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <SafeAreaView style={styles.modalSafe}>
            <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
            <View style={[styles.sheet, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>Select Visit Time</Text>
              <DateTimePicker
                value={timeValue}
                mode="time"
                display="spinner"
                is24Hour={false}
                minuteInterval={5}
                onValueChange={(event, selectedTime) => selectTime(selectedTime)}
                onDismiss={() => setOpen(false)}
                accentColor={theme.colors.primary}
                themeVariant={theme.dark ? 'dark' : 'light'}
              />
              <Pressable accessibilityRole="button" accessibilityLabel="Close time picker" onPress={() => setOpen(false)} style={styles.doneButton}>
                <Text style={[styles.doneText, { color: theme.colors.primary }]}>Done</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Modal>
      ) : null}
    </View>
  );
}

function parseTimeValue(value) {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  const date = new Date();

  if (!match) {
    date.setHours(8, 0, 0, 0);
    return date;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  date.setHours(hour, Number.isFinite(minute) ? minute : 0, 0, 0);
  return date;
}

function formatTime(date) {
  let hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, '0');
  const period = hour >= 12 ? 'PM' : 'AM';

  hour %= 12;
  if (hour === 0) hour = 12;

  return `${hour}:${minute} ${period}`;
}

const styles = StyleSheet.create({
  modalSafe: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    margin: 16,
    borderWidth: 1,
    borderRadius: 22,
    paddingTop: 18,
    overflow: 'hidden',
  },
  sheetTitle: {
    paddingHorizontal: 18,
    paddingBottom: 8,
    fontSize: 17,
    fontWeight: '900',
  },
  doneButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: {
    fontSize: 14,
    fontWeight: '900',
  },
});
