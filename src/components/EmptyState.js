import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import AppButton from './AppButton';

export default function EmptyState({ title, description, buttonTitle, onPress, illustrationLabel = '', icon, variant = 'primary', busy = false, style }) {
  const { theme } = useApp();
  const name = icon || (/search/i.test(illustrationLabel) ? 'search-outline' : /internet/i.test(illustrationLabel) ? 'cloud-offline-outline' : /notification/i.test(illustrationLabel) ? 'notifications-outline' : 'bag-handle-outline');
  return (
    <View style={[styles.wrap, style]}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.symbol, { backgroundColor: theme.colors.primarySoft }]}>
        <Ionicons name={name} size={74} color={theme.colors.primary} />
      </View>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.colors.textMuted }]}>{description}</Text>
      {buttonTitle ? (
        <View style={styles.button}>
          <AppButton title={busy ? 'Checking connection...' : buttonTitle} onPress={onPress} variant={variant} disabled={busy}
            style={[styles.action, variant === 'outline' && { borderColor: theme.colors.primary }]}
            textStyle={variant === 'outline' ? { color: theme.colors.primary } : undefined} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 36, paddingHorizontal: 12 },
  symbol: { width: 156, height: 156, borderRadius: 78, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  title: { fontSize: 21, lineHeight: 28, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  description: { fontSize: 14, lineHeight: 23, textAlign: 'center', maxWidth: 260 },
  button: { width: '100%', maxWidth: 244, marginTop: 30 },
  action: { borderRadius: 16 },
});
