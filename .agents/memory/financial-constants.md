---
name: Financial constants
description: Where platform financial values live and how to use them
---

## Single source of truth
All platform financial constants live in `apps/mobile/src/constants/financial.ts`.
Never hardcode RIP numbers, commission rates, or fee amounts elsewhere.

## Key constants
- BARIDIMOB_RIP — payment account for driver/merchant fees (VERIFY with owner)
- DELIVERY_FEE_DZD = 100
- PLATFORM_DELIVERY_COMMISSION_PCT = 0.20 (20%)
- DRIVER_PROFIT_PER_TRIP_DZD = 80
- PLATFORM_CUT_PER_TRIP_DZD = 20
- DRIVER_SUSPENSION_THRESHOLD = 50 trips
- MERCHANT_COMMISSION_PCT = 0.05 (month 2+; month 1 = free)

## RIP conflict history
Two different RIP numbers existed in the old codebase:
- 00799999000524201107 — from (tabs)/delivery.tsx ← chosen as canonical
- 00799999000123456789 — from src/app/delivery.tsx (now .bak)
Platform owner must confirm the correct value before production.

## Promo data shape
DB columns are snake_case (original_price, promo_price).
UI state uses camelCase (originalPrice, promoPrice).
Always run DB rows through toPromoItem() in (tabs)/merchant.tsx when reading or inserting.

**Why:** PromoItem interface and toPromoItem() normalizer exist in (tabs)/merchant.tsx to bridge this.
Without normalization, prices render as undefined in the promo list.
