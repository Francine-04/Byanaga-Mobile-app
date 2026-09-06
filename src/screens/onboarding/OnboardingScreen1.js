import React from 'react';
import OnboardingLayout from './OnboardingLayout';

export default function OnboardingScreen1({ navigation }) {
  return (
    <OnboardingLayout
      step={0}
      title="Discover Naga City"
      description="Explore beautiful destinations, restaurants, accommodations, parks, cultural landmarks, and unforgettable experiences throughout Naga City."
      imageLabel="Onboarding Destination Placeholder"
      topAction={{ title: 'Skip', onPress: () => navigation.navigate('Auth', { screen: 'Login' }) }}
      secondary={{ title: 'Skip', onPress: () => navigation.navigate('Auth', { screen: 'Login' }) }}
      primary={{ title: 'Next', icon: 'chevron-forward', onPress: () => navigation.navigate('Onboarding2') }}
    />
  );
}
