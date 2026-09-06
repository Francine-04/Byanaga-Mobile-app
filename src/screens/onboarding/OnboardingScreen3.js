import React from 'react';
import OnboardingLayout from './OnboardingLayout';

export default function OnboardingScreen3({ navigation }) {
  return (
    <OnboardingLayout
      step={2}
      title="Travel Smarter"
      description="View tourism heatmaps and receive itinerary suggestions powered by preference matching and route optimization algorithms."
      imageLabel="Heatmap Illustration Placeholder"
      visualType="map"
      topAction={{ title: 'Skip', onPress: () => navigation.navigate('Auth', { screen: 'Login' }) }}
      secondary={{ title: 'Register', onPress: () => navigation.navigate('Auth', { screen: 'RegisterStep1' }) }}
      primary={{ title: 'Login', onPress: () => navigation.navigate('Auth', { screen: 'Login' }) }}
    />
  );
}
