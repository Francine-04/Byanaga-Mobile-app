import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import ExploreScreen from '../screens/main/ExploreScreen';
import HeatmapScreen from '../screens/main/HeatmapScreen';
import HomeScreen from '../screens/main/HomeScreen';
import SavedTripsScreen from '../screens/itinerary/SavedTripsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

const icons = {
  Home: ['home', 'home-outline'],
  Explore: ['search', 'search-outline'],
  Heatmap: ['map', 'map-outline'],
  Trips: ['calendar', 'calendar-outline'],
  Profile: ['person', 'person-outline'],
};

export default function MainTabNavigator() {
  const { theme } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarAccessibilityLabel: route.name,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 64 + Math.max(insets.bottom, 8),
            paddingBottom: Math.max(insets.bottom, 8),
            backgroundColor: theme.colors.tab,
            borderTopColor: theme.colors.border,
            shadowColor: theme.colors.shadow,
          },
        ],
        tabBarIcon: ({ focused }) => <TabIcon routeName={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Heatmap" component={HeatmapScreen} />
      <Tab.Screen name="Trips" component={SavedTripsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function TabIcon({ routeName, focused }) {
  const { theme } = useApp();
  const [activeIcon, inactiveIcon] = icons[routeName] || icons.Home;

  return (
    <View style={styles.tabItem}>
      <Ionicons name={focused ? activeIcon : inactiveIcon} size={20} color={focused ? theme.colors.primary : theme.colors.textMuted} />
      <Text style={[styles.tabLabel, { color: focused ? theme.colors.primary : theme.colors.textMuted }]}>{routeName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 72,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 16,
  },
  tabItem: {
    minWidth: 58,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: '900',
  },
});
