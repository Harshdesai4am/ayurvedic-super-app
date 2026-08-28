import { Palette } from './palette';
import { Typography } from './typography';
import { Spacing, Radii, Elevation } from './spacing';

export type ThemeMode = 'light' | 'dark';

export interface AppTheme {
  mode: ThemeMode;
  colors: typeof Palette.light & {
    brand: typeof Palette.herbalGreen;
    earth: typeof Palette.warmEarth;
    dosha: typeof Palette.dosha;
    status: typeof Palette.status;
  };
  typography: typeof Typography;
  spacing: typeof Spacing;
  radii: typeof Radii;
  elevation: typeof Elevation;
}

export const createTheme = (mode: ThemeMode): AppTheme => {
  const isDark = mode === 'dark';
  const modeColors = isDark ? Palette.dark : Palette.light;

  return {
    mode,
    colors: {
      ...modeColors,
      brand: Palette.herbalGreen,
      earth: Palette.warmEarth,
      dosha: Palette.dosha,
      status: Palette.status,
    },
    typography: Typography,
    spacing: Spacing,
    radii: Radii,
    elevation: Elevation,
  };
};
