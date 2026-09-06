import { Platform } from 'react-native';

const systemFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const typography = {
  fonts: {
    heading: systemFont,
    body: systemFont,
  },
  sizes: {
    tiny: 10,
    caption: 12,
    body: 14,
    bodyLarge: 16,
    title: 20,
    heading: 26,
    display: 34,
  },
  weights: {
    regular: '400',
    medium: '600',
    bold: '800',
  },
};
