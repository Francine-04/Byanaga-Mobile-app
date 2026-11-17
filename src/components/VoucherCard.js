import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { claimVoucher } from '../services/voucherClaimService';
import AppCard from './AppCard';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from './ConfirmDialog.web';

export default function VoucherCard({ voucher, onPress, horizontal = false, style, showClaimButton = false }) {
  const { theme, firebaseUser, isGuestMode, claimedVouchers } = useApp();
  const [claiming, setClaiming] = useState(false);
  const { confirm, dialogState, closeDialog } = useConfirm();

  // Check if user has already claimed this voucher
  const hasClaimed = claimedVouchers?.some((claim) => claim.voucherId === voucher.id);

  const handleClaim = async (e) => {
    console.log('=== CLAIM BUTTON PRESSED ===');
    console.log('Voucher ID:', voucher.id);
    console.log('Is Guest:', isGuestMode);
    console.log('Firebase User:', firebaseUser?.uid);
    console.log('Has Claimed:', hasClaimed);
    
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (isGuestMode || !firebaseUser || firebaseUser.isAnonymous) {
      console.log('Login required - showing alert');
      Alert.alert('Login Required', 'Please log in to claim vouchers.');
      return;
    }

    if (hasClaimed) {
      console.log('Already claimed - showing alert');
      Alert.alert('Already Claimed', 'You have already claimed this voucher. Check My Vouchers to view it.');
      return;
    }

    console.log('Showing claim confirmation dialog');
    confirm(
      'Claim Voucher',
      `Do you want to claim "${voucher.title}"? You can view it later in My Vouchers.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => console.log('Claim cancelled') },
        {
          text: 'Claim',
          onPress: async () => {
            console.log('User confirmed claim');
            setClaiming(true);
            try {
              console.log('Calling claimVoucher service...');
              await claimVoucher(voucher.id, firebaseUser.uid);
              console.log('Claim successful!');
              Alert.alert('Success', 'Voucher claimed! Check My Vouchers to view your claim.');
            } catch (error) {
              console.error('Claim error:', error);
              Alert.alert('Error', error?.message || 'Failed to claim voucher');
            } finally {
              setClaiming(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.cardWrapper, horizontal && styles.horizontalCard, style]}>
      <AppCard
        accessibilityLabel={`Open offer ${voucher.title}`}
        onPress={showClaimButton ? undefined : onPress}
        style={[styles.card, { borderColor: theme.colors.accent }]}
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
          <Text style={[styles.remaining, { color: theme.colors.secondary }]}>
          {(() => {
            const maxLimit = voucher.maxClaimLimit || voucher.claimLimit || 0;
            const claimed = voucher.claimedCount || voucher.claimCount || 0;
            const remaining = Math.max(0, maxLimit - claimed);
            return `${remaining} left to claim`;
          })()}
        </Text>
        </View>
        {!showClaimButton && (
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textSoft} style={styles.chevron} />
        )}
      </AppCard>
      
      {showClaimButton && (
        <TouchableOpacity
          onPress={() => {
            console.log('TouchableOpacity onPress triggered');
            handleClaim();
          }}
          disabled={claiming || hasClaimed}
          activeOpacity={0.7}
          style={[
            styles.claimButton,
            {
              backgroundColor: hasClaimed ? theme.colors.successSoft : theme.colors.primary,
              opacity: claiming ? 0.6 : 1,
            },
          ]}
        >
          <Ionicons
            name={hasClaimed ? 'checkmark-circle' : 'ticket'}
            size={18}
            color={hasClaimed ? theme.colors.success : '#FFFFFF'}
          />
          <Text
            selectable={false}
            style={[
              styles.claimButtonText,
              { color: hasClaimed ? theme.colors.success : '#FFFFFF' },
            ]}
          >
            {hasClaimed ? 'Claimed' : claiming ? 'Claiming...' : 'Claim Voucher'}
          </Text>
        </TouchableOpacity>
      )}
      
      {Platform.OS === 'web' && (
        <ConfirmDialog
          visible={dialogState.visible}
          title={dialogState.title}
          message={dialogState.message}
          buttons={dialogState.buttons}
          onClose={closeDialog}
        />
      )}
    </View>
  );
}

function formatDate(value) {
  if (!(value instanceof Date)) return 'date unavailable';
  return value.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' });
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    marginBottom: 12,
  },
  card: {
    minHeight: 138,
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
  claimButton: {
    marginTop: 8,
    marginHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 48,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 8,
  },
  chevron: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -9,
  },
});
