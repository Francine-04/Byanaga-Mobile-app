import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function AppHeader({ title, subtitle, onBack, rightIcon, rightText, onRightPress, rightLabel, centered = false, backLabel = 'Back' }) {
  const { theme } = useApp();

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={backLabel} onPress={onBack} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={21} color={theme.colors.text} />
        </Pressable>
        {centered && title ? <Text accessibilityRole="header" style={[styles.centeredTitle, { color: theme.colors.primary }]}>{title}</Text> : null}
        {rightText ? (
          <Pressable accessibilityRole="button" accessibilityLabel={rightLabel || rightText} onPress={onRightPress} style={styles.textButton}>
            <Text style={[styles.textButtonLabel, { color: theme.colors.primary }]}>{rightText}</Text>
          </Pressable>
        ) : rightIcon ? (
          <Pressable accessibilityRole="button" accessibilityLabel={rightLabel || rightIcon} onPress={onRightPress} style={styles.iconButton}>
            <Ionicons name={rightIcon} size={20} color={theme.colors.text} />
          </Pressable>
        ) : (
          <View style={styles.iconButton} />
        )}
      </View>
      {title && !centered ? <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text> : null}
      {subtitle ? <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text> : null}
    </View>
  );
}

export function goToDashboard(navigation) {
  goToMain(navigation, 'Home');
}

export function goToMain(navigation, screen, params) {
  let current = navigation;
  while (current) {
    if (current.getState()?.routeNames.includes('Main')) {
      if (current.popTo && current.getState().routes.some((route) => route.name === 'Main')) current.popTo('Main', { screen, params });
      else current.navigate('Main', { screen, params });
      return;
    }
    current = current.getParent?.();
  }
  navigation.navigate(screen, params);
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 2,
    marginBottom: 16,
  },
  topRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  textButtonLabel: {
    fontSize: 13,
    fontWeight: '900',
  },
  centeredTitle: {
    flex: 1,
    paddingHorizontal: 8,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  title: {
    marginTop: 14,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
});
