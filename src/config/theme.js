import { Platform } from 'react-native';

// Theme configuration for Modiva App
export const COLORS = {
  // Primary Colors
  primary: '#4A90E2',
  primaryLight: '#E8F4FD',
  primaryDark: '#3A7BC8',
  
  // Secondary Colors (Red for blood drop logo)
  secondary: '#E24A4A',
  secondaryLight: '#FDEAEA',
  secondaryDark: '#C23A3A',
  
  // Blood Colors
  bloodRed: '#dc2626',
  bloodRedLight: '#fee2e2',
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  dark: '#1A1A2E',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  border: '#E5E7EB',
  
  // Background
  background: '#F8F9FA',
  
  // Status Colors
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  
  // Gradient Colors
  gradientStart: '#4A90E2',
  gradientEnd: '#6BA3E8',
  
  // Transparent
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

const systemFont = Platform.OS === 'ios' ? 'System' : 'sans-serif';
const systemFontMedium = Platform.OS === 'ios' ? 'System' : 'sans-serif-medium';
const systemFontLight = Platform.OS === 'ios' ? 'System' : 'sans-serif-light';

export const FONTS = {
  regular: {
    fontFamily: systemFont,
    fontWeight: '400',
  },
  medium: {
    fontFamily: systemFontMedium,
    fontWeight: '500',
  },
  semiBold: {
    fontFamily: systemFontMedium,
    fontWeight: '600',
  },
  bold: {
    fontFamily: systemFontMedium,
    fontWeight: '700',
  },
  extraBold: {
    fontFamily: systemFontMedium,
    fontWeight: '800',
  },
};
export const SIZES = {
  // Global sizes
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 18,
  extraLarge: 24,
  xxl: 32,
  xxxl: 40,
  
  // Radius
  radius: 12,
  radiusSmall: 8,
  radiusLarge: 16,
  radiusXL: 24,
  radiusFull: 9999,
  
  // Padding
  paddingSmall: 8,
  padding: 16,
  paddingLarge: 24,
  
  // Margin
  marginSmall: 8,
  margin: 16,
  marginLarge: 24,
  
  // Icon sizes
  iconSmall: 16,
  icon: 24,
  iconLarge: 32,
  iconXL: 48,
};
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
};
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
// Typography presets
export const TYPOGRAPHY = {
  h1: {
    ...FONTS.bold,
    fontSize: SIZES.xxxl,
    lineHeight: 48,
    color: COLORS.dark,
  },
  h2: {
    ...FONTS.bold,
    fontSize: SIZES.xxl,
    lineHeight: 40,
    color: COLORS.dark,
  },
  h3: {
    ...FONTS.semiBold,
    fontSize: SIZES.extraLarge,
    lineHeight: 32,
    color: COLORS.dark,
  },
  h4: {
    ...FONTS.semiBold,
    fontSize: SIZES.large,
    lineHeight: 28,
    color: COLORS.dark,
  },
  body1: {
    ...FONTS.regular,
    fontSize: SIZES.medium,
    lineHeight: 24,
    color: COLORS.dark,
  },
  body2: {
    ...FONTS.regular,
    fontSize: SIZES.font,
    lineHeight: 22,
    color: COLORS.dark,
  },
  caption: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    lineHeight: 18,
    color: COLORS.gray,
  },
  button: {
    ...FONTS.semiBold,
    fontSize: SIZES.font,
    lineHeight: 20,
  },
  label: {
    ...FONTS.medium,
    fontSize: SIZES.small,
    lineHeight: 16,
    color: COLORS.gray,
  },
};
// Button styles
export const BUTTON_STYLES = {
  primary: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.medium,
    paddingHorizontal: SIZES.extraLarge,
    ...SHADOWS.small,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.medium,
    paddingHorizontal: SIZES.extraLarge,
    ...SHADOWS.small,
  },
  outline: {
    backgroundColor: COLORS.transparent,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.medium - 2,
    paddingHorizontal: SIZES.extraLarge - 2,
  },
  ghost: {
    backgroundColor: COLORS.transparent,
    paddingVertical: SIZES.medium,
    paddingHorizontal: SIZES.extraLarge,
  },
};
// Card styles
export const CARD_STYLES = {
  default: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding,
    ...SHADOWS.small,
  },
  elevated: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding,
    ...SHADOWS.medium,
  },
  outlined: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
};
// Input styles
export const INPUT_STYLES = {
  default: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.medium,
    fontSize: SIZES.font,
    color: COLORS.dark,
  },
  focused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  error: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorLight,
  },
  disabled: {
    backgroundColor: COLORS.lightGray,
    opacity: 0.7,
  },
};
export default {
  COLORS,
  FONTS,
  SIZES,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
  BUTTON_STYLES,
  CARD_STYLES,
  INPUT_STYLES,
};
