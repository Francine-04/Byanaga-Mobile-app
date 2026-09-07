import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import { accommodations as fallbackAccommodations } from '../data/accommodations';
import { destinations as fallbackDestinations } from '../data/destinations';
import { heatZones as fallbackHeatZones } from '../data/heatZones';
import useNotificationFeed from '../hooks/useNotificationFeed';
import { restaurants as fallbackRestaurants } from '../data/restaurants';
import {
  businessProfileToAccommodation,
  businessProfileToDestination,
  businessProfileToRestaurant,
  subscribeToDashboardAccommodations,
  subscribeToDashboardBusinessProfiles,
  subscribeToDashboardDestinations,
  subscribeToDashboardVisitors,
} from '../services/dashboardDataService';
import { subscribeToDashboardEvents } from '../services/eventsService';
import {
  subscribeToEstablishmentGallery,
  subscribeToEstablishmentMenu,
  subscribeToEstablishmentPosts,
} from '../services/establishmentContentService';
import { firebaseProjectId } from '../services/firebaseApp';
import { AUTH_REQUIRED_ERROR_CODE, loadTravelerRecord, subscribeToAuthState, travelerRecordToAppState } from '../services/authService';
import {
  deleteItineraryFromDatabase,
  saveItineraryToDatabase,
  subscribeToUserItineraries,
  updateItineraryStatusInDatabase,
} from '../services/itineraryService';
import { getRememberedTraveler } from '../services/rememberMeService';
import { fallbackWeather, fetchNagaWeather } from '../services/weatherService';
import { makeTheme } from '../theme/theme';
import { attachEstablishmentContent } from '../utils/establishmentContent';
import { deriveHeatZones } from '../utils/heatmapData';

const AppContext = createContext(null);
const STORAGE_KEY = 'byanaga.traveler.v1';

export function AppProvider({ children }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreference] = useState('light');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [locationPermission, setLocationPermission] = useState('undecided');
  const [preferences, setPreferences] = useState({
    places: [],
    activities: [],
    travelStyle: '',
    budget: '',
    duration: '',
  });
  const [bookmarks, setBookmarks] = useState([]);
  const [savedTrips, setSavedTrips] = useState([]);
  const [tourismEvents, setTourismEvents] = useState([]);
  const [eventsSource, setEventsSource] = useState('loading');
  const [eventsError, setEventsError] = useState(null);
  const [liveDestinations, setLiveDestinations] = useState([]);
  const [liveAccommodations, setLiveAccommodations] = useState([]);
  const [businessProfiles, setBusinessProfiles] = useState([]);
  const [establishmentPosts, setEstablishmentPosts] = useState([]);
  const [establishmentGallery, setEstablishmentGallery] = useState([]);
  const [establishmentMenuItems, setEstablishmentMenuItems] = useState([]);
  const [visitorRecords, setVisitorRecords] = useState([]);
  const [backendErrors, setBackendErrors] = useState({});
  const [itineraryError, setItineraryError] = useState(null);
  const [weather, setWeather] = useState(fallbackWeather);
  const [weatherError, setWeatherError] = useState(null);
  const [profile, setProfile] = useState({
    name: 'Francine Dela Torre',
    phone: '',
    bio: 'I love exploring new places!',
    nationality: 'Filipino',
    image: null,
  });
  const [settings, setSettings] = useState({
    travelAlerts: true,
    eventUpdates: true,
    weatherUpdates: false,
    promotions: true,
    anonymousLocation: false,
    dataSharing: false,
    language: 'English',
  });
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState(null);
  const connection = useNetInfo();
  const isOffline = connection.isConnected === false || connection.isInternetReachable === false;

  useEffect(() => {
    let active = true;

    const unsubscribe = subscribeToAuthState(async (user) => {
      if (!active) return;
      setFirebaseUser(user);

      if (!user || user.isAnonymous) {
        setAuthReady(true);
        return;
      }

      setIsGuestMode(false);

      try {
        const [record, remembered] = await Promise.all([
          loadTravelerRecord(user.uid),
          getRememberedTraveler(),
        ]);

        if (!active) return;

        if (record) {
          const appState = travelerRecordToAppState(record, user);
          setProfile((current) => ({ ...current, ...appState.profile }));
          setPreferences((current) => ({ ...current, ...appState.preferences }));
        }

        if (remembered?.uid === user.uid) {
          setIsLoggedIn(true);
        }

        setBackendErrors((current) => {
          const next = { ...current };
          delete next.auth;
          return next;
        });
      } catch (error) {
        if (active) {
          setBackendErrors((current) => ({ ...current, auth: error?.message || 'Unable to load traveler profile.' }));
        }
      } finally {
        if (active) setAuthReady(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!mounted || !raw) return;
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') return;
      if (saved.settings && typeof saved.settings === 'object') setSettings((current) => ({ ...current, ...saved.settings }));
      if (saved.preferences && Array.isArray(saved.preferences.places) && Array.isArray(saved.preferences.activities)) setPreferences((current) => ({ ...current, ...saved.preferences }));
      if (['light', 'dark', 'system'].includes(saved.themePreference)) setThemePreference(saved.themePreference);
      if (Array.isArray(saved.bookmarks)) setBookmarks(saved.bookmarks.filter((id) => typeof id === 'string'));
    }).catch(() => {
      if (mounted) setStorageError('Unable to restore saved preferences on this device.');
    }).finally(() => {
      if (mounted) setStorageReady(true);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    const timer = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, settings, preferences, themePreference, bookmarks }))
        .then(() => setStorageError(null))
        .catch(() => setStorageError('Changes could not be saved on this device.'));
    }, 150);
    return () => clearTimeout(timer);
  }, [storageReady, profile, settings, preferences, themePreference, bookmarks]);

  const updateBackendError = useCallback((key, message) => {
    setBackendErrors((current) => {
      const next = { ...current };
      if (message) next[key] = message;
      else delete next[key];
      return next;
    });
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToDashboardEvents(
      (liveEvents) => {
        setEventsError(null);
        updateBackendError('events', null);
        setTourismEvents(liveEvents);
        setEventsSource('dashboard');
      },
      (error) => {
        const message = error?.message || 'Unable to load dashboard events.';
        setEventsError(message);
        updateBackendError('events', message);
        setTourismEvents([]);
        setEventsSource('error');
      }
    );

    return unsubscribe;
  }, [updateBackendError]);

  useEffect(() => {
    const subscriptions = [
      subscribeToDashboardDestinations(
        (items) => {
          setLiveDestinations(items);
          updateBackendError('destinations', null);
        },
        (error) => updateBackendError('destinations', error?.message || 'Unable to load dashboard destinations.')
      ),
      subscribeToDashboardAccommodations(
        (items) => {
          setLiveAccommodations(items);
          updateBackendError('accommodations', null);
        },
        (error) => updateBackendError('accommodations', error?.message || 'Unable to load dashboard accommodations.')
      ),
      subscribeToDashboardBusinessProfiles(
        (items) => {
          setBusinessProfiles(items);
          updateBackendError('businessProfiles', null);
        },
        (error) => updateBackendError('businessProfiles', error?.message || 'Unable to load dashboard business profiles.')
      ),
      subscribeToDashboardVisitors(
        (items) => {
          setVisitorRecords(items);
          updateBackendError('visitors', null);
        },
        (error) => updateBackendError('visitors', error?.message || 'Unable to load dashboard visitor records.')
      ),
      subscribeToEstablishmentPosts(
        (items) => {
          setEstablishmentPosts(items);
          updateBackendError('establishmentPosts', null);
        },
        (error) => updateBackendError('establishmentPosts', error?.message || 'Unable to load establishment updates.')
      ),
      subscribeToEstablishmentGallery(
        (items) => {
          setEstablishmentGallery(items);
          updateBackendError('establishmentGallery', null);
        },
        (error) => updateBackendError('establishmentGallery', error?.message || 'Unable to load establishment photos.')
      ),
      subscribeToEstablishmentMenu(
        (items) => {
          setEstablishmentMenuItems(items);
          updateBackendError('establishmentMenu', null);
        },
        (error) => updateBackendError('establishmentMenu', error?.message || 'Unable to load establishment menu items.')
      ),
    ];

    return () => {
      subscriptions.forEach((unsubscribe) => {
        if (typeof unsubscribe === 'function') unsubscribe();
      });
    };
  }, [updateBackendError]);

  useEffect(() => {
    setSavedTrips([]);

    if (!firebaseUser?.uid || firebaseUser.isAnonymous || isGuestMode) {
      return undefined;
    }

    const unsubscribe = subscribeToUserItineraries(
      firebaseUser.uid,
      (trips) => {
        setSavedTrips(trips);
        setItineraryError(null);
        updateBackendError('itineraries', null);
      },
      (error) => {
        const message = error?.message || 'Unable to load saved itineraries.';
        setItineraryError(message);
        updateBackendError('itineraries', message);
      }
    );

    return unsubscribe;
  }, [firebaseUser?.uid, firebaseUser?.isAnonymous, isGuestMode, updateBackendError]);

  const refreshWeather = useCallback(async () => {
    try {
      const nextWeather = await fetchNagaWeather();
      setWeather(nextWeather);
      setWeatherError(null);
      return nextWeather;
    } catch (error) {
      const message = error?.message || 'Unable to load weather.';
      setWeather(fallbackWeather);
      setWeatherError(message);
      return fallbackWeather;
    }
  }, []);

  useEffect(() => {
    refreshWeather();
    const timer = setInterval(refreshWeather, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, [refreshWeather]);

  const colorScheme = themePreference === 'system' ? systemScheme || 'light' : themePreference;
  const theme = useMemo(() => makeTheme(colorScheme), [colorScheme]);

  const approvedEstablishmentIds = useMemo(
    () => new Set(businessProfiles.map((profile) => profile.dashboardId).filter(Boolean)),
    [businessProfiles]
  );
  const visibleEstablishmentPosts = useMemo(() => establishmentPosts
    .filter((post) => approvedEstablishmentIds.has(post.establishmentId))
    .map((post) => ({
      ...post,
      establishmentName: businessProfiles.find((profile) => profile.dashboardId === post.establishmentId)?.name || '',
    })), [approvedEstablishmentIds, businessProfiles, establishmentPosts]);
  const visibleEstablishmentGallery = useMemo(
    () => establishmentGallery.filter((item) => approvedEstablishmentIds.has(item.establishmentId)),
    [approvedEstablishmentIds, establishmentGallery]
  );
  const visibleEstablishmentMenuItems = useMemo(
    () => establishmentMenuItems.filter((item) => approvedEstablishmentIds.has(item.establishmentId)),
    [approvedEstablishmentIds, establishmentMenuItems]
  );
  const establishmentProfiles = useMemo(() => attachEstablishmentContent({
    profiles: businessProfiles,
    posts: visibleEstablishmentPosts,
    gallery: visibleEstablishmentGallery,
    menuItems: visibleEstablishmentMenuItems,
  }), [businessProfiles, visibleEstablishmentGallery, visibleEstablishmentMenuItems, visibleEstablishmentPosts]);

  const businessDestinations = useMemo(() => (
    establishmentProfiles
      .filter((profile) => ['attraction', 'shop', 'entertainment'].includes(profile.category))
      .map(businessProfileToDestination)
  ), [establishmentProfiles]);

  const destinations = useMemo(() => {
    const merged = dedupeByName([...liveDestinations, ...businessDestinations]);
    return merged.length ? merged : fallbackDestinations;
  }, [businessDestinations, liveDestinations]);

  const businessRestaurants = useMemo(() => (
    establishmentProfiles
      .filter((profile) => profile.category === 'restaurant')
      .map(businessProfileToRestaurant)
  ), [establishmentProfiles]);

  const restaurants = useMemo(() => {
    const merged = dedupeByName(businessRestaurants);
    return merged.length ? merged : fallbackRestaurants;
  }, [businessRestaurants]);

  const businessStays = useMemo(() => (
    establishmentProfiles
      .filter((profile) => ['hotel', 'resort'].includes(profile.category))
      .map(businessProfileToAccommodation)
  ), [establishmentProfiles]);

  const accommodations = useMemo(() => {
    const merged = dedupeByName([...liveAccommodations, ...businessStays]);
    return merged.length ? merged : fallbackAccommodations;
  }, [businessStays, liveAccommodations]);

  const derivedHeatZones = useMemo(() => (
    deriveHeatZones({ visitors: visitorRecords, destinations, events: tourismEvents })
  ), [destinations, tourismEvents, visitorRecords]);
  const heatZones = derivedHeatZones.length ? derivedHeatZones : fallbackHeatZones;
  const notificationZones = useMemo(() => deriveHeatZones({
    visitors: visitorRecords,
    destinations: [...liveDestinations, ...businessDestinations],
    events: eventsSource === 'dashboard' ? tourismEvents : [],
  }), [visitorRecords, liveDestinations, businessDestinations, eventsSource, tourismEvents]);
  const { notifications, vouchers: liveVouchers, markAllNotificationsRead, markNotificationsRead, notificationError } = useNotificationFeed({
    userId: !isGuestMode && firebaseUser && !firebaseUser.isAnonymous ? firebaseUser.uid : null,
    events: eventsSource === 'dashboard' ? tourismEvents : [],
    trips: !isGuestMode && firebaseUser ? savedTrips.filter((trip) => trip.userId === firebaseUser.uid) : [],
    zones: notificationZones,
    establishmentPosts: visibleEstablishmentPosts,
  });
  const vouchers = useMemo(
    () => liveVouchers.filter((voucher) => !voucher.establishmentId || approvedEstablishmentIds.has(voucher.establishmentId)),
    [approvedEstablishmentIds, liveVouchers]
  );
  const establishments = useMemo(() => establishmentProfiles.map((profile) => ({
    ...profile,
    vouchers: vouchers.filter((voucher) => voucher.establishmentId === profile.dashboardId),
  })), [establishmentProfiles, vouchers]);

  const backendStatus = useMemo(() => ({
    projectId: firebaseProjectId,
    events: eventsSource,
    destinations: liveDestinations.length || businessDestinations.length ? 'dashboard' : 'mock',
    restaurants: businessRestaurants.length ? 'dashboard' : 'mock',
    accommodations: liveAccommodations.length || businessStays.length ? 'dashboard' : 'mock',
    establishments: establishments.length ? 'dashboard' : 'empty',
    offers: vouchers.length ? 'dashboard' : 'empty',
    heatmap: derivedHeatZones.length ? 'dashboard' : 'mock',
    weather: weather.source,
  }), [
    businessDestinations.length,
    businessRestaurants.length,
    businessStays.length,
    derivedHeatZones.length,
    eventsSource,
    liveAccommodations.length,
    liveDestinations.length,
    establishments.length,
    vouchers.length,
    weather.source,
  ]);

  const visibleNotifications = useMemo(() => notifications.filter((notification) => {
    if (notification.id.startsWith('event-') && !settings.eventUpdates) return false;
    const preference = { Events: 'eventUpdates', Weather: 'weatherUpdates', Promotions: 'promotions', 'Travel Reminders': 'travelAlerts' }[notification.category];
    return !preference || settings[preference];
  }), [notifications, settings]);

  const toggleBookmark = useCallback((id) => {
    setBookmarks((current) =>
      current.includes(id) ? current.filter((bookmarkId) => bookmarkId !== id) : [...current, id]
    );
  }, []);


  const retryConnection = useCallback(() => NetInfo.refresh(), []);

  const saveItinerary = useCallback(async (draft) => {
    try {
      requireRegisteredTraveler(isGuestMode);
      const result = await saveItineraryToDatabase(draft);
      setItineraryError(null);
      setSavedTrips((current) => [result.trip, ...current.filter((trip) => trip.id !== result.trip.id)]);
      return result.trip;
    } catch (error) {
      const message = error?.message || 'Unable to save itinerary.';
      setItineraryError(message);
      const nextError = new Error(message);
      nextError.code = error?.code;
      throw nextError;
    }
  }, [isGuestMode]);

  const deleteItinerary = useCallback(async (itineraryId) => {
    try {
      requireRegisteredTraveler(isGuestMode);
      await deleteItineraryFromDatabase(itineraryId);
      setItineraryError(null);
      setSavedTrips((current) => current.filter((trip) => trip.id !== itineraryId));
    } catch (error) {
      const message = error?.message || 'Unable to delete itinerary.';
      setItineraryError(message);
      const nextError = new Error(message);
      nextError.code = error?.code;
      throw nextError;
    }
  }, [isGuestMode]);

  const updateItineraryStatus = useCallback(async (itineraryId, status) => {
    try {
      requireRegisteredTraveler(isGuestMode);
      await updateItineraryStatusInDatabase(itineraryId, status);
      setItineraryError(null);
      setSavedTrips((current) => current.map((trip) => (trip.id === itineraryId ? { ...trip, status } : trip)));
    } catch (error) {
      const message = error?.message || 'Unable to update itinerary.';
      setItineraryError(message);
      const nextError = new Error(message);
      nextError.code = error?.code;
      throw nextError;
    }
  }, [isGuestMode]);

  const value = useMemo(
    () => ({
      theme,
      profile,
      setProfile,
      settings,
      setSettings,
      storageError,
      isOffline,
      retryConnection,
      themePreference,
      setThemePreference,
      isLoggedIn,
      setIsLoggedIn,
      isGuestMode,
      setIsGuestMode,
      firebaseUser,
      authReady,
      locationPermission,
      setLocationPermission,
      preferences,
      setPreferences,
      bookmarks,
      toggleBookmark,
      savedTrips,
      setSavedTrips,
      saveItinerary,
      deleteItinerary,
      updateItineraryStatus,
      itineraryError,
      destinations,
      restaurants,
      accommodations,
      establishments,
      establishmentPosts: visibleEstablishmentPosts,
      establishmentGallery: visibleEstablishmentGallery,
      establishmentMenuItems: visibleEstablishmentMenuItems,
      vouchers,
      heatZones,
      visitorRecords,
      tourismEvents,
      eventsSource,
      eventsError,
      notifications,
      visibleNotifications,
      notificationError,
      markNotificationsRead,
      markAllNotificationsRead,
      weather,
      weatherError,
      refreshWeather,
      backendErrors,
      backendStatus,
    }),
    [
      theme,
      profile,
      settings,
      storageError,
      isOffline,
      retryConnection,
      themePreference,
      isLoggedIn,
      isGuestMode,
      firebaseUser,
      authReady,
      locationPermission,
      preferences,
      bookmarks,
      toggleBookmark,
      savedTrips,
      saveItinerary,
      deleteItinerary,
      updateItineraryStatus,
      itineraryError,
      destinations,
      restaurants,
      accommodations,
      establishments,
      visibleEstablishmentPosts,
      visibleEstablishmentGallery,
      visibleEstablishmentMenuItems,
      vouchers,
      heatZones,
      visitorRecords,
      tourismEvents,
      eventsSource,
      eventsError,
      notifications,
      visibleNotifications,
      notificationError,
      markNotificationsRead,
      markAllNotificationsRead,
      weather,
      weatherError,
      refreshWeather,
      backendErrors,
      backendStatus,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function requireRegisteredTraveler(isGuestMode) {
  if (!isGuestMode) return;
  const error = new Error('Log in to create, save, or edit an itinerary.');
  error.code = AUTH_REQUIRED_ERROR_CODE;
  throw error;
}

function dedupeByName(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item.name || item.title || item.id).trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
