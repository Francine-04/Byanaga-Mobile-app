import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import AppButton from './AppButton';
import AppCard from './AppCard';

export default function RatingInput({ establishmentId, establishmentName, currentRating, onSubmit, onCancel }) {
  const { theme, firebaseUser, isGuestMode } = useApp();
  const [rating, setRating] = useState(currentRating?.rating || 0);
  const [review, setReview] = useState(currentRating?.review || '');
  const [submitting, setSubmitting] = useState(false);

  // Check if user is registered (not guest and not anonymous)
  const isRegistered = !isGuestMode && firebaseUser && !firebaseUser.isAnonymous;

  const handleSubmit = async () => {
    if (!isRegistered) {
      Alert.alert('Login Required', 'Please log in to rate establishments.');
      return;
    }

    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(rating, review);
      Alert.alert('Success', 'Your rating has been submitted!');
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isRegistered) {
    return (
      <AppCard style={styles.card}>
        <View style={styles.guestMessage}>
          <Ionicons name="lock-closed-outline" size={24} color={theme.colors.textMuted} />
          <Text style={[styles.guestText, { color: theme.colors.textMuted }]}>
            Log in to rate and review {establishmentName}
          </Text>
        </View>
      </AppCard>
    );
  }

  return (
    <AppCard style={styles.card}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Rate Your Experience</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
        How would you rate {establishmentName}?
      </Text>
      
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${star} star${star === 1 ? '' : 's'}`}
            accessibilityState={{ selected: rating >= star }}
          >
            <Ionicons
              name={rating >= star ? 'star' : 'star-outline'}
              size={36}
              color={rating >= star ? theme.colors.accent : theme.colors.textSoft}
            />
          </Pressable>
        ))}
      </View>

      {rating > 0 && (
        <Text style={[styles.ratingLabel, { color: theme.colors.text }]}>
          {getRatingLabel(rating)}
        </Text>
      )}

      <TextInput
        value={review}
        onChangeText={setReview}
        placeholder="Share your experience (optional)"
        placeholderTextColor={theme.colors.textMuted}
        multiline
        numberOfLines={4}
        maxLength={500}
        style={[
          styles.reviewInput,
          {
            color: theme.colors.text,
            backgroundColor: theme.colors.surfaceMuted,
            borderColor: theme.colors.border,
          },
        ]}
        accessibilityLabel="Review text input"
      />

      <View style={styles.actions}>
        {onCancel && (
          <AppButton
            title="Cancel"
            onPress={onCancel}
            variant="secondary"
            style={styles.button}
            disabled={submitting}
          />
        )}
        <AppButton
          title={currentRating ? 'Update Rating' : 'Submit Rating'}
          onPress={handleSubmit}
          disabled={rating === 0 || submitting}
          style={styles.button}
        />
      </View>
    </AppCard>
  );
}

function getRatingLabel(rating) {
  const labels = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };
  return labels[rating] || '';
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  guestMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  guestText: {
    marginLeft: 10,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  starButton: {
    padding: 8,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  reviewInput: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    fontWeight: '600',
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
  },
});
