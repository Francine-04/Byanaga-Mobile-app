import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import BrandMark from '../../components/BrandMark';

export default function SplashScreen({ navigation }) {
  const { authReady, firebaseUser, isLoggedIn, theme } = useApp();
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
    ]).start();

    if (!authReady) return undefined;

    const nextScreen = isLoggedIn && firebaseUser && !firebaseUser.isAnonymous ? 'Main' : 'Onboarding1';
    const timer = setTimeout(() => navigation.replace(nextScreen), 1700);
    return () => clearTimeout(timer);
  }, [authReady, fade, firebaseUser, isLoggedIn, navigation, scale]);

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
