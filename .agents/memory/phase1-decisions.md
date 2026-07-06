---
name: Phase 1 + Phase 2 cleanup decisions
description: What was done in Phase 1 (stabilization) and Phase 2 (screen merge) and what is deferred
---

## Done in Phase 1
- profiles.role is now the single source of truth (AuthContext + all consumers)
- Admin panel protected: useAuth() guard with hooks-before-returns pattern
- index.tsx (onboarding + public feed) reachable for unauthenticated users
- Supabase credentials moved to EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
- setup_onboarding.js excluded from TypeScript via tsconfig.json exclude
- expo-font@14.0.12 + @expo-google-fonts/cairo + @expo-google-fonts/tajawal installed; fonts loaded in RootLayout before AuthProvider
- Import order fixed in login.tsx (imports before executable statements)
- TypeScript: 0 errors (tsc --noEmit clean)
- Mock data marked with TODO(Phase 2/3) comments in home/merchant/delivery tabs
- Delivery tab unauthenticated fallback removed (no longer leaks random driver data)
- driverId / merchantId typed as string | null (not plain null)

## Done in Phase 2
- src/constants/financial.ts created: single source of truth for BARIDIMOB_RIP,
  DELIVERY_FEE_DZD, PLATFORM_DELIVERY_COMMISSION_PCT, DRIVER_PROFIT_PER_TRIP_DZD,
  PLATFORM_CUT_PER_TRIP_DZD, DRIVER_SUSPENSION_THRESHOLD, MERCHANT_COMMISSION_PCT
- (tabs)/delivery.tsx: merged full version (real orders) + tab version (progress bar,
  financial breakdown card, BaridiMob payment card using shared constant)
- (tabs)/merchant.tsx: merged full version (image upload, post publishing, real comments)
  + tab version (policy banner, financial dashboard, real promo management via promotions table)
- PromoItem interface + toPromoItem() normalizer: DB snake_case → UI camelCase (no shape mismatch)
- Promo initial state changed to [] (no mock seed); DB result always overrides state
- src/app/merchant.tsx → merchant.tsx.bak (deprecated, non-routed)
- src/app/delivery.tsx → delivery.tsx.bak (deprecated, non-routed)
- Stale Stack.Screen entries for "merchant" and "delivery" removed from _layout.tsx
- OrderQueryRow interface in delivery.tsx: no more `as any` casts for join query results

## Deferred to Phase 3
- Removing/deleting .bak files (after user confirms no regressions)
- Replacing mock totalSales in merchant dashboard with real `orders` table aggregation
- Removing hardcoded mock stores fallback in home.tsx
- OAuth callback: replace manual token parsing with exchangeCodeForSession
- Navigation race condition on slow connections (profile fetch delay)
- BaridiMob RIP final confirmation with platform owner (one of two values; VERIFY comment in financial.ts)

## Deferred to later phases
- Web app (apps/web/) has no runtime — needs framework setup
- Docs (docs/*.md) all empty
- TypeScript strict mode (would introduce many new errors)
