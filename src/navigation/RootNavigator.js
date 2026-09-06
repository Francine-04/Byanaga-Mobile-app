import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import LocationPermissionScreen from '../screens/auth/LocationPermissionScreen';
import OnboardingScreen1 from '../screens/onboarding/OnboardingScreen1';
import OnboardingScreen2 from '../screens/onboarding/OnboardingScreen2';
import OnboardingScreen3 from '../screens/onboarding/OnboardingScreen3';
import SplashScreen from '../screens/onboarding/SplashScreen';
import AccommodationsScreen from '../screens/accommodations/AccommodationsScreen';
import DestinationDetailsScreen from '../screens/destination/DestinationDetailsScreen';
import EventsScreen from '../screens/events/EventsScreen';
import CreateItineraryScreen from '../screens/itinerary/CreateItineraryScreen';
import SmartItineraryScreen from '../screens/itinerary/SmartItineraryScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import RestaurantsScreen from '../screens/restaurants/RestaurantsScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import TravelPreferencesScreen from '../screens/profile/TravelPreferencesScreen';
import PrivacySettingsScreen from '../screens/profile/PrivacySettingsScreen';
import SavedPlacesScreen from '../screens/profile/SavedPlacesScreen';
import DestinationPhotosScreen from '../screens/destination/DestinationPhotosScreen';
import ReviewsScreen from '../screens/destination/ReviewsScreen';
import NearbyPlacesScreen from '../screens/destination/NearbyPlacesScreen';
import EmergencyContactsScreen from '../screens/main/EmergencyContactsScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { theme } = useApp();
  const navigationTheme = {
    dark: theme.dark,
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.accent,
    },
    fonts: {
      regular: { fontFamily: theme.typography.fonts.body, fontWeight: '400' },
      medium: { fontFamily: theme.typography.fonts.body, fontWeight: '600' },
      bold: { fontFamily: theme.typography.fonts.heading, fontWeight: '800' },
      heavy: { fontFamily: theme.typography.fonts.heading, fontWeight: '900' },
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding1" component={OnboardingScreen1} />
        <Stack.Screen name="Onboarding2" component={OnboardingScreen2} />
        <Stack.Screen name="Onboarding3" component={OnboardingScreen3} />
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="DestinationDetails" component={DestinationDetailsScreen} />
        <Stack.Screen name="SmartItinerary" component={SmartItineraryScreen} />
        <Stack.Screen name="CreateItinerary" component={CreateItineraryScreen} />
        <Stack.Screen name="Events" component={EventsScreen} />
        <Stack.Screen name="Restaurants" component={RestaurantsScreen} />
        <Stack.Screen name="Accommodations" component={AccommodationsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="TravelPreferences" component={TravelPreferencesScreen} />
        <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
        <Stack.Screen name="SavedPlaces" component={SavedPlacesScreen} />
        <Stack.Screen name="DestinationPhotos" component={DestinationPhotosScreen} />
        <Stack.Screen name="Reviews" component={ReviewsScreen} />
        <Stack.Screen name="NearbyPlaces" component={NearbyPlacesScreen} />
        <Stack.Screen name="NearbyRestaurants" component={NearbyPlacesScreen} />
        <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
