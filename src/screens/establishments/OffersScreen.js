import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useApp } from '../../context/AppContext';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import Screen from '../../components/Screen';
import VoucherCard from '../../components/VoucherCard';

export default function OffersScreen({ navigation, route }) {
  const { theme, vouchers, establishments, notificationError } = useApp();
  const requestedId = route.params?.voucherId;
  const ordered = useMemo(() => [...vouchers].sort((a, b) => {
    if (a.id === requestedId) return -1;
    if (b.id === requestedId) return 1;
    return (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0);
  }), [requestedId, vouchers]);

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader centered title="Offers" onBack={() => goToDashboard(navigation)} backLabel="Back to dashboard" />
      <Text style={[styles.heading, { color: theme.colors.text }]}>Available Vouchers</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Approved offers from Naga City establishments.</Text>
      {notificationError ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.danger }]}>{notificationError}</Text> : null}
      {ordered.length ? ordered.map((voucher) => {
        const establishment = establishments.find((item) => item.dashboardId === voucher.establishmentId);
        return (
          <VoucherCard
            key={voucher.id}
            voucher={voucher}
            onPress={establishment ? () => navigation.navigate('EstablishmentDetails', { establishmentId: establishment.dashboardId }) : undefined}
          />
        );
      }) : (
        <EmptyState
          icon="pricetag-outline"
          title="No active offers right now"
          description="New approved vouchers will appear here when establishments publish them."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 10 },
  heading: { fontSize: 20, lineHeight: 27, fontWeight: '900' },
  subtitle: { marginTop: 5, marginBottom: 18, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  error: { marginBottom: 12, fontSize: 12, lineHeight: 18, fontWeight: '700' },
});
