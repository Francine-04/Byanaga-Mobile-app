import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db } from './firebaseApp';

const RATINGS_COLLECTION = 'business_ratings';

/**
 * Submit or update a rating for a business profile
 * @param {string} businessId - The business profile ID
 * @param {string} userId - The user ID (must be authenticated, non-guest)
 * @param {number} rating - Rating value (1-5)
 * @param {string} review - Optional review text
 * @returns {Promise<void>}
 * @throws {Error} If user is not authenticated or is a guest
 */
export async function submitBusinessRating(businessId, userId, rating, review = '') {
  if (!businessId || !userId) {
    throw new Error('Business ID and User ID are required');
  }
  
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  // Validate rating is an integer
  const validRating = Math.round(Number(rating));
  if (validRating < 1 || validRating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  // Check if user already rated this business
  const existingQuery = query(
    collection(db, RATINGS_COLLECTION),
    where('businessId', '==', businessId),
    where('userId', '==', userId)
  );
  
  const existingSnapshot = await getDocs(existingQuery);
  
  const ratingData = {
    businessId,
    userId,
    rating: validRating,
    review: String(review || '').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!existingSnapshot.empty) {
    // Update existing rating
    const ratingDoc = existingSnapshot.docs[0];
    await updateDoc(doc(db, RATINGS_COLLECTION, ratingDoc.id), {
      rating: ratingData.rating,
      review: ratingData.review,
      updatedAt: ratingData.updatedAt,
    });
  } else {
    // Create new rating
    await addDoc(collection(db, RATINGS_COLLECTION), ratingData);
  }

  // Recalculate business average rating
  await recalculateBusinessRating(businessId);
}

/**
 * Delete a user's rating for a business
 * @param {string} businessId - The business profile ID
 * @param {string} userId - The user ID
 * @returns {Promise<void>}
 */
export async function deleteBusinessRating(businessId, userId) {
  const ratingQuery = query(
    collection(db, RATINGS_COLLECTION),
    where('businessId', '==', businessId),
    where('userId', '==', userId)
  );
  
  const snapshot = await getDocs(ratingQuery);
  
  if (!snapshot.empty) {
    await deleteDoc(doc(db, RATINGS_COLLECTION, snapshot.docs[0].id));
    await recalculateBusinessRating(businessId);
  }
}

/**
 * Get user's rating for a specific business
 * @param {string} businessId - The business profile ID
 * @param {string} userId - The user ID
 * @returns {Promise<object|null>}
 */
export async function getUserBusinessRating(businessId, userId) {
  if (!businessId || !userId) return null;

  const ratingQuery = query(
    collection(db, RATINGS_COLLECTION),
    where('businessId', '==', businessId),
    where('userId', '==', userId)
  );
  
  const snapshot = await getDocs(ratingQuery);
  
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  };
}

/**
 * Subscribe to all ratings for a business
 * @param {string} businessId - The business profile ID
 * @param {function} onData - Callback with ratings array
 * @param {function} onError - Error callback
 * @returns {function} Unsubscribe function
 */
export function subscribeToBusinessRatings(businessId, onData, onError) {
  const ratingsQuery = query(
    collection(db, RATINGS_COLLECTION),
    where('businessId', '==', businessId)
  );
  
  return onSnapshot(
    ratingsQuery,
    (snapshot) => {
      const ratings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      onData(ratings);
    },
    onError
  );
}

/**
 * Recalculate and update business average rating
 * @param {string} businessId - The business profile ID
 * @returns {Promise<void>}
 */
async function recalculateBusinessRating(businessId) {
  const ratingsQuery = query(
    collection(db, RATINGS_COLLECTION),
    where('businessId', '==', businessId)
  );
  
  const snapshot = await getDocs(ratingsQuery);
  
  if (snapshot.empty) {
    // No ratings - set to null
    await updateDoc(doc(db, 'business_profiles', businessId), {
      averageRating: null,
      ratingCount: 0,
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  // Calculate accurate average rating
  const ratings = snapshot.docs.map(doc => {
    const rating = doc.data().rating;
    // Ensure rating is a valid number between 1-5
    return Math.min(5, Math.max(1, Number(rating) || 0));
  }).filter(r => r > 0); // Filter out invalid ratings
  
  if (ratings.length === 0) {
    // No valid ratings
    await updateDoc(doc(db, 'business_profiles', businessId), {
      averageRating: null,
      ratingCount: 0,
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  const sum = ratings.reduce((total, rating) => total + rating, 0);
  const average = sum / ratings.length;
  
  // Update business profile with new average (rounded to 1 decimal place)
  await updateDoc(doc(db, 'business_profiles', businessId), {
    averageRating: Number(average.toFixed(1)),
    ratingCount: ratings.length,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Get all ratings with user info
 * @param {string} businessId - The business profile ID
 * @returns {Promise<Array>}
 */
export async function getBusinessRatingsWithUsers(businessId) {
  const ratingsQuery = query(
    collection(db, RATINGS_COLLECTION),
    where('businessId', '==', businessId)
  );
  
  const snapshot = await getDocs(ratingsQuery);
  
  const ratingsWithUsers = await Promise.all(
    snapshot.docs.map(async (ratingDoc) => {
      const ratingData = ratingDoc.data();
      
      // Get user info (safely)
      let userName = 'Anonymous User';
      try {
        const userDoc = await getDocs(
          query(collection(db, 'users'), where('__name__', '==', ratingData.userId))
        );
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          userName = userData.displayName || userData.name || 'Tourist';
        }
      } catch (e) {
        console.warn('Could not fetch user info:', e);
      }

      return {
        id: ratingDoc.id,
        ...ratingData,
        userName,
      };
    })
  );

  return ratingsWithUsers.sort((a, b) => 
    new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
  );
}
