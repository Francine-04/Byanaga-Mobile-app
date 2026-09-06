import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { rankByPopularity } from '../../utils/popularityScore';
import AccommodationCard from '../../components/AccommodationCard';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import DestinationCard from '../../components/DestinationCard';
import EventCard from '../../components/EventCard';
import IconButton from '../../components/IconButton';
import MapPlaceholder from '../../components/MapPlaceholder';
import PlaceholderImage from '../../components/PlaceholderImage';
import RestaurantCard from '../../components/RestaurantCard';
import SectionHeader from '../../components/SectionHeader';
import WeatherHeroCard from '../../components/WeatherHeroCard';

export default function HomeScreen({ navigation }) {
  const {
    theme,
    isGuestMode,
    profile,
    bookmarks,
    toggleBookmark,
    tourismEvents,
    visibleNotifications,
    destinations,
    restaurants,
    accommodations,
    heatZones,
    weather,
    weatherError,
    refreshWeather,
  } = useApp();
  const featured = rankByPopularity(destinations).slice(0, 3);
  const homeEvents = tourismEvents.slice(0, 4);
  const unreadCount = visibleNotifications.filter((notification) => !notification.read).length;
  const [now, setNow] = useState(() => new Date());
  const firstName = useMemo(() => (isGuestMode ? 'Tourist' : getFirstName(profile)), [isGuestMode, profile]);
  const greeting = useMemo(() => getTimeGreeting(now), [now]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
            shadowColor: theme.colors.shadow,
          },
        ]}
      >
        <IconButton icon="menu-outline" label="Menu" onPress={() => navigation.navigate('Settings')} />
        <View
          accessible
          accessibilityLabel={`${toTitleCase(greeting)} ${firstName}!`}
          style={styles.greetingWrap}
        >
          <Text style={[styles.greeting, { color: theme.colors.text }]}>{greeting}</Text>
          <Text numberOfLines={1} style={[styles.name, { color: theme.colors.text }]}>{firstName}!</Text>
        </View>
        <View style={styles.headerActions}>
          <View>
            <IconButton icon="notifications-outline" label="Notifications" onPress={() => navigation.navigate('Notifications')} />
            {unreadCount ? (
              <View style={[styles.badge, { backgroundColor: theme.colors.danger }]}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => navigation.navigate('Profile')}>
            <PlaceholderImage label="Profile photo placeholder" icon="person" iconSize={24} aspectRatio={1} style={styles.avatar} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <WeatherHeroCard theme={theme} weather={weather} weatherError={weatherError} onRefresh={refreshWeather} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search destinations"
          onPress={() => navigation.navigate('Explore')}
          style={[styles.search, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} />
          <Text style={[styles.searchText, { color: theme.colors.textMuted }]}>Search destinations...</Text>
          <Ionicons name="options-outline" size={18} color={theme.colors.textMuted} />
        </Pressable>

        <SectionHeader title="Featured Destinations" onPress={() => navigation.navigate('Explore')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {featured.map((destination) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              compact
              showQuickAdd={false}
              bookmarked={bookmarks.includes(destination.id)}
              onBookmark={() => toggleBookmark(destination.id)}
              onQuickAdd={() => navigation.navigate('CreateItinerary')}
              onPress={() => navigation.navigate('DestinationDetails', { destination })}
            />
          ))}
        </ScrollView>

        <Text style={[styles.quickTitle, { color: theme.colors.text }]}>Quick Access</Text>
        <View style={styles.quickGrid}>
          <QuickAccess icon="leaf-outline" label="Heatmap" onPress={() => navigation.navigate('Heatmap')} />
          <QuickAccess icon="clipboard-outline" label="Smart Itinerary" onPress={() => navigation.navigate('SmartItinerary')} />
          <QuickAccess icon="calendar-outline" label="Events" onPress={() => navigation.navigate('Events')} />
          <QuickAccess icon="restaurant-outline" label="Restaurants" onPress={() => navigation.navigate('Restaurants')} />
        </View>

        <LinearGradient colors={theme.dark ? [theme.colors.surface, theme.colors.primarySoft] : [theme.colors.primarySoft, theme.colors.secondarySoft]} style={styles.exploreBanner}>
          <View style={styles.exploreCopy}>
            <Text style={[styles.exploreTitle, { color: theme.colors.text }]}>Explore Naga City</Text>
            <Text style={[styles.exploreText, { color: theme.colors.textMuted }]}>Discover more places, plan your itinerary and enjoy.</Text>
          </View>
          <View style={styles.exploreImageWrap}>
            <PlaceholderImage label="City Preview" aspectRatio={1.2} style={styles.exploreImage} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open explore"
              onPress={() => navigation.navigate('Explore')}
              style={[styles.exploreArrow, { backgroundColor: theme.colors.primary }]}
            >
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </LinearGradient>

        <SectionHeader title="Tourism Heatmap" onPress={() => navigation.navigate('Heatmap')} />
        <AppCard style={styles.mapCard}>
          <MapPlaceholder zones={heatZones} style={styles.mapPreview} />
          <View style={styles.mapFooter}>
            <View>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Naga City Heatmap</Text>
              <Text style={[styles.cardCopy, { color: theme.colors.textMuted }]}>Crowd levels shown with labeled zones.</Text>
            </View>
            <AppButton title="Open" onPress={() => navigation.navigate('Heatmap')} style={styles.shortButton} />
          </View>
        </AppCard>

        <SectionHeader title="Smart Itinerary" onPress={() => navigation.navigate('SmartItinerary')} />
        <AppCard style={styles.smartCard}>
          <View style={[styles.smartIcon, { backgroundColor: theme.colors.primarySoft }]}>
            <Ionicons name="map-outline" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.smartBody}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Build a route in minutes</Text>
            <Text style={[styles.cardCopy, { color: theme.colors.textMuted }]}>
              Powered by Preference Matching & Route Optimization.
            </Text>
          </View>
          <AppButton title="Create" onPress={() => navigation.navigate('SmartItinerary')} style={styles.shortButton} />
        </AppCard>

        <SectionHeader title="Events This Week" onPress={() => navigation.navigate('Events')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {homeEvents.map((event) => (
            <EventCard key={event.id} event={event} showActions={false} />
          ))}
        </ScrollView>

        <SectionHeader title="Popular Restaurants" onPress={() => navigation.navigate('Restaurants')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} showActions={false} />
          ))}
        </ScrollView>

        <SectionHeader title="Accommodations" onPress={() => navigation.navigate('Accommodations')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {accommodations.map((accommodation) => (
            <AccommodationCard key={accommodation.id} accommodation={accommodation} showActions={false} />
          ))}
        </ScrollView>

        <SectionHeader title="Nearby Attractions" onPress={() => navigation.navigate('NearbyPlaces')} />
        {destinations.slice(0, 2).map((destination) => (
          <DestinationCard
            key={`nearby-${destination.id}`}
            destination={destination}
            horizontal
            bookmarked={bookmarks.includes(destination.id)}
            onBookmark={() => toggleBookmark(destination.id)}
            onQuickAdd={() => navigation.navigate('CreateItinerary')}
            onPress={() => navigation.navigate('DestinationDetails', { destination })}
          />
        ))}

        <View style={styles.grid}>
          <InfoTile icon="bulb-outline" title="Travel Tips" copy="Carry water, check crowd labels, and plan rest stops." />
          <Pressable accessibilityRole="button" accessibilityLabel="Emergency Contacts" onPress={() => navigation.navigate('EmergencyContacts')} style={{ flex: 1 }}>
            <InfoTile icon="call-outline" title="Emergency Contacts" copy="Local emergency services in Naga City." />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoTile({ icon, title, copy }) {
  const { theme } = useApp();
  return (
    <AppCard style={styles.infoTile}>
      <Ionicons name={icon} size={22} color={theme.colors.primary} />
      <Text style={[styles.infoTitle, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.infoCopy, { color: theme.colors.textMuted }]}>{copy}</Text>
    </AppCard>
  );
}

function QuickAccess({ icon, label, onPress }) {
  const { theme } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.quickItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
    >
      <Ionicons name={icon} size={25} color={theme.colors.primary} />
      <Text style={[styles.quickLabel, { color: theme.colors.text }]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function getFirstName(profile) {
  const savedFirstName = String(profile?.firstName || '').trim();
  if (savedFirstName) return savedFirstName;

  const fullName = String(profile?.name || '').trim();
  return fullName.split(/\s+/).filter(Boolean)[0] || 'Traveler';
}

function getTimeGreeting(date) {
  const hour = getManilaHour(date);
  if (hour >= 0 && hour < 12) return 'GOOD MORNING,';
  if (hour >= 12 && hour < 18) return 'GOOD AFTERNOON,';
  return 'GOOD EVENING,';
}

function getManilaHour(date) {
  try {
    return Number(new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      hourCycle: 'h23',
      timeZone: 'Asia/Manila',
    }).format(date));
  } catch {
    return date.getHours();
  }
}

function toTitleCase(value) {
  return String(value || '').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()).replace(/,$/, ',');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 120,
  },
  header: {
    zIndex: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  greetingWrap: {
    flex: 1,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '800',
  },
  name: {
    marginTop: 2,
    fontSize: 26,
    fontWeight: '900',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  avatar: {
    width: 44,
    borderRadius: 22,
  },
  search: {
    marginTop: 16,
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    fontWeight: '700',
  },
  quickTitle: {
    marginTop: 18,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '900',
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickItem: {
    flex: 1,
    minHeight: 88,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  quickLabel: {
    marginTop: 8,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  exploreBanner: {
    marginTop: 16,
    borderRadius: 24,
    minHeight: 110,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  exploreCopy: {
    flex: 1,
    paddingRight: 12,
  },
  exploreTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  exploreText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  exploreImageWrap: {
    width: 116,
  },
  exploreImage: {
    borderRadius: 18,
  },
  exploreArrow: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapCard: {
    padding: 12,
  },
  mapPreview: {
    aspectRatio: 1.35,
    borderRadius: 22,
  },
  mapFooter: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  cardCopy: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  shortButton: {
    minWidth: 92,
    minHeight: 40,
  },
  smartCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  smartIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smartBody: {
    flex: 1,
    marginHorizontal: 12,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  infoTile: {
    flex: 1,
    padding: 14,
  },
  infoTitle: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '900',
  },
  infoCopy: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 92,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
});
