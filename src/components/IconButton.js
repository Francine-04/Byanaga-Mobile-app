import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function IconButton({ icon, onPress, active = false, label, style, size = 44 }) {
  const { theme } = useApp();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label || icon}
      onPress={onPress}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: active ? theme.colors.primary : theme.colors.surface,
          borderColor: active ? theme.colors.primary : theme.colors.border,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={size > 42 ? 20 : 18} color={active ? '#FFFFFF' : theme.colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
