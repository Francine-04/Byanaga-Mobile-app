import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import AppCard from './AppCard';

export default function VoucherCard({ voucher, onPress, horizontal = false, style }) {
  const { theme } = useApp();
  return (
    <AppCard
      accessibilityLabel={`Open offer ${voucher.title}`}
      onPress={onPress}
      style={[styles.card, horizontal && styles.horizontalCard, { borderColor: theme.colors.accent }, style]}
    >
      <View style={[styles.discount, { backgroundColor: theme.colors.accent }]}>
        <Ionicons name="pricetag" size={18} color="#FFFFFF" />
        <Text style={styles.discountText} numberOfLines={2}>{voucher.discountDisplay}</Text>
      </View>
      <View style={styles.body}>
        <Text style={[styles.establishment, { color: theme.colors.primary }]} numberOfLines={1}>{voucher.establishmentName}</Text>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>{voucher.title}</Text>
        {voucher.description ? <Text style={[styles.description, { color: theme.colors.textMuted }]} numberOfLines={2}>{voucher.description}</Text> : null}
        <View style={styles.validity}>
          <Ionicons name="calendar-outline" size={14} color={theme.colors.textMuted} />
          <Text style={[styles.validityText, { color: theme.colors.textMuted }]}>Until {formatDate(voucher.validUntil)}</Text>
        </View>
        <Text style={[styles.remaining, { color: theme.colors.secondary }]}>{voucher.remainingClaims} remaining</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textSoft} style={styles.chevron} />
    </AppCard>
  );
}

function formatDate(value) {
  if (!(value instanceof Date)) return 'date unavailable';
  return value.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' });
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 138,
    marginBottom: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  horizontalCard: {
    width: 286,
    marginRight: 14,
  },
  discount: {
    width: 76,
    borderRadius: 15,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountText: {
    marginTop: 7,
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
  },
  body: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 2,
    paddingLeft: 12,
    paddingRight: 20,
  },
  establishment: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '900',
  },
  title: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
  },
  description: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
  },
  validity: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  validityText: {
    marginLeft: 5,
    fontSize: 9,
    fontWeight: '800',
  },
  remaining: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '900',
  },
  chevron: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -9,
  },
});
