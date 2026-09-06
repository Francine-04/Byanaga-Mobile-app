import React, { useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  disabled = false,
  accessibilityLabel,
}) {
  const { theme } = useApp();
  const scale = useRef(new Animated.Value(1)).current;
  const colors = getVariantColors(theme, variant, disabled);

  const animateTo = (value) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: Platform.OS !== 'web',
      friction: 7,
      tension: 80,
    }).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => animateTo(0.98)}
      onPressOut={() => animateTo(1)}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            opacity: disabled ? 0.62 : 1,
            transform: [{ scale }],
          },
          style,
        ]}
      >
        {icon && iconPosition === 'left' ? <Ionicons name={icon} size={18} color={colors.text} style={styles.leftIcon} /> : null}
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.text, { color: colors.text, fontFamily: theme.typography.fonts.heading }, textStyle]}
        >
          {title}
        </Text>
        {icon && iconPosition === 'right' ? <Ionicons name={icon} size={18} color={colors.text} style={styles.rightIcon} /> : null}
      </Animated.View>
    </Pressable>
  );
}

function getVariantColors(theme, variant, disabled) {
  if (disabled) {
    return {
      background: theme.colors.surfaceMuted,
      border: theme.colors.border,
      text: theme.colors.textMuted,
    };
  }

  if (variant === 'secondary') {
    return {
      background: theme.colors.secondarySoft,
      border: theme.colors.secondarySoft,
      text: theme.colors.secondary,
    };
  }

  if (variant === 'outline') {
    return {
      background: 'transparent',
      border: theme.colors.border,
      text: theme.colors.text,
    };
  }

  if (variant === 'ghost') {
    return {
      background: 'transparent',
      border: 'transparent',
      text: theme.colors.primary,
    };
  }

  return {
    background: theme.colors.primary,
    border: theme.colors.primary,
    text: '#FFFFFF',
  };
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});
