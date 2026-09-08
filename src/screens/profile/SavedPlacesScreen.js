import React from 'react';
import { useApp } from '../../context/AppContext';
import AppHeader, { goToDashboard, goToMain } from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import PlaceListItem from '../../components/PlaceListItem';
import Screen from '../../components/Screen';

export default function SavedPlacesScreen({ navigation }) {
  const { bookmarks, destinations, restaurants, accommodations, tourismEvents } = useApp();
  const unique = new Map([...destinations, ...restaurants, ...accommodations, ...tourismEvents.map((event) => ({ ...event, name: event.title, category: 'Events' }))].map((place) => [place.id, place]));
  const places = [...unique.values()].filter((place) => bookmarks.includes(place.id));
  return (
    <Screen contentStyle={{ paddingTop: 8 }}>
      <AppHeader centered title="Saved Places" onBack={() => goToDashboard(navigation)} backLabel="Back to dashboard" />
      {places.length ? places.map((place) => <PlaceListItem key={place.id} place={place} subtitle={place.category || place.cuisine}
        onPress={() => place.category === 'Events' ? navigation.navigate('Events') : navigation.navigate('DestinationDetails', { destination: place })} />)
        : <EmptyState icon="bookmark-outline" title="No saved places yet" description="Keep your favorite places close for your next visit."
          buttonTitle="Explore Places" onPress={() => goToMain(navigation, 'Explore')} />}
    </Screen>
  );
}
