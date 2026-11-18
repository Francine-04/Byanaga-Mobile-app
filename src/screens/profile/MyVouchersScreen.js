import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import AppCard from '../../components/AppCard';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import Screen from '../../components/Screen';
import VoucherProofModal from '../../components/VoucherProofModal';

export default function MyVouchersScreen({ navigation }) {
  const { theme, claimedVouchers, isGuestMode } = useApp();
  const [activeTab, setActiveTab] = useState('active'); // active or used
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [showProof, setShowProof] = useState(false);

  // Filter vouchers by status
  const { activeVouchers, usedVouchers } = useMemo(() => {
    const now = new Date();
    const active = [];
    const used = [];

    claimedVouchers.forEach((claim) => {
      if (claim.status === 'used') {
        used.push(claim);
      } else {
        // Check if expired
        if (claim.validUntil && new Date(claim.validUntil) < now) {
          // Still show in active but mark as expired
          active.push({ ...claim, isExpired: true });
        } else {
          active.push(claim);
        }
      }
    });

    return { activeVouchers: active, usedVouchers: used };
  }, [claimedVouchers]);

  const displayedVouchers = activeTab === 'active' ? activeVouchers : usedVouchers;

  const handleViewProof = (claim) => {
    setSelectedClaim(claim);
    setShowProof(true);
  };

  if (isGuestMode) {
    return (
      <Screen contentStyle={styles.content}>
        <AppHeader title="My Vouchers" onBack={() => navigation.goBack()} />
        <EmptyState
          icon="lock-closed-outline"
          title="Login Required"
          description="Please log in to view your claimed vouchers."
        />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader title="My Vouchers" onBack={() => navigation.goBack()} />

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          onPress={() => setActiveTab('active')}
          style={[
            styles.tab,
            activeTab === 'active' && styles.activeTab,
            { borderBottomColor: activeTab === 'active' ? theme.colors.primary : 'transparent' },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'active' ? theme.colors.primary : theme.colors.textMuted },
            ]}
          >
            Active ({activeVouchers.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('used')}
          style={[
            styles.tab,
            activeTab === 'used' && styles.activeTab,
            { borderBottomColor: activeTab === 'used' ? theme.colors.primary : 'transparent' },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'used' ? theme.colors.primary : theme.colors.textMuted },
            ]}
          >
            Used ({usedVouchers.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {displayedVouchers.length === 0 ? (
          <EmptyState
            icon={activeTab === 'active' ? 'ticket-outline' : 'checkmark-done-outline'}
            title={activeTab === 'active' ? 'No Active Vouchers' : 'No Used Vouchers'}
            description={
              activeTab === 'active'
                ? 'Claim vouchers from the Offers section to see them here.'
                : 'Vouchers you have redeemed will appear here.'
            }
            buttonTitle={activeTab === 'active' ? 'Browse Offers' : undefined}
            onPress={activeTab === 'active' ? () => navigation.navigate('Offers') : undefined}
          />
        ) : (
          displayedVouchers.map((claim) => (
            <ClaimedVoucherCard
              key={claim.id}
              claim={claim}
              onViewProof={() => handleViewProof(claim)}
              theme={theme}
            />
          ))
        )}
      </ScrollView>

      {/* Voucher Proof Modal */}
      <VoucherProofModal
        claim={selectedClaim}
        visible={showProof}
        onClose={() => setShowProof(false)}
        onMarkUsed={() => {
          // Refresh will happen automatically via subscription
        }}
      />
    </Screen>
  );
}

function ClaimedVoucherCard({ claim, onViewProof, theme }) {
  const isExpired = claim.isExpired || (claim.validUntil && new Date(claim.validUntil) < new Date());
  const isUsed = claim.status === 'used';

  return (
    <AppCard style={styles.voucherCard}>
      <View style={styles.voucherHeader}>
        <View style={styles.voucherInfo}>
          <Text style={[styles.voucherTitle, { color: theme.colors.text }]} numberOfLines={2}>
            {claim.voucherTitle}
          </Text>
          <Text style={[styles.establishmentName, { color: theme.colors.textMuted }]}>
            {claim.establishmentName}
          </Text>
        </View>
        {isUsed && (
          <View style={[styles.statusBadge, { backgroundColor: theme.colors.successSoft }]}>
            <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
            <Text style={[styles.statusText, { color: theme.colors.success }]}>Used</Text>
          </View>
        )}
        {isExpired && !isUsed && (
          <View style={[styles.statusBadge, { backgroundColor: theme.colors.dangerSoft }]}>
            <Ionicons name="time" size={14} color={theme.colors.danger} />
            <Text style={[styles.statusText, { color: theme.colors.danger }]}>Expired</Text>
          </View>
        )}
      </View>

      <View style={styles.discountRow}>
        <Ionicons name="pricetag" size={16} color={theme.colors.accent} />
        <Text style={[styles.discount, { color: theme.colors.accent }]}>{claim.discount}</Text>
      </View>

      {claim.description && (
        <Text style={[styles.description, { color: theme.colors.textMuted }]} numberOfLines={2}>
          {claim.description}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.dateInfo}>
          <Ionicons name="calendar-outline" size={12} color={theme.colors.textMuted} />
          <Text style={[styles.dateText, { color: theme.colors.textMuted }]}>
            {isUsed
              ? `Used ${formatDate(claim.usedAt)}`
              : `Claimed ${formatDate(claim.claimedAt)}`}
          </Text>
        </View>
        {!isUsed && (
          <Pressable onPress={onViewProof} style={styles.viewProofButton}>
            <Text style={[styles.viewProofText, { color: theme.colors.primary }]}>View Proof</Text>
            <Ionicons name="arrow-forward" size={14} color={theme.colors.primary} />
          </Pressable>
        )}
      </View>

      {claim.validUntil && !isUsed && !isExpired && (
        <View style={[styles.expiryBar, { backgroundColor: theme.colors.surfaceMuted }]}>
          <Ionicons name="time-outline" size={12} color={theme.colors.textMuted} />
          <Text style={[styles.expiryText, { color: theme.colors.textMuted }]}>
            Valid until {formatDate(claim.validUntil)}
          </Text>
        </View>
      )}
    </AppCard>
  );
}

function formatDate(date) {
  if (!date) return 'Unknown';
  const d = new Date(date);
  return d.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 10,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  activeTab: {},
  tabText: {
    fontSize: 13,
    fontWeight: '800',
  },
  voucherCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  voucherInfo: {
    flex: 1,
    paddingRight: 10,
  },
  voucherTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  establishmentName: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  discount: {
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 6,
  },
  description: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  viewProofButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewProofText: {
    fontSize: 12,
    fontWeight: '800',
    marginRight: 4,
  },
  expiryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  expiryText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 6,
  },
});
