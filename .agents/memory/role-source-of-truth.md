---
name: Role source of truth
description: How and where user roles are read and written in SOUG XPRESS
---

## Rule
`profiles.role` (Supabase DB table) is the single source of truth for user roles.
`user.user_metadata.role` is NEVER used — the app never writes to it.

## Role enum
`'customer' | 'merchant' | 'delivery' | 'admin' | null`
Defined in `src/context/AuthContext.tsx` > `UserProfile.role`.

**Why:** `(tabs)/_layout.tsx` previously read from `user_metadata.role`, which is never populated by `register.tsx`. This caused merchant tab to always be hidden. Fixed in Phase 1.

## Where roles are read
- `AuthContext.tsx` → fetches from `profiles` table, exposes via `useAuth()`
- `_layout.tsx` → role-based routing using `userProfile.role`
- `(tabs)/_layout.tsx` → tab visibility using `userProfile.role` via `useAuth()`
- `admin.tsx` → guard using `userProfile.role === 'admin'`

## Where roles are written
- `register.tsx` → `supabase.from('profiles').upsert({ role: chosenRole })`
- Only the `profiles` table is updated — never `user_metadata`
