import colors from '@/constants/colors';
import { useThemeMode } from '@/context/ThemeContext';

/**
 * Returns the design tokens for the current color scheme.
 *
 * The returned object contains all color tokens for the active palette
 * plus scheme-independent values like `radius`.
 *
 * The effective scheme honors the user's manual dark-mode override
 * (Settings) and falls back to the device appearance setting otherwise.
 */
export function useColors() {
  const { scheme } = useThemeMode();
  const palette = scheme === 'dark' ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
