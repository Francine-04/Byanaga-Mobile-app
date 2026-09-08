import React, { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import AppTextInput from './AppTextInput';

export default function TravelDateField({ value, onChange, style, error }) {
  const { theme } = useApp();
  const [open, setOpen] = useState(false);
  const dateValue = useMemo(() => parseDateValue(value), [value]);

  const selectDate = (selectedDate) => {
    if (!selectedDate) {
      return;
    }

    onChange(formatDate(selectedDate));
    if (Platform.OS === 'android') {
      setOpen(false);
    }
  };

  return (
    <View style={style}>
      <Pressable accessibilityRole="button" accessibilityLabel="Open travel date picker" onPress={() => setOpen(true)}>
        <View pointerEvents="none">
          <AppTextInput
            label="Travel Date"
            value={value}
            placeholder="Select travel date"
            rightIcon="calendar-outline"
            editable={false}
            error={error}
          />
        </View>
      </Pressable>

      {Platform.OS === 'android' && open ? (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display="calendar"
          startOnYearSelection
          onValueChange={(event, selectedDate) => selectDate(selectedDate)}
          onDismiss={() => setOpen(false)}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <SafeAreaView style={styles.modalSafe}>
            <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
            <View style={[styles.sheet, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>Select Travel Date</Text>
              <DateTimePicker
                value={dateValue}
                mode="date"
                display="inline"
                onValueChange={(event, selectedDate) => selectDate(selectedDate)}
                onDismiss={() => setOpen(false)}
                accentColor={theme.colors.primary}
                themeVariant={theme.dark ? 'dark' : 'light'}
              />
              <Pressable accessibilityRole="button" accessibilityLabel="Confirm travel date" onPress={() => { onChange(formatDate(dateValue)); setOpen(false); }} style={styles.doneButton}>
                <Text style={[styles.doneText, { color: theme.colors.primary }]}>Done</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Modal>
      ) : null}
    </View>
  );
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
