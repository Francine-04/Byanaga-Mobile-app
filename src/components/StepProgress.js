import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useApp } from '../context/AppContext';

export default function StepProgress({ progress = 0.5, style }) {
  const { theme } = useApp();
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={[styles.track, { backgroundColor: theme.colors.border }, style]}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: theme.colors.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
