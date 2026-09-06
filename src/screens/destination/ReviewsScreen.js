import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { sampleRatingCounts, sampleReviews } from '../../data/destinationExtras';
import AppHeader, { goToDashboard, goToMain } from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import PlaceholderImage from '../../components/PlaceholderImage';
import Screen from '../../components/Screen';
import SelectionSheet from '../../components/SelectionSheet';

export default function ReviewsScreen({ navigation, route }) {
  const { theme } = useApp();
  const id = route.params?.destination?.id;
  const [helpful, setHelpful] = useState([]);
  const [sort, setSort] = useState('Most helpful');
  const [sortOpen, setSortOpen] = useState(false);
  const reviews = useMemo(() => sampleReviews.filter((review) => review.destinationId === id).sort((a, b) =>
    sort === 'Newest' ? b.date.localeCompare(a.date) : sort === 'Highest rated' ? b.rating - a.rating : b.helpful - a.helpful), [id, sort]);
  const count = Object.values(sampleRatingCounts).reduce((total, value) => total + value, 0);
  const average = (Object.entries(sampleRatingCounts).reduce((total, [rating, value]) => total + Number(rating) * value, 0) / count).toFixed(1);
  return (
    <Screen contentStyle={styles.content}>
      <AppHeader centered title="Reviews" onBack={() => goToDashboard(navigation)} backLabel="Back to dashboard"
        rightIcon="options-outline" rightLabel="Sort reviews" onRightPress={() => setSortOpen(true)} />
      {reviews.length ? <>
        <View style={[styles.summary, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.score}>
            <Text style={[styles.average, { color: theme.colors.text }]}>{average}</Text>
            <Stars rating={5} size={15} />
            <Text style={[styles.count, { color: theme.colors.textMuted }]}>{count} sample reviews</Text>
          </View>
          <View style={styles.histogram}>
            {[5, 4, 3, 2, 1].map((rating) => <View key={rating} style={styles.barRow} accessibilityLabel={rating + ' stars, ' + sampleRatingCounts[rating] + ' reviews'}>
              <Text style={[styles.barLabel, { color: theme.colors.text }]}>{rating}</Text>
              <Ionicons name="star" size={10} color={theme.colors.primary} />
              <View style={[styles.track, { backgroundColor: theme.colors.surfaceMuted }]}><View style={[styles.fill, { backgroundColor: theme.colors.primary, width: (sampleRatingCounts[rating] / count * 100) + '%' }]} /></View>
              <Text style={[styles.barCount, { color: theme.colors.textMuted }]}>{sampleRatingCounts[rating]}</Text>
            </View>)}
          </View>
        </View>
        {reviews.map((review) => <View key={review.id} style={[styles.review, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.reviewHeader}>
            <PlaceholderImage image={review.image} label="Reviewer avatar placeholder" icon="person" iconSize={23} aspectRatio={1} style={styles.avatar} />
            <View style={styles.reviewer}><Text style={[styles.name, { color: theme.colors.text }]}>{review.name}</Text><Stars rating={review.rating} /></View>
          </View>
          <Text style={[styles.body, { color: theme.colors.text }]}>{review.text}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={'Helpful review by ' + review.name} accessibilityState={{ selected: helpful.includes(review.id) }}
            aria-pressed={helpful.includes(review.id)}
            onPress={() => setHelpful((current) => current.includes(review.id) ? current.filter((item) => item !== review.id) : [...current, review.id])} style={styles.helpful}>
            <Ionicons name={helpful.includes(review.id) ? 'thumbs-up' : 'thumbs-up-outline'} size={16} color={helpful.includes(review.id) ? theme.colors.primary : theme.colors.textMuted} />
            <Text style={[styles.helpfulText, { color: theme.colors.textMuted }]}>{review.helpful + (helpful.includes(review.id) ? 1 : 0)}</Text>
          </Pressable>
        </View>)}
      </> : <EmptyState icon="chatbubble-ellipses-outline" title="No reviews yet" description="Traveler reviews will appear here when they are available." buttonTitle="Explore Places" onPress={() => goToMain(navigation, 'Explore')} />}
      <SelectionSheet visible={sortOpen} title="Sort reviews" options={['Most helpful', 'Newest', 'Highest rated']} value={sort} onSelect={setSort} onClose={() => setSortOpen(false)} />
    </Screen>
  );
}
function Stars({ rating, size = 12 }) {
  const { theme } = useApp();
  return <View style={styles.stars} accessibilityLabel={rating + ' out of 5 stars'}>{[1, 2, 3, 4, 5].map((star) => <Ionicons key={star} name={star <= rating ? 'star' : 'star-outline'} size={size} color={theme.colors.accent} />)}</View>;
}
const styles = StyleSheet.create({
  content: { paddingTop: 8 }, summary: { flexDirection: 'row', alignItems: 'center', gap: 22, paddingVertical: 20, paddingBottom: 26, borderBottomWidth: StyleSheet.hairlineWidth },
  score: { width: 100 }, average: { fontSize: 44, lineHeight: 52, fontWeight: '700' }, stars: { flexDirection: 'row', gap: 3, marginTop: 5 }, count: { fontSize: 11, lineHeight: 16, marginTop: 7 },
  histogram: { flex: 1 }, barRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 4 }, barLabel: { width: 10, fontSize: 10 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 3 }, barCount: { fontSize: 10, textAlign: 'right', width: 24 },
  review: { paddingTop: 20, paddingBottom: 4, borderBottomWidth: StyleSheet.hairlineWidth }, reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 38, borderRadius: 19 }, reviewer: { flex: 1 }, name: { fontSize: 13, lineHeight: 20, fontWeight: '700' }, body: { fontSize: 14, lineHeight: 23, marginTop: 12 },
  helpful: { minWidth: 60, minHeight: 44, alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, helpfulText: { fontSize: 12 },
});
