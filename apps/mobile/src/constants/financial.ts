/**
 * SOUG XPRESS — Platform Financial Constants
 *
 * IMPORTANT: Verify BARIDIMOB_RIP before going to production.
 * Two different RIP numbers were found in the codebase:
 *   - 00799999000524201107  (was in src/app/(tabs)/delivery.tsx)
 *   - 00799999000123456789  (was in src/app/delivery.tsx)
 * The first has been used as the canonical value. Confirm with the platform owner.
 */

/** BaridiMob RIP account for platform fee payments — single source of truth */
export const BARIDIMOB_RIP = '00799999000524201107';

/** Fixed delivery fee charged to customers (DZD) */
export const DELIVERY_FEE_DZD = 100;

/** Platform's commission percentage per delivery trip (20%) */
export const PLATFORM_DELIVERY_COMMISSION_PCT = 0.20;

/** Driver's net profit per trip: 80 DZD */
export const DRIVER_PROFIT_PER_TRIP_DZD =
  DELIVERY_FEE_DZD * (1 - PLATFORM_DELIVERY_COMMISSION_PCT);

/** Platform's cut per trip: 20 DZD */
export const PLATFORM_CUT_PER_TRIP_DZD =
  DELIVERY_FEE_DZD * PLATFORM_DELIVERY_COMMISSION_PCT;

/** Driver account suspended after this many unpaid trips */
export const DRIVER_SUSPENSION_THRESHOLD = 50;

/** Amount driver owes after one full cycle (50 trips × 20 DZD) */
export const DRIVER_FULL_CYCLE_DEBT_DZD =
  DRIVER_SUSPENSION_THRESHOLD * PLATFORM_CUT_PER_TRIP_DZD;

/**
 * Merchant commission rate — no commission on merchants.
 * Platform charges 0%; kept as a named constant so any future
 * policy change is a single-line edit here.
 */
export const MERCHANT_COMMISSION_PCT = 0;
