import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function SettingsRow({ icon, label, subtitle, selected, value, onToggle, onPress, last = false }) {
  const { theme } = useApp();
  const Container = onToggle ? View : Pressable;
  return (
    <Container accessibilityRole={onToggle ? undefined : typeof selected === 'boolean' ? 'radio' : 'button'}
      accessibilityLabel={onToggle ? undefined : label} accessibilityState={typeof selected === 'boolean' ? { checked: selected } : undefined}
      aria-checked={typeof selected === 'boolean' ? selected : undefined}
      onPress={onPress} style={[styles.row, { borderBottomColor: theme.colors.border, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth }]}>
      <Ionicons name={icon} size={19} color={theme.colors.textMuted} />
      <View style={styles.copy}>
        <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {onToggle ? <Pressable accessibilityRole="switch" accessibilityLabel={label} aria-checked={value} accessibilityState={{ checked: value }}
        onPress={() => onToggle(!value)} style={styles.toggleTarget}>
        <View style={[styles.toggleTrack, { backgroundColor: value ? theme.colors.primary : theme.colors.border }]}>
          <View style={[styles.toggleThumb, { backgroundColor: theme.colors.onPrimary, alignSelf: value ? 'flex-end' : 'flex-start' }]} />
        </View>
      </Pressable>
        : typeof selected === 'boolean' ? <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={selected ? theme.colors.primary : theme.colors.border} />
          : <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />}
    </Container>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 48, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1, minWidth: 0 },
  label: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: 3 },
  toggleTarget: { width: 52, height: 44, justifyContent: 'center', alignItems: 'center', marginVertical: -8 },
  toggleTrack: { width: 44, height: 26, borderRadius: 13, padding: 3 },
  toggleThumb: { width: 20, height: 20, borderRadius: 10 },
});
