import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from './supabase'; // الاتصال الحي بالسيرفر السحابي

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
  // معرف الموزع التجريبي (سيتم ربطه ديناميكياً بحساب الموزع الفعلي عند تسجيل الدخول لاحقاً)
  const [driverId, setDriverId] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('فارس التوصيل السريع');
  const [deliveryCounter, setDeliveryCounter] = useState<number>(0);
  const [isSuspended, setIsSuspended] = useState<boolean>(false);
  const [totalOwed, setTotalOwed] = useState<number>(0);

  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeDriver();
  }, []);

  // جلب أول حساب موزع متاح في السيرفر لتشغيل اللوحة عليه تجريبياً
  const initializeDriver = async () => {
    setLoading(true);
    try {
      const { data: drivers, error } = await supabase.from('drivers').select('*').limit(1);
      if (error) throw error;

      if (drivers && drivers.length > 0) {
        setDriverId(drivers[0].id);
        setDriverName(drivers[0].name);
        setDeliveryCounter(drivers[0].delivery_counter);
        setIsSuspended(drivers[0].is_suspended);
        setTotalOwed(drivers[0].total_owed_to_site);
        fetchActiveOrder(drivers[0].id);
      }
    } catch (error: any) {
      console.log('Error initializing driver:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveOrder = async (id: string) => {
    try {
      // جلب الطلبيات المسندة لهذا الموزع والتي لم تكتمل بعد
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
        const ord = orders[0] as any;
        setActiveOrder({
          id: ord.id,
          items_summary: ord.items_summary,
          subtotal: ord.subtotal,
          delivery_fee: ord.delivery_fee,
          status: ord.status,
          store_name: ord.stores?.name || 'محل مسجل',
          store_zone: ord.stores?.zone || 'عين الصفراء'
        });
      } else {
        setActiveOrder(null);
      }
    } catch (error: any) {
      console.log('Error fetching active order:', error.message);
    }
  };

  // تحديث حالة الطلب إلى "مكتمل" وزيادة العداد في قاعدة البيانات السحابية تلقائياً
  const handleCompleteOrder = async () => {
    if (!activeOrder) return;

    try {
      setLoading(true);
      
      // 1. تحديث حالة الطلبية إلى مكتمل
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'مكتمل' })
        .eq('id', activeOrder.id);

      if (orderError) throw orderError;

      // 2. زيادة عداد التوصيل للموزع بمقدار +1
      const nextCounter = deliveryCounter + 1;
      const { error: driverError } = await supabase
        .from('drivers')
        .update({ delivery_counter: nextCounter })
        .eq('id', driverId);

      if (driverError) throw driverError;

      Alert.alert('ألف مبروك 🎉', 'تم إنهاء التوصيلة بنجاح وقبض 100 دج. قُمت بعمل رائع!');
      
      // إعادة تحديث البيانات من السيرفر لرؤية تأثير العداد أو الحظر الفوري
      initializeDriver();
    } catch (error: any) {
      Alert.alert('فشل تحديث الطلب', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#111A44" />
        <Text style={{ marginTop: 10, fontFamily: 'Cairo', color: '#111A44' }}>جاري تحديث بيانات الفارس...</Text>
      </View>
    );
  }

  // 🔒 إنفاذ نظام الأمان المالي: إذا كان الحساب محظوراً تظهر شاشة بريدي موب فوراً ويتوقف التطبيق عن العمل
  if (isSuspended) {
    return (
      <View style={styles.suspendedContainer}>
        <Text style={styles.suspendedTitle}>🔴 تم تجميد حسابك مؤقتاً!</Text>
        <Text style={styles.suspendedText}>لقد استوفيت الحد الأقصى المسموح به وهو (50 توصيلة) دون دفع مستحقات المنصة.</Text>
        
        <View style={styles.debtReportCard}>
          <Text style={styles.debtReportLabel}>إجمالي الديون المستحقة للموقع:</Text>
          <Text style={styles.debtReportValue}>{totalOwed} د.ج</Text>
        </View>

        <Text style={styles.instructionsText}>يرجى إرسال المبلغ عبر حساب بريدي موب (BaridiMob) التالي لإعادة تفعيل حسابك فوراً:</Text>
        <View style={styles.ccpCard}>
          <Text style={styles.ccpNumber}>RIP: 00799999000123456789</Text>
          <Text style={styles.ccpOwner}>بإسم: مدير منصة سوق إكسبريس</Text>
        </View>
        <Text style={styles.footerNote}>DZ Pro Vision - عين الصفراء</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* هيدر الموزع مع عداد التوصيلات المباشر من السيرفر */}
      <View style={styles.header}>
        <View style={styles.counterBox}>
          <Text style={styles.counterValue}>{deliveryCounter} / 50</Text>
          <Text style={styles.counterLabel}>الرحلات المنفذة</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.headerTitle}>مرحباً بالفارس: {driverName}</Text>
          <Text style={styles.headerSubtitle}>بوابة الموزع الرسمي داخل عين الصفراء</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* استعراض الطلب النشط الموكل للموزع حالياً */}
        <Text style={styles.sectionTitle}>📍 طلبيتك النشطة الحالية</Text>
        {activeOrder ? (
          <View style={styles.orderCard}>
            <View style={styles.orderHeaderRow}>
              <Text style={styles.orderStatusBadge}>{activeOrder.status}</Text>
              <Text style={styles.orderIdText}>طلب رقم: {activeOrder.id.substring(0, 6)}</Text>
            </View>

            <Text style={styles.infoLabel}>🏪 استلم السلعة من:</Text>
            <Text style={styles.infoValue}>{activeOrder.store_name} ({activeOrder.store_zone})</Text>

            <Text style={styles.infoLabel}>🛍️ محتويات الطلب للزبون:</Text>
            <Text style={styles.infoValue}>{activeOrder.items_summary}</Text>

            <View style={styles.divider} />

            <View style={styles.financialRow}>
              <Text style={styles.financePrice}>{activeOrder.delivery_fee} د.ج</Text>
              <Text style={styles.financeLabel}>🛵 حق التوصيل الخاص بك (ثابت):</Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financePrice}>{activeOrder.subtotal} د.ج</Text>
              <Text style={styles.financeLabel}>💰 سعر السلع المطلوب تحصيله:</Text>
            </View>

            <TouchableOpacity style={styles.completeButton} onPress={handleCompleteOrder}>
              <Text style={styles.completeButtonText}>🏁 تم توصيل الطلب بنجاح واستلام المبلغ</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>لا توجد طلبيات مسندة إليك حالياً. أنت في وضع الاستعداد لاستقبال الطلبات الجديدة! 🔄</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFD' },
  header: { backgroundColor: '#111A44', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 3, borderColor: '#F26522' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', fontFamily: 'Cairo' },
  headerSubtitle: { fontSize: 11, color: '#A0AEC0', fontFamily: 'Tajawal', marginTop: 2 },
  counterBox: { backgroundColor: 'rgba(255,255,255,0.08)', padding: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  counterValue: { fontSize: 14, fontWeight: 'bold', color: '#F26522' },
  counterLabel: { fontSize: 10, color: '#FFFFFF', fontFamily: 'Tajawal', marginTop: 2 },
  scrollContent: { paddingBottom: 30 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#111A44', marginHorizontal: 15, marginTop: 22, marginBottom: 10, textAlign: 'right', fontFamily: 'Cairo' },
  orderCard: { backgroundColor: '#FFFFFF', marginHorizontal: 15, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  orderHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  orderStatusBadge: { backgroundColor: '#FFF4E5', color: '#B76E00', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, fontSize: 12, fontWeight: 'bold', fontFamily: 'Cairo' },
  orderIdText: { fontSize: 13, color: '#718096', fontWeight: 'bold' },
  infoLabel: { fontSize: 12, color: '#718096', textAlign: 'right', marginTop: 10, fontFamily: 'Tajawal' },
  infoValue: { fontSize: 14, fontWeight: 'bold', color: '#111A44', textAlign: 'right', marginTop: 2, fontFamily: 'Cairo' },
  divider: { height: 1, backgroundColor: '#EDF2F7', my: 15, marginVertical: 15 },
  financialRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  financePrice: { fontSize: 15, fontWeight: 'bold', color: '#111A44' },
  financeLabel: { fontSize: 13, color: '#4A5568', fontFamily: 'Tajawal' },
  completeButton: { backgroundColor: '#137333', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  completeButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', fontFamily: 'Cairo' },
  emptyCard: { backgroundColor: '#FFFFFF', marginHorizontal: 15, borderRadius: 12, padding: 25, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#718096', textAlign: 'center', fontFamily: 'Tajawal', lineHeight: 22 },
  
  // شاشة الحظر التلقائي الصارمة
  suspendedContainer: { flex: 1, backgroundColor: '#FFFFFF', padding: 25, justifyContent: 'center', alignItems: 'center' },
  suspendedTitle: { fontSize: 22, fontWeight: 'bold', color: '#C5221F', fontFamily: 'Cairo', textAlign: 'center', marginBottom: 10 },
  suspendedText: { fontSize: 14, color: '#4A5568', textAlign: 'center', fontFamily: 'Tajawal', lineHeight: 24, marginBottom: 20 },
  debtReportCard: { backgroundColor: '#FCE8E6', padding: 15, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#F8D7DA' },
  debtReportLabel: { fontSize: 13, color: '#C5221F', fontFamily: 'Tajawal' },
  debtReportValue: { fontSize: 24, fontWeight: 'bold', color: '#C5221F', marginTop: 5 },
  instructionsText: { fontSize: 13, color: '#4A5568', textAlign: 'center', fontFamily: 'Tajawal', marginBottom: 15, lineHeight: 20 },
  ccpCard: { backgroundColor: '#111A44', padding: 20, borderRadius: 14, width: '100%', alignItems: 'center' },
  ccpNumber: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 1 },
  ccpOwner: { fontSize: 13, color: '#F26522', fontFamily: 'Cairo', marginTop: 8 },
  footerNote: { fontSize: 11, color: '#A0AEC0', fontFamily: 'Tajawal', marginTop: 30 }
});
