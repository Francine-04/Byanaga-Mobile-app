import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useApp } from '../context/AppContext';
import { markVoucherAsUsed } from '../services/voucherClaimService';
import AppButton from './AppButton';

export default function VoucherProofModal({ claim, visible, onClose, onMarkUsed }) {
  const { theme, firebaseUser } = useApp();
  const [timeLeft, setTimeLeft] = useState('');
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (!visible || !claim?.validUntil) return;

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(claim.validUntil);
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m left`);
      } else {
        setTimeLeft(`${minutes}m left`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [visible, claim?.validUntil]);

  const handleMarkAsUsed = async () => {
    Alert.alert(
      'Mark as Used',
      'Have you already redeemed this voucher at the establishment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Mark Used',
          style: 'destructive',
          onPress: async () => {
            setMarking(true);
            try {
              await markVoucherAsUsed(claim.id, firebaseUser.uid);
              Alert.alert('Success', 'Voucher marked as used!');
              if (onMarkUsed) onMarkUsed();
              onClose();
            } catch (error) {
              Alert.alert('Error', error?.message || 'Failed to mark voucher as used');
            } finally {
              setMarking(false);
            }
          },
        },
      ]
    );
  };

  if (!claim || !visible) return null;

  const qrData = JSON.stringify({
    claimId: claim.id,
    claimCode: claim.claimCode,
    voucherId: claim.voucherId,
    userId: claim.userId,
    claimedAt: claim.claimedAt?.toISOString(),
  });

  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Voucher Proof</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={theme.colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* QR Code Section */}
          <View style={[styles.qrSection, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.qrContainer}>
              <QRCode
                value={qrData}
                size={200}
                backgroundColor="white"
                color={theme.colors.text}
              />
            </View>
            <Text style={[styles.qrLabel, { color: theme.colors.textMuted }]}>
              Show this QR code to the establishment
            </Text>
          </View>

          {/* Claim Code */}
          <View style={[styles.codeSection, { backgroundColor: theme.colors.primarySoft }]}>
            <Text style={[styles.codeLabel, { color: theme.colors.primary }]}>Claim Code</Text>
            <Text style={[styles.codeValue, { color: theme.colors.primary }]}>
              {claim.claimCode}
            </Text>
          </View>

          {/* Voucher Details */}
          <View style={[styles.detailsSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.voucherTitle, { color: theme.colors.text }]}>
              {claim.voucherTitle}
            </Text>
            
            <View style={styles.detailRow}>
              <Ionicons name="pricetag" size={16} color={theme.colors.accent} />
              <Text style={[styles.discount, { color: theme.colors.accent }]}>
                {claim.discount}
              </Text>
            </View>

            {claim.establishmentName && (
              <View style={styles.detailRow}>
                <Ionicons name="storefront" size={16} color={theme.colors.textMuted} />
                <Text style={[styles.detailText, { color: theme.colors.textMuted }]}>
                  {claim.establishmentName}
                </Text>
              </View>
            )}

            {claim.description && (
              <Text style={[styles.description, { color: theme.colors.textMuted }]}>
                {claim.description}
              </Text>
            )}

            {claim.validUntil && (
              <View style={styles.expirySection}>
                <Ionicons name="time" size={16} color={theme.colors.danger} />
                <Text style={[styles.expiryText, { color: theme.colors.danger }]}>
                  {timeLeft === 'Expired' ? 'Expired' : `Valid for ${timeLeft}`}
                </Text>
              </View>
            )}

            <View style={styles.claimedInfo}>
              <Text style={[styles.claimedLabel, { color: theme.colors.textMuted }]}>
                Claimed on {claim.claimedAt ? new Date(claim.claimedAt).toLocaleDateString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }) : 'Unknown'}
              </Text>
            </View>
          </View>

          {/* Instructions */}
          <View style={[styles.instructionsSection, { backgroundColor: theme.colors.surfaceMuted }]}>
            <Text style={[styles.instructionsTitle, { color: theme.colors.text }]}>
              How to Use:
            </Text>
            <View style={styles.instructionItem}>
              <Text style={[styles.instructionNumber, { color: theme.colors.primary }]}>1</Text>
              <Text style={[styles.instructionText, { color: theme.colors.textMuted }]}>
                Visit {claim.establishmentName || 'the establishment'}
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={[styles.instructionNumber, { color: theme.colors.primary }]}>2</Text>
              <Text style={[styles.instructionText, { color: theme.colors.textMuted }]}>
                Show this QR code or claim code to staff
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={[styles.instructionNumber, { color: theme.colors.primary }]}>3</Text>
              <Text style={[styles.instructionText, { color: theme.colors.textMuted }]}>
                Enjoy your discount!
              </Text>
            </View>
          </View>

          {/* Mark as Used Button */}
          {claim.status === 'active' && (
            <AppButton
              title="Mark as Used"
              onPress={handleMarkAsUsed}
              disabled={marking}
              variant="secondary"
              style={styles.markButton}
            />
          )}

          {claim.status === 'used' && (
            <View style={[styles.usedBadge, { backgroundColor: theme.colors.surfaceMuted }]}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={[styles.usedText, { color: theme.colors.success }]}>
                Used on {claim.usedAt ? new Date(claim.usedAt).toLocaleDateString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }) : 'Unknown'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    height: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  qrSection: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
  },
  qrLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  codeSection: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  codeValue: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 4,
  },
  detailsSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  voucherTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  discount: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  expirySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  expiryText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  claimedInfo: {
    marginTop: 12,
  },
  claimedLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  instructionsSection: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 24,
  },
  instructionText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  markButton: {
    marginBottom: 20,
  },
  usedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  usedText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
});
