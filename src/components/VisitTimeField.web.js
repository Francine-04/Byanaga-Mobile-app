import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import AppButton from './AppButton';
import AppTextInput from './AppTextInput';

const hours = Array.from({ length: 12 }, (_, index) => index + 1);
const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const periods = ['AM', 'PM'];

export default function VisitTimeField({ value, onChange, style, error }) {
  const { theme } = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => parseTimeValue(value));

  useEffect(() => {
    if (open) {
      setDraft(parseTimeValue(value));
    }
  }, [open, value]);

  const applyTime = () => {
    onChange(`${draft.hour}:${draft.minute} ${draft.period}`);
    setOpen(false);
  };

  return (
    <View style={style}>
      <Pressable accessibilityRole="button" accessibilityLabel="Open visit time picker" onPress={() => setOpen(true)}>
        <View pointerEvents="none">
          <AppTextInput label="Visit Time" value={value} placeholder="Select visit time" leftIcon="time-outline" editable={false} error={error} />
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modal}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={[styles.panel, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Select Visit Time</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close time picker" onPress={() => setOpen(false)} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={theme.colors.text} />
              </Pressable>
            </View>

            <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Hour</Text>
            <View style={styles.grid}>
              {hours.map((hour) => (
                <Option
                  key={hour}
                  label={String(hour)}
                  selected={draft.hour === hour}
                  onPress={() => setDraft((current) => ({ ...current, hour }))}
                />
              ))}
            </View>

            <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Minute</Text>
            <View style={styles.grid}>
              {minutes.map((minute) => (
                <Option
                  key={minute}
                  label={minute}
                  selected={draft.minute === minute}
                  onPress={() => setDraft((current) => ({ ...current, minute }))}
                />
              ))}
            </View>

            <View style={styles.periodRow}>
              {periods.map((period) => (
                <Option
                  key={period}
                  label={period}
                  selected={draft.period === period}
                  onPress={() => setDraft((current) => ({ ...current, period }))}
                  wide
                />
              ))}
            </View>

            <AppButton title="Set Time" onPress={applyTime} style={styles.action} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Option({ label, selected, onPress, wide = false }) {
  const { theme } = useApp();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Select ${label}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.option,
        wide && styles.optionWide,
        {
          backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceMuted,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.optionText, { color: selected ? theme.colors.onPrimary : theme.colors.text }]}>{label}</Text>
    </Pressable>
  );
}

function parseTimeValue(value) {
  const match = String(value || '').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);

  if (!match) {
    return { hour: 8, minute: '00', period: 'AM' };
  }

  let hour = Number(match[1]);
  const minute = String(match[2] || '00').padStart(2, '0');
  const period = (match[3] || 'AM').toUpperCase();

  if (!Number.isFinite(hour) || hour < 1 || hour > 12) {
    hour = 8;
  }

  return {
    hour,
    minute: minutes.includes(minute) ? minute : '00',
    period: periods.includes(period) ? period : 'AM',
  };
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
  panel: {
    width: '100%',
    maxWidth: 370,
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  option: {
    minWidth: 44,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionWide: {
    flex: 1,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '900',
  },
  action: {
    marginTop: 16,
  },
});
