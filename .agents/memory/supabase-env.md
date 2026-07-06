---
name: Supabase credentials — env vars
description: How Supabase is configured in this Expo project
---

## Variables
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — publishable anon key (client-safe by design)

Both are set in Replit shared environment via setEnvVars.
See `.env.example` at project root for reference.

## Why EXPO_PUBLIC_
Expo bundles all `EXPO_PUBLIC_*` env vars into the JS bundle at build time.
These are not secrets — they're the equivalent of a public API key.
Never put service-role keys in EXPO_PUBLIC_ vars.

## Fail-fast
`src/supabase.ts` throws a clear error at startup if either var is missing.
This prevents silent failures where the app starts but all Supabase calls fail.
