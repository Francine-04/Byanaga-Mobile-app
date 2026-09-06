import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import SelectionSheet from './SelectionSheet';

export default function SelectField({
  label,
  value,
  placeholder = 'Select option',
  options,
  onSelect,
  error,
  searchable = false,
  searchPlaceholder,
  style,
}) {
  const { theme } = useApp();
  const [open, setOpen] = useState(false);
  const hasValue = !!value;

  return (
    <View style={[styles.field, style]}>
      {label ? <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Select ${label || placeholder}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={[
          styles.select,
          {
            backgroundColor: theme.colors.input,
            borderColor: error ? theme.colors.danger : theme.colors.border,
          },
        ]}
      >
        <Text numberOfLines={1} style={[styles.value, { color: hasValue ? theme.colors.text : theme.colors.textSoft }]}>
          {hasValue ? value : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.colors.textMuted} />
      </Pressable>
      {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}

      <SelectionSheet
        visible={open}
        title={label || placeholder}
        options={options}
        value={value}
        onSelect={onSelect}
        onClose={() => setOpen(false)}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '700',
  },
  select: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  value: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
  },
});
