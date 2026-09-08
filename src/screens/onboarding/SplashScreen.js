import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import BrandMark from '../../components/BrandMark';

export default function SplashScreen({ navigation }) {
  const { authReady, firebaseUser, isLoggedIn, travelerReady, onboardingStep, backendErrors, theme } = useApp();
  const [restoreTimedOut, setRestoreTimedOut] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  useEffect(() => {
    const timer = setTimeout(() => setRestoreTimedOut(true), 12000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
    ]).start();

    if (!authReady && !restoreTimedOut) return undefined;
    const returning = isLoggedIn && firebaseUser && !firebaseUser.isAnonymous;
    if (returning && !travelerReady && !backendErrors.auth && !restoreTimedOut) return undefined;
    const timer = setTimeout(() => {
      if (!authReady || (returning && !travelerReady)) {
        navigation.replace('Auth', { screen: 'Login', params: { message: backendErrors.auth || 'Unable to restore your profile. Check your connection and log in again.' } });
      } else if (!returning) navigation.replace('Onboarding1');
      else if (onboardingStep === 'preferences') navigation.replace('Auth', { screen: 'RegisterStep2', params: { socialOnboarding: true } });
      else navigation.replace(onboardingStep === 'location' ? 'LocationPermission' : 'Main');
    }, 1700);
    return () => clearTimeout(timer);
  }, [authReady, fade, firebaseUser, isLoggedIn, navigation, scale, travelerReady, onboardingStep, backendErrors.auth, restoreTimedOut]);

  return (
    <View style={[styles.container, { backgroundColor: theme.dark ? theme.colors.background : theme.colors.surface }]}>
      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.content, { opacity: fade, transform: [{ scale }] }]}>
          <BrandMark size="hero" />
        </Animated.View>
      </SafeAreaView>

      <View pointerEvents="none" style={styles.waveLayer}>
        <View style={[styles.wave, styles.waveBlue, { backgroundColor: theme.brand.blue }]} />
        <View style={[styles.wave, styles.waveYellow, { backgroundColor: theme.brand.yellow }]} />
        <View style={[styles.wave, styles.waveRed, { backgroundColor: theme.brand.red }]} />
        <View style={[styles.wave, styles.waveGreen, { backgroundColor: theme.brand.green }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
    paddingBottom: 74,
  },
  waveLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -32,
    height: 148,
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    width: '38%',
    height: 118,
    borderTopLeftRadius: 110,
    borderTopRightRadius: 110,
  },
  waveBlue: {
    left: '-12%',
  },
  waveYellow: {
    left: '17%',
    bottom: -10,
  },
  waveRed: {
    right: '17%',
    bottom: -10,
  },
  waveGreen: {
    right: '-12%',
  },
});
