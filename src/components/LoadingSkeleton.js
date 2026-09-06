import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useApp } from '../context/AppContext';

export default function LoadingSkeleton({ rows = 2, style }) {
  const { theme } = useApp();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.95, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.wrap, { opacity }, style]}>
      <View style={[styles.media, { backgroundColor: theme.colors.placeholder }]} />
      {Array.from({ length: rows }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.line,
            {
              backgroundColor: theme.colors.placeholder,
              width: index === rows - 1 ? '58%' : '82%',
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 24,
  },
  media: {
    height: 120,
    borderRadius: 22,
    marginBottom: 12,
  },
  line: {
    height: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
});
