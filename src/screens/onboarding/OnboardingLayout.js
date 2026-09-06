import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../context/AppContext';
import AppButton from '../../components/AppButton';
import MapPlaceholder from '../../components/MapPlaceholder';
import PlaceholderImage from '../../components/PlaceholderImage';

export default function OnboardingLayout({
  title,
  description,
  imageLabel,
  primary,
  secondary,
  step = 0,
  topAction,
  backAction,
  visualType,
}) {
  const { theme } = useApp();

  return (
    <LinearGradient
      colors={theme.dark ? [theme.colors.background, theme.colors.surface] : [theme.colors.surface, theme.colors.background]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
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
        {visualType === 'map' ? (
          <MapPlaceholder style={styles.mapVisual} />
        ) : (
          <PlaceholderImage label={imageLabel} aspectRatio={1.1} style={styles.visual} />
        )}
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
      </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: 20,
    paddingBottom: 28,
  },
  topBar: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topButton: {
    width: 44,
    height: 36,
    justifyContent: 'center',
  },
  skipButton: {
    minHeight: 36,
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '900',
  },
  copyBlock: {
    marginTop: 28,
    minHeight: 218,
  },
  visualWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  visual: {
    width: '100%',
    minHeight: 245,
    maxHeight: 318,
  },
  mapVisual: {
    aspectRatio: 1.25,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 18,
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
    marginTop: 20,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 18,
  },
  action: {
    flex: 1,
  },
});
