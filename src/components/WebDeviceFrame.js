import React from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useApp } from '../context/AppContext';

export default function WebDeviceFrame({ children }) {
  const { theme } = useApp();
  const { width, height } = useWindowDimensions();

  if (Platform.OS !== 'web') {
    return children;
  }

  const frameWidth = Math.max(320, Math.min(430, width - 32));
  const frameHeight = Math.min(920, height - 32);
  const framed = width >= 600 && height >= 520;

  return (
    <View style={[styles.stage, { backgroundColor: theme.dark ? '#07111F' : '#F3F6F8' }, !framed && styles.flatStage]}>
      <View style={[styles.phone, { width: frameWidth, height: frameHeight }, !framed && styles.flatPhone]}>
        {framed ? <View style={styles.speaker}>
          <View style={styles.camera} />
        </View> : null}
        {framed ? <View style={styles.status}>
          <Text style={[styles.statusText, { color: theme.dark ? '#F8FAFC' : '#06121F' }]}>9:41</Text>
          <Text style={[styles.statusText, { color: theme.dark ? '#F8FAFC' : '#06121F' }]}>BYANAGA</Text>
        </View> : null}
        <View key="app-screen" style={[styles.screen, { backgroundColor: theme.colors.background }, !framed && styles.flatScreen]}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flatStage: { padding: 0 },
  flatPhone: { flex: 1, width: '100%', height: '100%', borderRadius: 0, padding: 0, shadowOpacity: 0, boxShadow: 'none' },
  flatScreen: { borderRadius: 0, paddingTop: 0 },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  phone: {
    borderRadius: 52,
    backgroundColor: '#050505',
    padding: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.28,
    shadowRadius: 44,
  },
  screen: {
    flex: 1,
    paddingTop: 40,
    overflow: 'hidden',
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
  },
  speaker: {
    position: 'absolute',
    top: 18,
    alignSelf: 'center',
    zIndex: 10,
    width: 112,
    height: 31,
    borderRadius: 18,
    backgroundColor: '#050505',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 20,
  },
  camera: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#111B32',
    borderWidth: 1,
    borderColor: '#1F4A8A',
  },
  status: {
    position: 'absolute',
    top: 22,
    left: 34,
    right: 34,
    zIndex: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  statusText: {
    color: '#06121F',
    fontSize: 12,
    fontWeight: '900',
  },
});
