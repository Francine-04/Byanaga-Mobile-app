import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function PlaceholderImage({ image, label = 'Photo placeholder', aspectRatio = 1.2, style, imageStyle, resizeMode = 'contain', children, icon = 'image', iconSize = 36, showIcon = true }) {
  const { theme } = useApp();
  const fit = resizeMode || 'contain';
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label || 'Photo placeholder'}
      style={[styles.media, { aspectRatio, borderRadius: theme.radius.xs, backgroundColor: theme.colors.surfaceMuted }, style]}>
      {image ? (
        <Image
          source={typeof image === 'string' ? { uri: image } : image}
          resizeMode={fit}
          style={[styles.image, { objectFit: fit }, imageStyle]}
        />
      ) : showIcon ? (
        <Ionicons name={icon} size={iconSize} color={theme.colors.placeholder} />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  media: { width: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%', alignSelf: 'center' },
});
