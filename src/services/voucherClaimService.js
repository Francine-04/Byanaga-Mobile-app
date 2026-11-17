import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  onSnapshot,
  increment,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebaseApp';

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

  // Check if voucher exists and is available
  const voucherRef = doc(db, VOUCHERS_COLLECTION, voucherId);
  const voucherSnap = await getDoc(voucherRef);

  if (!voucherSnap.exists()) {
    throw new Error('Voucher not found');
  }

  const voucher = voucherSnap.data();

  // Check if voucher is approved
  if (voucher.status !== 'approved') {
    throw new Error('This voucher is not available');
  }

  // Check if voucher has expired
  const now = new Date();
  if (voucher.validUntil) {
    const validUntil = voucher.validUntil.toDate ? voucher.validUntil.toDate() : new Date(voucher.validUntil);
    if (validUntil < now) {
      throw new Error('This voucher has expired');
    }
  }

  // Check if user already claimed this voucher
  const existingClaimQuery = query(
    collection(db, VOUCHER_CLAIMS_COLLECTION),
    where('voucherId', '==', voucherId),
    where('userId', '==', userId)
  );
  const existingClaimSnap = await getDocs(existingClaimQuery);

  if (!existingClaimSnap.empty) {
    throw new Error('You have already claimed this voucher');
  }

  // Check if claim limit reached (check both field names for compatibility)
  const currentClaimCount = voucher.claimedCount || voucher.claimCount || 0;
  const maxLimit = voucher.maxClaimLimit || voucher.claimLimit || 0;
  
  if (maxLimit > 0 && currentClaimCount >= maxLimit) {
    throw new Error('This voucher has reached its claim limit');
  }

  // Create the claim
  const claimData = {
    voucherId,
    userId,
    voucherTitle: voucher.title || 'Voucher',
    voucherCode: voucher.code || generateClaimCode(),
    establishmentId: voucher.establishmentId || null,
    establishmentName: voucher.establishmentName || 'General Offer',
    discount: voucher.discount || '',
    description: voucher.description || '',
    validUntil: voucher.validUntil || null, // This will be a Timestamp if from Firestore
    claimedAt: serverTimestamp(),
    usedAt: null,
    status: 'active', // active, used, expired
    claimCode: generateClaimCode(), // Unique claim code for this user
  };

  const claimRef = await addDoc(collection(db, VOUCHER_CLAIMS_COLLECTION), claimData);

  // Update voucher claimed count (update both fields for compatibility)
  console.log('Updating voucher claim count in Firebase...');
  await updateDoc(voucherRef, {
    claimedCount: increment(1),
    claimCount: increment(1),
    updatedAt: serverTimestamp(),
  });
  console.log('Voucher claim count updated successfully');

  return {
    id: claimRef.id,
    ...claimData,
    claimedAt: new Date(),
  };
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
    usedAt: serverTimestamp(),
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
 * Generate a unique claim code
 * @returns {string} A 8-character alphanumeric code
 */
function generateClaimCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
