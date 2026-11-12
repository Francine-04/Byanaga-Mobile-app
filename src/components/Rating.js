import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function Rating({ value, label }) {
  const { theme } = useApp();

  return (
    <View style={styles.row} accessibilityLabel={`Rating ${value}`}>
      <Ionicons name="star" size={14} color={theme.colors.accent} />
      <Text style={[styles.text, { color: theme.colors.text }]}>{value}</Text>
      {label ? <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '800',
  },
  label: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '600',
  },
});
