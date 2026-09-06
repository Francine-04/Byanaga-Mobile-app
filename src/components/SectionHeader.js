import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function SectionHeader({ title, action = 'See All', onPress, style }) {
  const { theme } = useApp();

  return (
    <View style={[styles.header, style]}>
      <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fonts.heading }]}>{title}</Text>
      {onPress ? (
        <Pressable accessibilityRole="button" accessibilityLabel={action} onPress={onPress} style={styles.action}>
          <Text style={[styles.actionText, { color: theme.colors.primary }]}>{action}</Text>
          <Ionicons name="chevron-forward" size={14} color={theme.colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 22,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  action: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
