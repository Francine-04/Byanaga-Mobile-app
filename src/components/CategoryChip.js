import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function CategoryChip({ label, selected, onPress, icon, style, labelStyle, showSelectedIcon = true, labelLines = 1 }) {
  const { theme } = useApp();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}${selected ? ', selected' : ''}`}
      accessibilityState={{ selected: !!selected }}
      aria-pressed={!!selected}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
        style,
      ]}
    >
      {selected && showSelectedIcon ? (
        <Ionicons name="checkmark-circle" size={15} color="#FFFFFF" style={styles.icon} />
      ) : icon ? (
        <Ionicons name={icon} size={15} color={theme.colors.textMuted} style={styles.icon} />
      ) : null}
      <Text style={[styles.label, { color: selected ? '#FFFFFF' : theme.colors.text, flexShrink: 1, textAlign: 'center' }, labelStyle]} numberOfLines={labelLines}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
  },
});
