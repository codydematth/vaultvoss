/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';

// VaultVoss is dark-mode only – always return the dark value.
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.dark
) {
  const colorFromProps = props.dark;
  if (colorFromProps) return colorFromProps;
  return Colors.dark[colorName];
}
