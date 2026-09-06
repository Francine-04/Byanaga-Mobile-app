import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function PlaceholderImage({ image, label = 'Photo placeholder', aspectRatio = 1.2, style, children, icon = 'image', iconSize = 36, showIcon = true }) {
  const { theme } = useApp();
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label || 'Photo placeholder'}
      style={[styles.media, { aspectRatio, borderRadius: theme.radius.xs, backgroundColor: theme.colors.surfaceMuted }, style]}>
      {image ? (
        <Image source={typeof image === 'string' ? { uri: image } : image} resizeMode="cover" style={StyleSheet.absoluteFill} />
      ) : showIcon ? (
        <Ionicons name={icon} size={iconSize} color={theme.colors.placeholder} />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  media: { width: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
