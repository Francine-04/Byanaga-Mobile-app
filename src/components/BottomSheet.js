import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useApp } from '../context/AppContext';

export default function BottomSheet({ children, style }) {
  const { theme } = useApp();

  return (
    <View
      style={[
        styles.sheet,
        theme.shadows.medium,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border, shadowColor: theme.colors.shadow },
        style,
      ]}
    >
      <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 14,
  },
});
