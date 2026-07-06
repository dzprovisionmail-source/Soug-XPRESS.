---
name: Phase 1 cleanup decisions
description: What was done in Phase 1 stabilization and what is deferred
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
- Mock data marked with TODO(Phase 2) comments in home/merchant/delivery tabs
- Delivery tab unauthenticated fallback removed (no longer leaks random driver data)
- driverId / merchantId typed as string | null (not plain null)

## Deferred to Phase 2
- Merging/choosing canonical merchant and delivery screens (duplicate issue C-1)
- Removing mock data (replace with real DB queries + empty states)
- BaridiMob RIP number inconsistency (two different numbers in delivery screens)
- OAuth callback: replace manual token parsing with exchangeCodeForSession
- Navigation race condition on slow connections (profile fetch delay)

## Deferred to later phases
- Web app (apps/web/) has no runtime — needs framework setup
- Docs (docs/*.md) all empty
- TypeScript strict mode (would introduce many new errors)
- setup_onboarding.js deletion (excluded but still present)
