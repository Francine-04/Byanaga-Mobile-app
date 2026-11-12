import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { emergencyContacts, emergencyDirectoryUrl } from '../../data/emergencyContacts';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import Screen from '../../components/Screen';

export default function EmergencyContactsScreen({ navigation }) {
  const { theme } = useApp();
  const [error, setError] = useState('');
  const call = async (contact) => {
    setError('');
    try { await Linking.openURL('tel:' + contact.phone); }
    catch { setError('A phone app could not be opened. Dial ' + contact.display + ' on your phone.'); }
  };
  return (
    <Screen contentStyle={styles.content}>
      <AppHeader centered title="Emergency Contacts" onBack={() => goToDashboard(navigation)} backLabel="Back to dashboard" />
      <View style={[styles.notice, { backgroundColor: theme.colors.dangerSoft }]}>
        <Ionicons name="alert-circle-outline" size={30} color={theme.colors.danger} />
        <View style={styles.noticeBody}>
          <Text style={[styles.noticeTitle, { color: theme.colors.danger }]}>In an emergency</Text>
          <Text style={[styles.noticeText, { color: theme.colors.danger }]}>Call 911 or a local service below.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Call emergency hotline 911" onPress={() => call({ phone: '911', display: '911' })}
          style={[styles.call, { borderColor: theme.colors.danger }]}><Ionicons name="call" size={20} color={theme.colors.danger} /></Pressable>
      </View>
      {emergencyContacts.map((contact) => <View key={contact.id} style={[styles.contact, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <View style={[styles.serviceIcon, { backgroundColor: theme.colors.surfaceMuted }]}><Ionicons name={contact.icon} size={21} color={theme.colors.text} /></View>
        <View style={styles.contactBody}>
          <Text style={[styles.name, { color: theme.colors.text }]}>{contact.name}</Text>
          <Text selectable style={[styles.number, { color: theme.colors.textMuted }]}>{contact.display}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={'Call ' + contact.name + ' at ' + contact.display} onPress={() => call(contact)}
          style={[styles.call, { borderColor: theme.colors.primary }]}><Ionicons name="call" size={19} color={theme.colors.primary} /></Pressable>
      </View>)}
      {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
      <Pressable accessibilityRole="link" accessibilityLabel="Open Naga City emergency directory" onPress={() => Linking.openURL(emergencyDirectoryUrl).catch(() => setError('Unable to open the city directory. Please check your connection.'))} style={styles.source}>
        <Text style={[styles.sourceText, { color: theme.colors.primary }]}>Naga City emergency directory</Text><Ionicons name="open-outline" size={14} color={theme.colors.primary} />
      </Pressable>
      <Text style={[styles.checked, { color: theme.colors.textMuted }]}>Directory updated Aug 22, 2025</Text>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { paddingTop: 8 }, notice: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 8, padding: 12, marginBottom: 20 },
  noticeBody: { flex: 1 }, noticeTitle: { fontSize: 14, fontWeight: '700', lineHeight: 21 }, noticeText: { fontSize: 12, lineHeight: 19, marginTop: 3 },
  contact: { flexDirection: 'row', alignItems: 'center', padding: 10, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, marginBottom: 10, gap: 12, minHeight: 82 },
  serviceIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, contactBody: { flex: 1, minWidth: 0 },
  name: { fontSize: 13, lineHeight: 19, fontWeight: '600' }, number: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  call: { width: 44, height: 44, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  source: { minHeight: 44, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', marginTop: 10 }, sourceText: { fontSize: 12 },
  checked: { fontSize: 11, lineHeight: 17, textAlign: 'center' }, error: { fontSize: 13, lineHeight: 21, marginTop: 12 },
});
