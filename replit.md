# SOUG XPRESS

A local delivery marketplace platform for Ain El Safra, Algeria — connecting customers, merchants, and delivery drivers.

## Project Structure

```
apps/
  mobile/   — Expo/React Native app (main app, runs as web via Metro)
  web/      — Static React landing page (not yet configured to run)
docs/       — Architecture, design system, coding rules, roadmap
```

## Stack

- **Frontend**: Expo SDK 54 + Expo Router (file-based routing), React Native
- **Backend**: Supabase (auth, database, storage)
- **Language**: TypeScript

## Running the App

The mobile app runs as a web app in Replit via Metro bundler:

```
Workflow: "Start application"
Command:  cd apps/mobile && npx expo start --web --port 5000
```

- Open the preview pane to see the app at port 5000
- To run on a real device: scan the Expo QR code shown in the workflow console with **Expo Go**

## Supabase

Credentials are hardcoded in `apps/mobile/src/supabase.ts`. The project connects to `vztpzxigxmgbpakkbyrs.supabase.co`.

## User Roles

- **Customer** — browses stores, places orders, comments on posts
- **Merchant** — manages store inventory and incoming orders  
- **Delivery Driver (Farsan)** — picks up and delivers orders
- **Admin** — platform administration

## User Preferences

- Keep Arabic (RTL) UI direction throughout the app
- Maintain existing project structure (monorepo with apps/mobile and apps/web)
