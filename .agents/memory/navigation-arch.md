---
name: Navigation architecture
description: Route structure and auth guard logic for SOUG XPRESS
---

## Auth guard (_layout.tsx)
- Unauthenticated + at `/` → allowed (public onboarding/feed)
- Unauthenticated + elsewhere → redirect to `/login`
- Authenticated + no role or incomplete profile → redirect to `/register`
- Authenticated + role=merchant → force to `/(tabs)/merchant`
- Authenticated + role=delivery → force to `/(tabs)/delivery`
- Authenticated + role=admin → free navigation (no force-redirect)
- Authenticated + role=customer (default) → force to `/(tabs)/home`

## All registered Stack screens
`index, login, register, callback, admin, merchant, delivery, (tabs)`

## Admin access
- Long-press logo in `(tabs)/home.tsx` → navigates to `/admin`
- `admin.tsx` has internal guard: `userProfile.role !== 'admin'` → `<Redirect href="/(tabs)/home" />`
- Hooks are declared before conditional returns (Rules of Hooks compliant)

## Orphaned screens (Phase 2 decision pending)
- `src/app/merchant.tsx` — full merchant dashboard, not reachable via normal navigation
- `src/app/delivery.tsx` — full delivery dashboard, not reachable via normal navigation
