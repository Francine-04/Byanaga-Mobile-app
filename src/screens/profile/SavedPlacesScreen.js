import React from 'react';
import { useApp } from '../../context/AppContext';
import AppHeader, { goToDashboard, goToMain } from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import PlaceListItem from '../../components/PlaceListItem';
import Screen from '../../components/Screen';

export default function SavedPlacesScreen({ navigation }) {
  const { bookmarks, destinations, restaurants, accommodations, establishments, tourismEvents } = useApp();
  const unique = new Map([
    ...destinations, 
    ...restaurants, 
    ...accommodations, 
    ...establishments,
    ...tourismEvents.map((event) => ({ ...event, name: event.title, category: 'Events' }))
  ].map((place) => [place.id, place]));
  const places = [...unique.values()].filter((place) => bookmarks.includes(place.id));
  return (
    <Screen contentStyle={{ paddingTop: 8 }}>
      <AppHeader centered title="Saved Places" onBack={() => goToDashboard(navigation)} backLabel="Back to dashboard" />
      {places.length ? places.map((place) => {
        let onPress;
        if (place.category === 'Events') {
          onPress = () => navigation.navigate('Events');
        } else if (place.sourceCollection === 'business_profiles' || place.dashboardId) {
          // This is an establishment
          onPress = () => navigation.navigate('EstablishmentDetails', { establishmentId: place.dashboardId || place.id });
        } else {
          // Regular destination/restaurant/accommodation
          onPress = () => navigation.navigate('DestinationDetails', { destination: place });
        }
        
        return (
          <PlaceListItem 
            key={place.id} 
            place={place} 
            subtitle={place.categoryLabel || place.category || place.cuisine}
            onPress={onPress} 
          />
        );
      })
        : <EmptyState icon="bookmark-outline" title="No saved places yet" description="Keep your favorite places close for your next visit."
          buttonTitle="Explore Places" onPress={() => goToMain(navigation, 'Explore')} />}
    </Screen>
  );
}
