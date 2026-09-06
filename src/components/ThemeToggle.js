import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

const options = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export default function ThemeToggle({ compact = false }) {
  const { theme, themePreference, setThemePreference } = useApp();
  const shown = compact ? options.slice(0, 2) : options;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
      {shown.map((option) => {
        const active = themePreference === option.value;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${option.label} mode`}
            key={option.value}
            onPress={() => setThemePreference(option.value)}
            style={[styles.option, active && { backgroundColor: theme.colors.primary }]}
          >
            <Ionicons name={option.icon} size={14} color={active ? '#FFFFFF' : theme.colors.textMuted} />
            {!compact ? (
              <Text style={[styles.label, { color: active ? '#FFFFFF' : theme.colors.textMuted }]}>{option.label}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 999,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  option: {
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: '800',
  },
});
