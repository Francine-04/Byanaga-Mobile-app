import React from 'react';
import OnboardingLayout from './OnboardingLayout';

export default function OnboardingScreen2({ navigation }) {
  return (
    <OnboardingLayout
      step={1}
      title="Plan Every Journey"
      description="Create organized travel plans, discover nearby attractions, and enjoy optimized travel routes."
      image={require('../../../assets/Onboarding 2.png')}
      imageLabel="Plan every journey illustration"
      topAction={{ title: 'Skip', onPress: () => navigation.navigate('Auth', { screen: 'Login' }) }}
      secondary={{ title: 'Back', onPress: () => navigation.goBack() }}
      primary={{ title: 'Next', icon: 'chevron-forward', onPress: () => navigation.navigate('Onboarding3') }}
    />
  );
}
