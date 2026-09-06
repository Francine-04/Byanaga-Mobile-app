import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useApp } from '../../context/AppContext';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import AppButton from '../../components/AppButton';
import PlaceListItem from '../../components/PlaceListItem';
import Screen from '../../components/Screen';

export default function NearbyPlacesScreen({ navigation, route }) {
  const { theme, destinations, restaurants } = useApp();
  const isRestaurants = route.name === 'NearbyRestaurants';
  const nearby = isRestaurants ? restaurants : destinations.filter((place) => place.id !== route.params?.destination?.id);
  return (
    <Screen contentStyle={styles.content}>
      <AppHeader centered title={isRestaurants ? 'Nearby Restaurants' : 'Nearby Places'} onBack={() => goToDashboard(navigation)} backLabel="Back to dashboard" />
      <Text style={[styles.caption, { color: theme.colors.textMuted }]}>Naga City - Sample distances</Text>
      {nearby.map((place, index) => <PlaceListItem key={place.id} place={place} showRating={isRestaurants}
        subtitle={isRestaurants ? place.cuisine : undefined} travelTime={[8, 10, 6, 12, 7][index] + ' min'}
        onPress={() => navigation.navigate('DestinationDetails', { destination: place })} />)}
      {!isRestaurants ? <AppButton title="Nearby Restaurants" icon="restaurant-outline" variant="outline" style={styles.action}
        onPress={() => navigation.navigate('NearbyRestaurants', route.params)} /> : null}
    </Screen>
  );
}
const styles = StyleSheet.create({ content: { paddingTop: 8 }, caption: { fontSize: 12, lineHeight: 18, marginBottom: 18 }, action: { borderRadius: 16, marginTop: 12 } });
