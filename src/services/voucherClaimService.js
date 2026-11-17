import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  onSnapshot,
  runTransaction,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from './firebaseApp';

const VOUCHER_CLAIMS_COLLECTION = 'voucher_claims';
const VOUCHERS_COLLECTION = 'vouchers';

/**
 * Claim a voucher for a user
 * @param {string} voucherId - The voucher ID to claim
 * @param {string} userId - The user ID claiming the voucher
 * @returns {Promise<Object>} The created claim object
 * @throws {Error} If user is not authenticated, voucher doesn't exist, or claim limit reached
 */
export async function claimVoucher(voucherId, userId) {
  if (!voucherId || !userId) {
    throw new Error('Voucher ID and User ID are required');
  }

  if (auth.currentUser?.uid !== userId || auth.currentUser?.isAnonymous) {
    throw new Error('Please sign in again to claim this voucher');
  }

  // Preserve compatibility with claims written by earlier app versions.
  const existingClaimQuery = query(collection(db, VOUCHER_CLAIMS_COLLECTION),
    where('voucherId', '==', voucherId), where('userId', '==', userId));
  const legacyDashboardQuery = query(collection(db, VOUCHER_CLAIMS_COLLECTION),
    where('voucherId', '==', voucherId), where('touristId', '==', userId));
  const [mobileClaims, dashboardClaims] = await Promise.all([getDocs(existingClaimQuery), getDocs(legacyDashboardQuery)]);
  if (!mobileClaims.empty || !dashboardClaims.empty) throw new Error('You have already claimed this voucher');

  const voucherRef = doc(db, VOUCHERS_COLLECTION, voucherId);
  const claimRef = doc(db, VOUCHER_CLAIMS_COLLECTION, `${voucherId}_${userId}`);
  const claimCode = doc(collection(db, VOUCHER_CLAIMS_COLLECTION)).id.toUpperCase();
  return runTransaction(db, async (transaction) => {
    const voucherSnap = await transaction.get(voucherRef);
    const claimSnap = await transaction.get(claimRef);
    if (!voucherSnap.exists()) throw new Error('Voucher not found');
    if (claimSnap.exists()) throw new Error('You have already claimed this voucher');
    const voucher = voucherSnap.data();
    if (voucher.status !== 'approved' && voucher.status !== 'active') throw new Error('This voucher is not available');
    const now = new Date();
    const validFrom = voucher.validFrom?.toDate?.() || new Date(voucher.validFrom);
    const validUntil = voucher.validUntil?.toDate?.() || new Date(voucher.validUntil);
    if (!Number.isFinite(validFrom.getTime()) || validFrom > now || !Number.isFinite(validUntil.getTime()) || validUntil < now) {
      throw new Error('This voucher is not currently valid');
    }
    const count = Number(voucher.claimCount ?? voucher.claimedCount ?? 0);
    const limit = Number(voucher.maxClaimLimit ?? voucher.claimLimit ?? 0);
    if (!Number.isInteger(limit) || limit < 1 || !Number.isInteger(count) || count < 0 || count >= limit) {
      throw new Error('This voucher has reached its claim limit');
    }
    const claimData = {
      voucherId, userId, touristId: userId,
      voucherTitle: voucher.title || 'Voucher',
      voucherCode: claimCode, claimCode,
      establishmentId: voucher.establishmentId || null,
      establishmentName: voucher.establishmentName || 'General Offer',
      discount: voucher.discount || (voucher.discountType === 'fixed' ? `PHP ${voucher.discountValue} OFF` : `${voucher.discountValue}% OFF`),
      description: voucher.description || '', validUntil: voucher.validUntil,
      claimedAt: serverTimestamp(), usedAt: null, isRedeemed: false, status: 'active',
    };
    transaction.set(claimRef, claimData);
    transaction.update(voucherRef, { claimCount: count + 1, claimedCount: count + 1, updatedAt: serverTimestamp() });
    return { id: claimRef.id, ...claimData, claimedAt: now };
  });
}

/**
 * Mark a claimed voucher as used
 * @param {string} claimId - The claim ID
 * @param {string} userId - The user ID (for verification)
 * @returns {Promise<void>}
 */
export async function markVoucherAsUsed(claimId, userId) {
  if (!claimId || !userId) {
    throw new Error('Claim ID and User ID are required');
  }

  const claimRef = doc(db, VOUCHER_CLAIMS_COLLECTION, claimId);
  const claimSnap = await getDoc(claimRef);

  if (!claimSnap.exists()) {
    throw new Error('Claim not found');
  }

  const claim = claimSnap.data();

  // Verify ownership
  if (claim.userId !== userId) {
    throw new Error('Unauthorized');
  }

  // Check if already used
  if (claim.status === 'used') {
    throw new Error('This voucher has already been used');
  }

  // Mark as used
  await updateDoc(claimRef, {
    status: 'used',
    isRedeemed: true,
    usedAt: serverTimestamp(),
    redeemedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Subscribe to user's claimed vouchers
 * @param {string} userId - The user ID
 * @param {Function} onData - Callback with claimed vouchers
 * @param {Function} onError - Error callback
 * @returns {Function} Unsubscribe function
 */
export function subscribeToUserVoucherClaims(userId, onData, onError) {
  if (!userId) {
    onData([]);
    return () => {};
  }

  const claimsQuery = query(
    collection(db, VOUCHER_CLAIMS_COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(
    claimsQuery,
    (snapshot) => {
      const claims = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          claimedAt: data.claimedAt?.toDate ? data.claimedAt.toDate() : null,
          usedAt: data.usedAt?.toDate ? data.usedAt.toDate() : null,
          validUntil: data.validUntil?.toDate ? data.validUntil.toDate() : null,
        };
      });

      // Sort by claimed date (newest first)
      claims.sort((a, b) => {
        const aTime = a.claimedAt?.getTime() || 0;
        const bTime = b.claimedAt?.getTime() || 0;
        return bTime - aTime;
      });

      onData(claims);
    },
    onError
  );
}

/**
 * Get a specific claim by ID
 * @param {string} claimId - The claim ID
 * @param {string} userId - The user ID (for verification)
 * @returns {Promise<Object>} The claim object
 */
export async function getVoucherClaim(claimId, userId) {
  if (!claimId || !userId) {
    throw new Error('Claim ID and User ID are required');
  }

  const claimRef = doc(db, VOUCHER_CLAIMS_COLLECTION, claimId);
  const claimSnap = await getDoc(claimRef);

  if (!claimSnap.exists()) {
    throw new Error('Claim not found');
  }

  const claim = claimSnap.data();

  // Verify ownership
  if (claim.userId !== userId) {
    throw new Error('Unauthorized');
  }

  return {
    id: claimSnap.id,
    ...claim,
    claimedAt: claim.claimedAt?.toDate ? claim.claimedAt.toDate() : null,
    usedAt: claim.usedAt?.toDate ? claim.usedAt.toDate() : null,
    validUntil: claim.validUntil?.toDate ? claim.validUntil.toDate() : null,
  };
}

/**
 * Check if user has claimed a specific voucher
 * @param {string} voucherId - The voucher ID
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} True if claimed
 */
export async function hasUserClaimedVoucher(voucherId, userId) {
  if (!voucherId || !userId) {
    return false;
  }

  const claimQuery = query(
    collection(db, VOUCHER_CLAIMS_COLLECTION),
    where('voucherId', '==', voucherId),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(claimQuery);
  return !snapshot.empty;
}

/**
 * Claim codes are generated from Firestore's random document IDs inside claimVoucher.
 */
