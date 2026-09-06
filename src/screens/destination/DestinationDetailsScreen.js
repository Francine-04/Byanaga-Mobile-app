import React, { useState } from 'react';
import { Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { goToDashboard, goToMain } from '../../components/AppHeader';
import AppButton from '../../components/AppButton';
import CategoryChip from '../../components/CategoryChip';
import PlaceholderImage from '../../components/PlaceholderImage';
import Rating from '../../components/Rating';
import Screen from '../../components/Screen';

const tabs = ['Overview', 'Photos', 'Reviews', 'Nearby'];

export default function DestinationDetailsScreen({ navigation, route }) {
  const { theme, bookmarks, toggleBookmark, destinations, weather } = useApp();
  const destination = route.params?.destination || destinations[0];
  const [message, setMessage] = useState('');
  const bookmarked = bookmarks.includes(destination.id);
  const share = async () => {
    try { await Share.share({ message: destination.name + ' - Naga City, BYANAGA' }); }
    catch { setMessage('Sharing is not available on this device.'); }
  };
  const hasPhone = typeof destination.contact === 'string' && /^\+?[\d\s()-]{7,}$/.test(destination.contact);
  const openSection = (tab) => {
    const screen = { Photos: 'DestinationPhotos', Reviews: 'Reviews', Nearby: 'NearbyPlaces' }[tab];
    if (screen) navigation.navigate(screen, { destination });
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.heroWrap}>
        <PlaceholderImage image={destination.image} label="Destination placeholder" aspectRatio={1.54} style={styles.hero}>
          <View style={styles.dots}>
            {[0, 1, 2, 3, 4].map((dot) => (
              <View
                key={dot}
                style={[styles.dot, { backgroundColor: dot === 0 ? theme.colors.primary : theme.colors.border }]}
              />
            ))}
          </View>
        </PlaceholderImage>
        <View style={styles.heroActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to dashboard"
            onPress={() => goToDashboard(navigation)}
            style={[styles.heroButton, { backgroundColor: theme.colors.surface }]}
          >
            <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
          </Pressable>
          <View style={styles.heroRightActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Bookmark destination"
              onPress={() => toggleBookmark(destination.id)}
              style={[styles.heroButton, { backgroundColor: theme.colors.surface }]}
            >
              <Ionicons name={bookmarked ? 'heart' : 'heart-outline'} size={20} color={theme.colors.primary} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share destination"
              onPress={share}
              style={[styles.heroButton, { backgroundColor: theme.colors.surface }]}
            >
              <Ionicons name="share-social-outline" size={19} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{destination.name}</Text>
        <Text style={[styles.category, { color: theme.colors.textMuted }]}>{destination.category || destination.cuisine}</Text>
        <View style={styles.ratingRow}>
          <Rating value={destination.rating} label="sample rating" />
          <Text style={[styles.meta, { color: theme.colors.textMuted }]}>{destination.distance}</Text>
          <Text style={[styles.meta, { color: theme.colors.textMuted }]}>{destination.estimatedVisitTime}</Text>
          <View style={[styles.openBadge, { backgroundColor: theme.colors.primarySoft }]}>
            <Text style={[styles.openText, { color: theme.colors.primary }]}>Sample details</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Action icon="map-outline" label="Map" onPress={() => goToMain(navigation, 'Heatmap')} />
        <Action icon="call-outline" label="Call" disabled={!hasPhone} onPress={() => Linking.openURL('tel:' + destination.contact).catch(() => setMessage('Unable to open a phone app.'))} />
        <Action icon={bookmarked ? 'heart' : 'heart-outline'} label="Save" onPress={() => toggleBookmark(destination.id)} />
        <Action icon="share-social-outline" label="Share" onPress={share} />
      </View>

      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <CategoryChip key={tab} label={tab} selected={tab === 'Overview'} onPress={() => openSection(tab)} />
        ))}
      </View>

      <View style={styles.infoCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>About</Text>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>{destination.description || 'A sample local dining stop for your Naga City itinerary.'}</Text>
        <Info icon="time-outline" label="Opening Hours" value={destination.openingHours} />
        <Info icon="ticket-outline" label="Entrance Fee" value={destination.entranceFee} />
        <Info icon="sunny-outline" label="Best Time to Visit" value={destination.bestTime} />
        <Info icon="partly-sunny-outline" label="Weather" value={destination.weather === 'Naga City weather' ? `${weather.temperatureLabel}, ${weather.condition}` : destination.weather} />
      </View>
      {message ? <Text accessibilityRole="alert" style={[styles.description, { color: theme.colors.textMuted }]}>{message}</Text> : null}
      <AppButton title="Add to Itinerary" onPress={() => navigation.navigate('CreateItinerary', { place: destination })} style={styles.addButton} />
    </Screen>
  );
}

function Action({ icon, label, onPress, disabled }) {
  const { theme } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={disabled ? label + ' unavailable: no contact number provided' : label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.action, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, opacity: disabled ? 0.5 : 1 }]}
    >
      <Ionicons name={icon} size={18} color={theme.colors.primary} />
      <Text style={[styles.actionText, { color: theme.colors.text }]}>{label}</Text>
    </Pressable>
  );
}

function Info({ icon, label, value }) {
  const { theme } = useApp();
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={17} color={theme.colors.textMuted} style={styles.infoIcon} />
      <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.colors.text }]}>
        {value || 'Not provided'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 10,
  },
  heroWrap: {
    marginHorizontal: 0,
  },
  hero: {
    width: '100%',
  },
  heroActions: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  heroButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  titleBlock: {
    marginTop: 16,
  },
  title: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900',
  },
  category: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '800',
  },
  ratingRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  meta: {
    fontSize: 12,
    fontWeight: '800',
  },
  openBadge: {
    minHeight: 24,
    borderRadius: 999,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  openText: {
    fontSize: 11,
    fontWeight: '900',
  },
  actionRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  action: {
    flex: 1,
    minHeight: 62,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '900',
  },
  tabs: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoCard: {
    marginTop: 6,
    paddingVertical: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '900',
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  infoRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 24,
  },
  infoLabel: {
    width: 116,
    fontSize: 11,
    fontWeight: '900',
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '800',
  },
  addButton: {
    marginTop: 14,
  },
});
