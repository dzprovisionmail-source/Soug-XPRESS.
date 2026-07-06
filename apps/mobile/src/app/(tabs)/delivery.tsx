/**
 * DeliveryDashboard — Canonical delivery driver screen.
 *
 * Merged from:
 *   • src/app/delivery.tsx        → real orders, order completion, driver DB fetch
 *   • src/app/(tabs)/delivery.tsx → progress bar, financial breakdown, BaridiMob card
 *
 * src/app/delivery.tsx has been renamed to delivery.tsx.bak (deprecated).
 */
import React, { useState, useEffect } from 'react';

/** Typed result for the orders + stores join query */
interface OrderQueryRow {
  id: string;
  items_summary: string;
  subtotal: number;
  delivery_fee: number;
  status: string;
  stores: { name: string; zone: string } | null;
}
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { supabase } from '../../supabase';
import { Colors, Spacing, Radius, Shadow } from '../../constants/theme';
import {
  BARIDIMOB_RIP,
  DELIVERY_FEE_DZD,
  PLATFORM_DELIVERY_COMMISSION_PCT,
  DRIVER_PROFIT_PER_TRIP_DZD,
  PLATFORM_CUT_PER_TRIP_DZD,
  DRIVER_SUSPENSION_THRESHOLD,
} from '../../constants/financial';

interface ActiveOrder {
  id: string;
  items_summary: string;
  subtotal: number;
  delivery_fee: number;
  status: string;
  store_name: string;
  store_zone: string;
}

export default function DeliveryDashboard() {
  const [driverId, setDriverId] = useState<string | null>(null);
  const [driverName, setDriverName] = useState<string>('فارس التوصيل السريع');
  const [deliveryCounter, setDeliveryCounter] = useState<number>(0);
  const [isSuspended, setIsSuspended] = useState<boolean>(false);
  const [totalOwed, setTotalOwed] = useState<number>(0);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [loading, setLoading] = useState(false);

  // Derived financial values — calculated from the real DB counter
  const totalDriverEarnings = deliveryCounter * DRIVER_PROFIT_PER_TRIP_DZD;
  const totalOwedToSite = deliveryCounter * PLATFORM_CUT_PER_TRIP_DZD;

  useEffect(() => {
    initializeDriver();
  }, []);

  /** Load the current driver's row from the `drivers` table */
  const initializeDriver = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // No authenticated session — do not fall back to loading a random driver's data
        console.log('[DeliveryDashboard] No active session. Skipping driver data load.');
        return;
      }

      const { data: driverData, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (driverData) {
        setDriverId(driverData.id);
        setDriverName(driverData.name);
        setDeliveryCounter(driverData.delivery_counter);
        setIsSuspended(driverData.is_suspended);
        setTotalOwed(driverData.total_owed_to_site);
        fetchActiveOrder(driverData.id);
      }
    } catch (error: unknown) {
      console.log('[DeliveryDashboard] Error initializing driver:',
        error instanceof Error ? error.message : error);
    } finally {
      setLoading(false);
    }
  };

  /** Fetch the single active (non-completed) order assigned to this driver */
  const fetchActiveOrder = async (id: string) => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id, items_summary, subtotal, delivery_fee, status,
          stores ( name, zone )
        `)
        .eq('driver_id', id)
        .neq('status', 'مكتمل')
        .limit(1);

      if (error) throw error;

      if (orders && orders.length > 0) {
        const ord = orders[0] as unknown as OrderQueryRow;
        setActiveOrder({
          id: ord.id,
          items_summary: ord.items_summary,
          subtotal: ord.subtotal,
          delivery_fee: ord.delivery_fee,
          status: ord.status,
          store_name: ord.stores?.name || 'محل مسجل',
          store_zone: ord.stores?.zone || 'عين الصفراء',
        });
      } else {
        setActiveOrder(null);
      }
    } catch (error: unknown) {
      console.log('[DeliveryDashboard] Error fetching active order:',
        error instanceof Error ? error.message : error);
    }
  };

  /** Mark the active order complete and increment the driver counter */
  const handleCompleteOrder = async () => {
    if (!activeOrder || !driverId) return;
    try {
      setLoading(true);

      // 1. Mark order as complete
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'مكتمل' })
        .eq('id', activeOrder.id);
      if (orderError) throw orderError;

      // 2. Increment driver counter (and suspend if threshold reached)
      const nextCounter = deliveryCounter + 1;
      const willSuspend = nextCounter >= DRIVER_SUSPENSION_THRESHOLD;
      const { error: driverError } = await supabase
        .from('drivers')
        .update({ delivery_counter: nextCounter, is_suspended: willSuspend })
        .eq('id', driverId);
      if (driverError) throw driverError;

      Alert.alert('ألف مبروك 🎉', 'تم إنهاء التوصيلة بنجاح وقبض حق التوصيل. قُمت بعمل رائع يا بطل!');
      initializeDriver(); // Refresh all data from DB
    } catch (error: unknown) {
      Alert.alert('فشل تحديث الطلب', error instanceof Error ? error.message : 'خطأ غير معروف');
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.navyDark} />
        <Text style={{ marginTop: Spacing.sm, fontFamily: 'Cairo', color: Colors.navyDark, fontSize: 13 }}>
          جاري تحديث بيانات الفارس ميدانياً...
        </Text>
      </View>
    );
  }

  // ── Suspended full-screen view ─────────────────────────────────────────────

  if (isSuspended) {
    return (
      <View style={styles.suspendedContainer}>
        <Text style={styles.suspendedTitle}>🔴 تم تجميد حسابك مؤقتاً!</Text>
        <Text style={styles.suspendedText}>
          لقد استوفيت الحد الأقصى المسموح به وهو ({DRIVER_SUSPENSION_THRESHOLD} توصيلة) دون دفع مستحقات المنصة.
        </Text>
        <View style={styles.debtReportCard}>
          <Text style={styles.debtReportLabel}>إجمالي الديون المستحقة للموقع:</Text>
          <Text style={styles.debtReportValue}>{totalOwed} دج</Text>
        </View>
        <Text style={styles.instructionsText}>
          يرجى إرسال المبلغ عبر حساب بريدي موب (BaridiMob) التالي لإعادة تفعيل حسابك فوراً من طرف الإدارة:
        </Text>
        <View style={styles.ccpCard}>
          <Text style={styles.ccpNumber}>RIP: {BARIDIMOB_RIP}</Text>
          <Text style={styles.ccpOwner}>بإسم: مدير منصة سوق إكسبريس</Text>
        </View>
        <Text style={styles.footerNote}>DZ Pro Vision • عين الصفراء</Text>
      </View>
    );
  }

  // ── Main screen ────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      {/* Header: driver name + trip counter */}
      <View style={styles.header}>
        <View style={styles.counterBox}>
          <Text style={styles.counterValue}>{deliveryCounter} / {DRIVER_SUSPENSION_THRESHOLD}</Text>
          <Text style={styles.counterLabel}>الرحلات المنفذة</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.headerTitle}>مرحباً بالفارس: {driverName}</Text>
          <Text style={styles.headerSubtitle}>بوابة الموزع الرسمي داخل عين الصفراء</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Financial stats + progress bar (from tab version) ── */}
        <Text style={styles.sectionTitle}>
          العداد والحاسبة المالية (دورة {DRIVER_SUSPENSION_THRESHOLD} توصيلة)
        </Text>
        <View style={styles.statsCard}>
          <View style={styles.statsCounterRow}>
            <Text style={styles.statsCounterValue}>{deliveryCounter} / {DRIVER_SUSPENSION_THRESHOLD}</Text>
            <Text style={styles.statsCounterLabel}>التوصيلات المكتملة:</Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                // React Native accepts percentage strings as DimensionValue; cast needed for TS template literal
                { width: `${Math.min((deliveryCounter / DRIVER_SUSPENSION_THRESHOLD) * 100, 100)}%` as `${number}%` },
              ]}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.financeRow}>
            <Text style={[styles.financeValue, { color: Colors.success }]}>{totalDriverEarnings} د.ج</Text>
            <Text style={styles.financeLabel}>
              صافي أرباحك كاش ({DRIVER_PROFIT_PER_TRIP_DZD} دج/رحلة):
            </Text>
          </View>
          <View style={styles.financeRow}>
            <Text style={[styles.financeValue, { color: Colors.danger }]}>{totalOwedToSite} د.ج</Text>
            <Text style={styles.financeLabel}>
              مستحقات الموقع ({PLATFORM_CUT_PER_TRIP_DZD} دج/رحلة):
            </Text>
          </View>
        </View>

        {/* ── BaridiMob payment info (from tab version, now uses shared constant) ── */}
        <Text style={styles.sectionTitle}>معلومات الدفع للمنصة</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            يمكنك تصفية مستحقات الموقع في أي وقت عبر تطبيق بريدي موب لإعادة تصفير العداد:
          </Text>
          <Text style={styles.ripText}>RIP: {BARIDIMOB_RIP}</Text>
          <Text style={styles.infoSubtext}>
            سعر التوصيل داخل المدينة ثابت: {DELIVERY_FEE_DZD} د.ج (اقتطاع {PLATFORM_DELIVERY_COMMISSION_PCT * 100}% للموقع).
          </Text>
        </View>

        {/* ── Active order (from full version — real Supabase orders) ── */}
        <Text style={styles.sectionTitle}>📍 طلبيتك النشطة الحالية</Text>
        {activeOrder ? (
          <View style={styles.orderCard}>
            <View style={styles.orderHeaderRow}>
              <Text style={styles.orderStatusBadge}>{activeOrder.status}</Text>
              <Text style={styles.orderIdText}>طلب رقم: {activeOrder.id.substring(0, 6)}</Text>
            </View>
            <Text style={styles.orderInfoLabel}>🏪 استلم السلعة من:</Text>
            <Text style={styles.orderInfoValue}>
              {activeOrder.store_name} ({activeOrder.store_zone})
            </Text>
            <Text style={styles.orderInfoLabel}>🛍️ محتويات الطلب للزبون:</Text>
            <Text style={styles.orderInfoValue}>{activeOrder.items_summary}</Text>
            <View style={styles.divider} />
            <View style={styles.financialRow}>
              <Text style={styles.financePrice}>{activeOrder.delivery_fee} دج</Text>
              <Text style={styles.orderFinanceLabel}>🛵 حق التوصيل الخاص بك (ثابت):</Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financePrice}>{activeOrder.subtotal} دج</Text>
              <Text style={styles.orderFinanceLabel}>💰 سعر السلع المطلوب تحصيله:</Text>
            </View>
            <TouchableOpacity style={styles.completeButton} onPress={handleCompleteOrder}>
              <Text style={styles.completeButtonText}>
                🏁 تم توصيل الطلب بنجاح واستلام المبلغ
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              لا توجد طلبيات مسندة إليك حالياً بالمنصة. أنت في وضع الاستعداد لاستقبال وإقلاع الطلبات الجديدة! 🔄
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgScreen },

  // Header
  header: {
    backgroundColor: Colors.navyDark,
    padding: Spacing.lg,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderColor: Colors.primary,
    paddingTop: Spacing.headerTop,
  },
  headerTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.white, fontFamily: 'Cairo' },
  headerSubtitle: { fontSize: 10, color: Colors.textOnDarkMuted, fontFamily: 'Tajawal', marginTop: 2 },
  counterBox: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    minWidth: 75,
  },
  counterValue: { fontSize: 13, fontWeight: 'bold', color: Colors.primary, fontFamily: 'Tajawal' },
  counterLabel: { fontSize: 9, color: Colors.white, fontFamily: 'Tajawal', marginTop: 1 },

  // Layout
  scrollContent: { paddingBottom: 30 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.navyDark,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    textAlign: 'right',
    fontFamily: 'Cairo',
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },

  // Stats card (progress bar + financial breakdown)
  statsCard: {
    backgroundColor: Colors.bgCard,
    marginHorizontal: Spacing.base,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.card,
  },
  statsCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statsCounterValue: { fontSize: 18, fontWeight: 'bold', color: Colors.navyMid },
  statsCounterLabel: { fontSize: 14, fontWeight: 'bold', color: Colors.textBody, fontFamily: 'Cairo' },
  progressBarBackground: {
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  financeValue: { fontSize: 15, fontWeight: 'bold' },
  financeLabel: { fontSize: 13, color: Colors.textMuted, fontFamily: 'Tajawal' },

  // Payment info card
  infoCard: {
    backgroundColor: Colors.infoBg,
    marginHorizontal: Spacing.base,
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.info,
  },
  infoText: { fontSize: 13, color: Colors.navyMid, textAlign: 'right', fontFamily: 'Tajawal' },
  ripText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginVertical: Spacing.sm,
  },
  infoSubtext: { fontSize: 11, color: Colors.textSecondary, textAlign: 'right', fontFamily: 'Tajawal' },

  // Active order card
  orderCard: {
    backgroundColor: Colors.bgCard,
    marginHorizontal: Spacing.base,
    borderRadius: Radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  orderHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  orderStatusBadge: {
    backgroundColor: Colors.warningBg,
    color: Colors.warning,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
    overflow: 'hidden',
  },
  orderIdText: { fontSize: 13, color: Colors.textMuted, fontWeight: 'bold', fontFamily: 'Tajawal' },
  orderInfoLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: Spacing.sm,
    fontFamily: 'Tajawal',
  },
  orderInfoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.navyDark,
    textAlign: 'right',
    marginTop: 2,
    fontFamily: 'Cairo',
  },
  financialRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  financePrice: { fontSize: 15, fontWeight: 'bold', color: Colors.navyDark, fontFamily: 'Tajawal' },
  orderFinanceLabel: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'Tajawal' },
  completeButton: {
    backgroundColor: Colors.success,
    paddingVertical: Spacing.base,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginTop: Spacing.lg,
    ...Shadow.medium,
  },
  completeButtonText: { color: Colors.white, fontSize: 13, fontWeight: 'bold', fontFamily: 'Cairo' },

  // Empty order state
  emptyCard: {
    backgroundColor: Colors.bgCard,
    marginHorizontal: Spacing.base,
    borderRadius: Radius.lg,
    padding: 25,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadow.card,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    fontFamily: 'Tajawal',
    lineHeight: 22,
  },

  // Suspended full-screen
  suspendedContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suspendedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.danger,
    fontFamily: 'Cairo',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  suspendedText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Tajawal',
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  debtReportCard: {
    backgroundColor: Colors.dangerBg,
    padding: Spacing.base,
    borderRadius: Radius.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#F8D7DA',
  },
  debtReportLabel: { fontSize: 13, color: Colors.danger, fontFamily: 'Tajawal' },
  debtReportValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.danger,
    marginTop: Spacing.xs,
    fontFamily: 'Tajawal',
  },
  instructionsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Tajawal',
    marginBottom: Spacing.base,
    lineHeight: 22,
  },
  ccpCard: {
    backgroundColor: Colors.navyDark,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    width: '100%',
    alignItems: 'center',
  },
  ccpNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.white,
    letterSpacing: 0.5,
    fontFamily: 'Tajawal',
  },
  ccpOwner: { fontSize: 12, color: Colors.primary, fontFamily: 'Cairo', marginTop: Spacing.sm },
  footerNote: { fontSize: 10, color: Colors.textOnDarkMuted, fontFamily: 'Tajawal', marginTop: 40 },
});
