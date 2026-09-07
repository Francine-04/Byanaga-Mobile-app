import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function NotificationBanner({ navigationRef }) {
  const { theme, visibleNotifications, isLoggedIn, isGuestMode, firebaseUser } = useApp();
  const insets = useSafeAreaInsets();
  const seen = useRef(new Set());
  const started = useRef(Date.now());
  const [notice, setNotice] = useState(null);
  useEffect(() => {
    seen.current = new Set();
    started.current = Date.now();
    setNotice(null);
  }, [firebaseUser?.uid, isGuestMode, isLoggedIn]);
  useEffect(() => {
    const incoming = visibleNotifications.find((item) => !item.read && !seen.current.has(`${item.id}-${item.createdAt}`) && item.createdAt >= started.current);
    visibleNotifications.forEach((item) => seen.current.add(`${item.id}-${item.createdAt}`));
    if (incoming && isLoggedIn) setNotice(incoming);
  }, [visibleNotifications, isLoggedIn]);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 7000);
    return () => clearTimeout(timer);
  }, [notice]);
  if (!notice) return null;
  return (
    <View style={[styles.banner, { top: insets.top + 8, backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open notification: ${notice.title}`} style={styles.body} onPress={() => { navigationRef.current?.navigate('Notifications'); setNotice(null); }}>
        <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.text, fontWeight: '700' }}>{notice.title}</Text>
        <Text numberOfLines={2} style={{ color: theme.colors.textMuted, marginTop: 4 }}>{notice.message}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss notification" onPress={() => setNotice(null)} style={styles.close}>
        <Ionicons name="close" size={22} color={theme.colors.text} />
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({ banner: { position: 'absolute', left: 12, right: 12, zIndex: 100, elevation: 10, borderWidth: 1, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }, body: { flex: 1, padding: 14 }, close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' } });
