import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useApp } from '../context/AppContext';

export default function AppCard({ children, onPress, style, contentStyle, accessibilityLabel }) {
  const { theme } = useApp();
  const scale = useRef(new Animated.Value(1)).current;

  const cardStyle = [
    styles.card,
    theme.shadows.soft,
    {
      backgroundColor: theme.colors.card,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.shadow,
    },
    style,
  ];

  if (!onPress) {
    return <View style={[cardStyle, contentStyle]}>{children}</View>;
  }

  const animateTo = (value) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={() => animateTo(0.985)}
      onPressOut={() => animateTo(1)}
    >
      <Animated.View style={[cardStyle, contentStyle, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
