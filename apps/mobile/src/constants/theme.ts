/**
 * SOUG XPRESS — Shared Design System
 *
 * Single source of truth for colors, spacing, radii, shadows, and typography.
 * Import named tokens rather than hardcoding hex values in StyleSheets.
 */

// ── Colors ────────────────────────────────────────────────────────────────────

export const Colors = {
  // Brand
  primary:      '#F26522', // orange — CTA buttons, active states, accents
  primaryLight: '#FFF5F0', // tinted background for primary elements
  primaryMid:   'rgba(242, 101, 34, 0.10)',

  // Navy — header backgrounds, primary text
  navyDark: '#111A44', // used in admin / delivery / merchant headers
  navyMid:  '#1B2A6B', // used in customer header, section titles

  // Neutrals
  white:       '#FFFFFF',
  bgScreen:    '#F5F6FA', // unified screen background
  bgCard:      '#FFFFFF',
  bgSubtle:    '#F8FAFC', // input backgrounds, subtle fills
  border:      '#E2E8F0',
  borderLight: '#EFEFEF',

  // Text
  textPrimary:   '#111A44',
  textBody:      '#2D3748',
  textSecondary: '#4A5568',
  textMuted:     '#718096',
  textOnDark:    '#FFFFFF',
  textOnDarkMuted: '#A0AEC0',

  // Semantic — status badges, alert cards
  success:   '#137333',
  successBg: '#E6F4EA',
  danger:    '#C5221F',
  dangerBg:  '#FCE8E6',
  warning:   '#B06000',
  warningBg: '#FEF7E0',
  info:      '#1A73E8',
  infoBg:    '#E8F0FE',

  // Role-badge accents
  customerBadgeBg:   '#EBF8FF',
  customerBadgeText: '#2B6CB0',
  driverBadgeBg:     '#FEFCBF',
  driverBadgeText:   '#744210',
};

// ── Spacing (px) ──────────────────────────────────────────────────────────────

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 15,
  lg:   20,
  xl:   24,
  xxl:  32,
  /** Safe-area top padding for role-specific headers */
  headerTop: 48,
};

// ── Border radius ─────────────────────────────────────────────────────────────

export const Radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  full: 999,
};

// ── Shadows ───────────────────────────────────────────────────────────────────

export const Shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  tabBar: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryBtn: {
    shadowColor: '#F26522',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
};

// ── Typography ────────────────────────────────────────────────────────────────

export const Typography = {
  heading1:  { fontSize: 22, fontWeight: 'bold' as const, fontFamily: 'Cairo' },
  heading2:  { fontSize: 18, fontWeight: 'bold' as const, fontFamily: 'Cairo' },
  heading3:  { fontSize: 15, fontWeight: 'bold' as const, fontFamily: 'Cairo' },
  body:      { fontSize: 14, fontFamily: 'Tajawal' },
  bodySmall: { fontSize: 12, fontFamily: 'Tajawal' },
  caption:   { fontSize: 11, fontFamily: 'Tajawal' },
  label:     { fontSize: 12, fontWeight: 'bold' as const, fontFamily: 'Cairo' },
};

// ── Reusable style fragments ──────────────────────────────────────────────────

/** Shared role-screen header — navy dark + orange bottom accent */
export const headerBase = {
  backgroundColor: Colors.navyDark,
  paddingHorizontal: Spacing.lg,
  paddingTop: Spacing.headerTop,
  paddingBottom: Spacing.lg,
  borderBottomWidth: 3,
  borderColor: Colors.primary,
};

/** Standard white card with light border */
export const cardBase = {
  backgroundColor: Colors.bgCard,
  borderRadius: Radius.lg,
  borderWidth: 1,
  borderColor: Colors.border,
  padding: Spacing.base,
  marginHorizontal: Spacing.base,
  ...Shadow.card,
};

/** Primary CTA button — orange */
export const btnPrimary = {
  backgroundColor: Colors.primary,
  paddingVertical: 14,
  borderRadius: Radius.md,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  ...Shadow.primaryBtn,
};

export const btnPrimaryText = {
  color: Colors.white,
  fontSize: 16,
  fontWeight: 'bold' as const,
  fontFamily: 'Cairo',
};
