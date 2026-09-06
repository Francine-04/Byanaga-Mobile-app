import { brandColors, crowdColors, darkColors, lightColors } from './colors';
import { radius, shadows, spacing } from './spacing';
import { typography } from './typography';

export const makeTheme = (scheme = 'light') => {
  const dark = scheme === 'dark';

  return {
    dark,
    colors: dark ? darkColors : lightColors,
    brand: brandColors,
    crowd: crowdColors,
    typography,
    spacing,
    radius,
    shadows,
  };
};
