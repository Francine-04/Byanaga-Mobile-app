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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebaseApp';

// Separate collection for ratings - DOES NOT touch business_profiles!
const RATINGS_COLLECTION = 'establishment_ratings';

/**
 * Submit or update a rating for a business profile
 * NOTE: This ONLY writes to establishment_ratings collection
 * It does NOT modify the business_profiles collection at all
 * 
 * @param {string} businessId - The business profile ID (dashboardId)
 * @param {string} userId - The user ID (must be authenticated, non-guest)
 * @param {number} rating - Rating value (1-5)
 * @param {string} review - Optional review text
 * @returns {Promise<void>}
 */
export async function submitBusinessRating(businessId, userId, rating, review = '') {
  if (!businessId || !userId) {
    throw new Error('Business ID and User ID are required');
  }
  
  // Validate rating is an integer between 1-5
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
  
  if (!existingSnapshot.empty) {
    // Update existing rating
    const ratingDoc = existingSnapshot.docs[0];
    await updateDoc(doc(db, RATINGS_COLLECTION, ratingDoc.id), {
      rating: validRating,
      review: String(review || '').trim(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Create new rating
    await addDoc(collection(db, RATINGS_COLLECTION), {
      businessId,
      userId,
      rating: validRating,
      review: String(review || '').trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // That's it! We don't touch business_profiles at all
}

/**
 * Get user's rating for a specific business
 */
export async function getUserBusinessRating(businessId, userId) {
  if (!businessId || !userId) {
    return null;
  }

  const ratingsQuery = query(
    collection(db, RATINGS_COLLECTION),
    where('businessId', '==', businessId),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(ratingsQuery);

  if (snapshot.empty) {
    return null;
  }

  const docSnap = snapshot.docs[0];
  const data = docSnap.data();

  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
  };
}

/**
 * Get all ratings for a business with user information
 */
export async function getBusinessRatingsWithUsers(businessId) {
  if (!businessId) {
    return [];
  }

  const ratingsQuery = query(
    collection(db, RATINGS_COLLECTION),
    where('businessId', '==', businessId)
  );

  const snapshot = await getDocs(ratingsQuery);

  // Fetch user names for all ratings
  const ratingsWithUsers = await Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      
      // Fetch user name from users collection
      let userName = 'Tourist';
      try {
        const userDocRef = doc(db, 'users', data.userId);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          userName = userData.name || userData.displayName || userData.email?.split('@')[0] || 'Tourist';
        }
      } catch (error) {
        console.error('Error fetching user name for', data.userId, ':', error);
      }
      
      return {
        id: docSnap.id,
        ...data,
        userName,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
      };
    })
  );

  // Sort by date (newest first)
  ratingsWithUsers.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

  return ratingsWithUsers;
}

/**
 * Calculate average rating and count for a business from the ratings collection
 * This is called when displaying establishments in mobile
 */
export async function calculateBusinessRating(businessId) {
  if (!businessId) {
    return { averageRating: null, ratingCount: 0 };
  }

  const ratingsQuery = query(
    collection(db, RATINGS_COLLECTION),
    where('businessId', '==', businessId)
  );

  const snapshot = await getDocs(ratingsQuery);

  if (snapshot.empty) {
    return { averageRating: null, ratingCount: 0 };
  }

  const ratings = snapshot.docs
    .map(docSnap => Math.min(5, Math.max(1, Number(docSnap.data().rating) || 0)))
    .filter(r => r > 0);

  if (ratings.length === 0) {
    return { averageRating: null, ratingCount: 0 };
  }

  const sum = ratings.reduce((total, rating) => total + rating, 0);
  const average = sum / ratings.length;

  return {
    averageRating: Number(average.toFixed(1)),
    ratingCount: ratings.length,
  };
}

/**
 * Subscribe to ratings changes for a business (real-time)
 * Returns calculated average and count without touching business_profiles
 */
export function subscribeToBusinessRatings(businessId, onRatingsChange) {
  if (!businessId) {
    onRatingsChange({ averageRating: null, ratingCount: 0 });
    return () => {};
  }

  const ratingsQuery = query(
    collection(db, RATINGS_COLLECTION),
    where('businessId', '==', businessId)
  );

  return onSnapshot(ratingsQuery, (snapshot) => {
    if (snapshot.empty) {
      onRatingsChange({ averageRating: null, ratingCount: 0 });
      return;
    }

    const ratings = snapshot.docs
      .map(docSnap => Math.min(5, Math.max(1, Number(docSnap.data().rating) || 0)))
      .filter(r => r > 0);

    if (ratings.length === 0) {
      onRatingsChange({ averageRating: null, ratingCount: 0 });
      return;
    }

    const sum = ratings.reduce((total, rating) => total + rating, 0);
    const average = sum / ratings.length;

    onRatingsChange({
      averageRating: Number(average.toFixed(1)),
      ratingCount: ratings.length,
    });
  });
}
