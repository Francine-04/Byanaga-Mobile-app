import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

export default function SelectionSheet({ visible, title, options = [], value, onSelect, onClose, searchable = false, searchPlaceholder = 'Search options...' }) {
  const { theme } = useApp();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => String(option).toLowerCase().includes(term));
  }, [options, query]);

  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Dismiss options" accessibilityRole="button" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: theme.colors.surface, paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close options" onPress={onClose} style={styles.close}>
              <Ionicons name="close" size={23} color={theme.colors.text} />
            </Pressable>
          </View>
          {searchable ? (
            <View style={[styles.searchWrap, { backgroundColor: theme.colors.input, borderColor: theme.colors.border }]}>
              <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} />
              <TextInput
                accessibilityLabel={`Search ${title}`}
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor={theme.colors.textSoft}
                autoCorrect={false}
                style={[styles.searchInput, { color: theme.colors.text, fontFamily: theme.typography.fonts.body }]}
              />
            </View>
          ) : null}
          <ScrollView keyboardShouldPersistTaps="handled">
            {filteredOptions.map((option) => (
              <Pressable key={option} accessibilityRole="radio" accessibilityLabel={option} accessibilityState={{ checked: option === value }}
                aria-checked={option === value}
                onPress={() => { onSelect(option); onClose(); }} style={[styles.option, { borderTopColor: theme.colors.border }]}>
                <Text style={[styles.optionText, { color: theme.colors.text }]}>{option}</Text>
                <Ionicons name={option === value ? 'checkmark-circle' : 'ellipse-outline'} size={21} color={option === value ? theme.colors.primary : theme.colors.textSoft} />
              </Pressable>
            ))}
            {!filteredOptions.length ? <Text style={[styles.empty, { color: theme.colors.textMuted }]}>No options found.</Text> : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: 480, maxHeight: '80%', paddingHorizontal: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  title: { flex: 1, fontSize: 18, lineHeight: 24, fontWeight: '700' },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { minHeight: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 14, paddingVertical: 10 },
  option: { minHeight: 52, flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, gap: 12 },
  optionText: { flex: 1, fontSize: 15, lineHeight: 22 },
  empty: { paddingVertical: 22, textAlign: 'center', fontSize: 13, fontWeight: '700' },
});
