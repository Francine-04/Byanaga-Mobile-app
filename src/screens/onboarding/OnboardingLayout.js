import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../context/AppContext';
import AppButton from '../../components/AppButton';

export default function OnboardingLayout({
  title,
  description,
  imageLabel,
  image,
  primary,
  secondary,
  step = 0,
  topAction,
  backAction,
}) {
  const { theme } = useApp();

  return (
    <LinearGradient
      colors={theme.dark ? [theme.colors.background, theme.colors.surface] : [theme.colors.surface, theme.colors.background]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
      <View style={styles.topBar}>
        {backAction ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={backAction} style={styles.topButton}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
        ) : (
          <View style={styles.topButton} />
        )}
        {topAction ? (
          <Pressable accessibilityRole="button" accessibilityLabel={topAction.title} onPress={topAction.onPress} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: theme.colors.primary }]}>{topAction.title}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.copyBlock}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: theme.colors.text }]}>{description}</Text>
      </View>

      <View style={styles.visualWrap}>
        <Image source={image} accessibilityLabel={imageLabel} accessibilityRole="image" resizeMode="contain" style={styles.visual} />
      </View>

      <View style={styles.dots}>
        {[0, 1, 2].map((dot) => (
          <View
            key={dot}
            style={[
              styles.dot,
              {
                backgroundColor: dot === step ? theme.colors.primary : theme.colors.border,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.actions}>
        {secondary ? <View style={{ flex: 1 }}><AppButton title={secondary.title} onPress={secondary.onPress} variant="outline" style={styles.action} /></View> : null}
        {primary ? (
          <View style={{ flex: 1 }}>
          <AppButton
            title={primary.title}
            onPress={primary.onPress}
            icon={primary.icon}
            iconPosition={primary.iconPosition || 'right'}
            style={styles.action}
          />
          </View>
        ) : null}
      </View>
      </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 26,
    paddingTop: 8,
    paddingBottom: 16,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  topBar: {
    flexShrink: 0,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  skipButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '900',
  },
  copyBlock: {
    marginTop: 12,
    flexShrink: 0,
  },
  visualWrap: {
    flex: 1,
    minHeight: 0,
    marginTop: 18,
    overflow: 'hidden',
    borderRadius: 8,
  },
  visual: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  dots: {
    flexShrink: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 14,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  title: {
    fontSize: 28,
    lineHeight: 35,
    fontWeight: '900',
  },
  description: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '600',
  },
  actions: {
    flexShrink: 0,
    minHeight: 48,
    flexDirection: 'row',
    gap: 18,
  },
  action: {
    flex: 1,
  },
});
