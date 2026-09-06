import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';

const logoSource = require('../../assets/Byanaga Logo.png');
const letterSource = require('../../assets/Byanaga Letter.png');
const LOGO_ASPECT_RATIO = 1402 / 1122;

export default function BrandMark({ compact = false, size = 'regular', style }) {
  const { theme } = useApp();
  const isCompact = compact || size === 'compact';
  const isHero = size === 'hero';
  const symbolWidth = isHero ? 286 : isCompact ? 92 : 172;
  const letterWidth = isHero ? 336 : isCompact ? 142 : 220;
  const letterHeight = isHero ? 84 : isCompact ? 38 : 58;
  const taglineSize = isHero ? 15 : isCompact ? 8 : 11;

  return (
    <View style={[styles.wrap, style]}>
      <View
        accessibilityRole="image"
        accessibilityLabel="BYANAGA compass logo"
        style={[
          styles.symbol,
          {
            width: symbolWidth,
            height: symbolWidth / LOGO_ASPECT_RATIO,
          },
          theme.dark && styles.darkSymbol,
        ]}
      >
        <Image source={logoSource} resizeMode="contain" style={styles.logoImage} />
      </View>

      <View
        accessibilityLabel="BYANAGA"
        accessibilityRole="image"
        style={[
          styles.letterPlate,
          {
            width: letterWidth + 18,
            height: letterHeight + 12,
          },
          theme.dark && styles.darkLetterPlate,
        ]}
      >
        <View style={[styles.letterWindow, { width: letterWidth, height: letterHeight }]}>
          <Image source={letterSource} resizeMode="cover" style={styles.letterImage} />
        </View>
      </View>
      <Text style={[styles.tagline, { fontSize: taglineSize, lineHeight: taglineSize + 7 }]}>
        <Text style={{ color: theme.brand.blue }}>EXPLORE.</Text>
        <Text> </Text>
        <Text style={{ color: theme.brand.yellow }}>CONNECT.</Text>
        <Text> </Text>
        <Text style={{ color: theme.brand.green }}>EXPERIENCE.</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: '100%',
  },
  symbol: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkSymbol: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.035)',
    shadowColor: '#3498DB',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  letterPlate: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkLetterPlate: {
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  letterWindow: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterImage: {
    width: '100%',
    height: '100%',
  },
  tagline: {
    marginTop: 2,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center',
  },
});
