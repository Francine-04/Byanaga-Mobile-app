import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function ItineraryTipCard({ message }) {
  const { theme } = useApp();
  if (!message) return null;
  const copy = message.replace(/^Why visit these places\?\s*/i, '');
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary }]}>
      <View style={styles.heading}>
        <View style={[styles.icon, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="bulb-outline" size={21} color="#FFFFFF" />
        </View>
        <View style={styles.titleGroup}>
          <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>YOUR TRAVEL TIP</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>Why visit these places?</Text>
        </View>
      </View>
      <Text style={[styles.copy, { color: theme.colors.text }]}>{copy}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderLeftWidth: 4, borderRadius: 18, padding: 16, marginVertical: 16 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  titleGroup: { flex: 1 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 3 },
  title: { fontSize: 15, fontWeight: '800', lineHeight: 21 },
  copy: { fontSize: 13, lineHeight: 21 },
});
