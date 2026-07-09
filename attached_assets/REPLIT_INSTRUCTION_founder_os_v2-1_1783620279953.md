# Replit Instruction — Soug-XPRESS V2 Founder OS Skeleton

Create Soug-XPRESS V2 in a clean path: `apps/mobile-v2/`.

Do not modify `apps/mobile/` (legacy — has known unresolved issues: an
unresolved git merge conflict in merchant.tsx, phone_autoconfirm security
risk, conflicting BaridiMob RIP numbers. These are tracked separately and
are NOT fixed by this task.)

Do not modify Supabase.
Do not delete legacy files.

V2 must start with the Founder Operating System, not customer screens.

Create the Expo/React Native skeleton with Expo Router and TypeScript.

---

## Folder Structure

Create:

```
apps/mobile-v2/src/app/
- index.tsx
- login.tsx
- founder/_layout.tsx
- founder/index.tsx

apps/mobile-v2/src/features/founder-os/
- dashboard/
- zones/
- users/
- merchants/
- stores/
- products/
- orders/
- drivers/
- finance/
- promotions/
- disputes/
- settings/
- ai-control/
- audit-logs/

apps/mobile-v2/src/types/
- (typed interfaces — see Schema Alignment below)

apps/mobile-v2/src/constants/
- ain-sefra-zones.ts
```

**Note:** No `cities/` module. This platform targets Ain Sefra only for now — "zones" (neighborhoods) is the correct and only geographic concept for V2, per `docs/v2/03_DATABASE_SCHEMA.md`'s `delivery_zones` table.

---

## Official Ain Sefra Zones (Required Constant)

Create `apps/mobile-v2/src/constants/ain-sefra-zones.ts` with exactly this list, in this order, as the single source of truth for zone dropdowns, store registration, delivery addresses, and search filters:

```typescript
export const AIN_SEFRA_ZONES = [
  "حي وسط المدينة (الفيلاج)",
  "حي بني الجديد (طريق بشار)",
  "شارع بوعرفة عبد الرحمن (لوطوروت)",
  "حي برج الحمام",
  "حي الكاسطور",
  "حي 19 مارس",
  "حي امزي (بومريفق)",
  "حي الوئام",
  "حي السلام (المويلح)",
  "حي عمارات الصين (شناوا)",
  "حي 17 أكتوبر (الحمار)",
  "حي الاشتراك",
  "حي الحرارة",
  "عمارات مقابل المستشفى",
  "حي بني بالڤرع",
  "حي بني وهراني",
  "حي القصر",
  "حي حيدرة (حضري)",
  "حي الرمال (غزة)",
  "حي النصر (المناكيب)",
  "حي مولاي الهاشمي (القرابة)",
  "عين الرشاڤ",
  "عين الصفراء الجديدة",
  "حي 52 مسكن",
  "الظلعة 1",
  "الظلعة 2",
  "الظلعة 3",
  "الظلعة 4",
] as const;

export type AinSefraZone = typeof AIN_SEFRA_ZONES[number];
```

This list feeds the `zones/` module in `founder-os/` (Admin manages/seeds these as `delivery_zones` rows once Supabase is connected) and will later back the `zone_id` dropdown used in store registration, customer addresses, and market_home_sections zone scoping (per `03c_MARKET_INTERFACE_SCHEMA.md`).

---

## Schema Alignment (Mandatory — Not Optional)

Before writing any screen, read these approved documents (attached/provided in `docs/v2/`):
- `03_DATABASE_SCHEMA.md`
- `03b_DATABASE_SCHEMA_ADDENDUM.md`
- `03c_MARKET_INTERFACE_SCHEMA.md`

For every module (stores, orders, drivers, finance, zones, etc.), define a TypeScript interface in `apps/mobile-v2/src/types/` that matches the corresponding table's columns **exactly** as documented — names, types, enums. Examples of what must be respected:

- `stores.status` uses the enum `'pending_approval' | 'active' | 'paused' | 'suspended' | 'closed'` — **not** the legacy app's boolean `is_approved`
- `orders.status` uses the 11-value English state machine from `03` (`placed`, `accepted`, `preparing`, `ready_for_pickup`, `driver_assigned`, `picked_up`, `delivering`, `delivered`, `cancelled`, `disputed`, `refunded`) — **not** the legacy app's Arabic string `'مكتمل'`
- `delivery_zones` matches `03`'s definition (`id`, `name`, `center_lat`, `center_lng`, `radius_km`, `base_delivery_fee`, `is_active`) — seeded from `AIN_SEFRA_ZONES` above, one row per zone name, coordinates to be filled in later
- `drivers` matches `03`'s definition (`vehicle_type`, `zone_id`, `current_status` enum `'offline'|'online'|'on_delivery'`, `rating_avg`, etc.) — **not** the legacy app's simplified `delivery_counter`/`total_owed_to_site` shape
- Finance-related types reflect `wallets`/`transactions` from `03` (owner-scoped balance + append-only ledger) — **not** the legacy app's single `total_owed_to_site` integer

Do not connect to Supabase yet — but the mock/placeholder data used in each screen **must** conform to these typed interfaces, so that wiring in real Supabase queries later requires no interface rework.

---

## First Real Screen

Create `apps/mobile-v2/src/app/founder/index.tsx`:

- Founder Operating System dashboard, Arabic RTL
- Show module cards for: الأحياء، المستخدمون، التجار، المتاجر، المنتجات، الطلبات، السائقون، المالية، العروض، النزاعات، الإعدادات، الذكاء الاصطناعي، سجل العمليات
- Each card uses mock data that satisfies the typed interfaces defined above — not arbitrary placeholder numbers disconnected from any schema

---

## Constraints

- Make it runnable
- Commit and push
- Do not implement full CRUD features yet — skeleton + typed structure only

---

## Report Back

1. Files created (full list)
2. Typed interfaces created, and which schema document (`03`/`03b`/`03c`) each one maps to
3. Confirmation that `AIN_SEFRA_ZONES` matches the list above exactly (28 zones)
4. Run command
5. Whether the app starts without errors
6. Commit hash

---

## Important — Hard Stop Condition

If `docs/v2/03_DATABASE_SCHEMA.md`, `docs/v2/03b_DATABASE_SCHEMA_ADDENDUM.md`, or `docs/v2/03c_MARKET_INTERFACE_SCHEMA.md` are missing, **stop immediately and report the missing files. Do not invent interfaces or schema types.**

Do not proceed with a "best guess" version of any typed interface. Do not fall back to the legacy `apps/mobile/` shapes (e.g. `is_approved`, Arabic `orders.status` strings, `total_owed_to_site`) as a substitute. If the schema documents are not present in the repository, the correct action is to halt and report exactly which file(s) are missing, so they can be added before this task continues.
