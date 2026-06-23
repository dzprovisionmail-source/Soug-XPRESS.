import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

export default function DeliveryDashboard() {
  // محاكاة لعدد التوصيلات الحالية للموزع
  const [deliveryCounter, setDeliveryCounter] = useState(0);
  const [driverId, setDriverId] = useState(null);

  useEffect(() => {
    async function loadDriverData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setDriverId(user.id);
          const { data: driverData } = await supabase.from('drivers').select('delivery_counter, is_suspended').eq('id', user.id).single();
          if (driverData) {
            setDeliveryCounter(driverData.delivery_counter || 0);
            setIsSuspended(driverData.is_suspended || false);
          }
        }
      } catch (err) { console.log(err); }
    }
    loadDriverData();
  }, []); 
  const [isSuspended, setIsSuspended] = useState(false);

  // إعدادات النظام المالي الثابتة
  const DELIVERY_FEE = 100; // سعر التوصيل الثابت داخل المدينة
  const SITE_COMMISSION_PCT = 0.20; // 20% نسبة الموقع
  const SITE_CUT_PER_TRIP = DELIVERY_FEE * SITE_COMMISSION_PCT; // 20 دج عن كل توصيلة
  const DRIVER_PROFIT_PER_TRIP = DELIVERY_FEE - SITE_CUT_PER_TRIP; // 80 دج صافي للموزع

  // حساب المبالغ تلقائياً بناءً على العداد
  const totalDriverEarnings = deliveryCounter * DRIVER_PROFIT_PER_TRIP; // صافي أرباح الموزع كاش
  const totalOwedToSite = deliveryCounter * SITE_CUT_PER_TRIP; // المبلغ المطلوب دفعه للموقع

  // حساب بريدي موب الرسمي والخاص بصاحب الموقع لمدينة عين الصفراء
  const BARIDIMOB_RIP = "00799999000524201107"; 

  const handleAcceptDelivery = async (id: string) => {
    if (deliveryCounter >= 50) {
      Alert.alert("تنبيه", "لقد تم توقيف الحساب مؤقتاً لتجاوز الحد المسموح (50 جولة). يرجى تسوية المستحقات.");
      return;
    }
    try {
      const nextCount = deliveryCounter + 1;
      const willSuspend = nextCount >= 50;
      
      const { error } = await supabase.from('drivers').update({
        delivery_counter: nextCount,
        is_suspended: willSuspend
      }).eq('id', driverId);

      if (error) throw error;

      Alert.alert('قبول الطلب', 'تم قبول الشحنة بنجاح! توجه لاستلامها الآن.');
      setDeliveryCounter(nextCount);
      if (willSuspend) setIsSuspended(true);
    } catch (err) {
      Alert.alert('خطأ', 'تعذر تحديث بيانات التوصيل الحية.');
    }
  };

  return (
    <View style={styles.container}>
      {/* هيدر لوحة التحكم */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>لوحة تحكم الموصل 🛵</Text>
        <Text style={styles.deliveryStatus}>
          حالة الحساب: {deliveryCounter >= 50 ? "🔴 معطل مؤقتاً" : "🟢 نشط وجاهز"}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* 🚨 بطاقة التنبيه والحظر في حال الوصول إلى 50 توصيلة */}
        {deliveryCounter >= 50 && (
          <View style={styles.suspendedCard}>
            <Text style={styles.suspendedTitle}>⚠️ وجب دفع مستحقات الموقع</Text>
            <Text style={styles.suspendedText}>
              لقد وصلت إلى <Text style={styles.boldText}>50 توصيلة</Text>. يرجى إرسال مبلغ <Text style={styles.boldText}>1000 د.ج</Text> إلى حساب بريدي موب التالي لإعادة تفعيل الحساب فوراً:
            </Text>
            <View style={styles.ripBox}>
              <Text style={styles.ripLabel}>حساب BaridiMob (RIP):</Text>
              <Text style={styles.ripValue}>{BARIDIMOB_RIP}</Text>
            </View>
            <Text style={styles.warningNote}>* ملاحظة: بعد إرسال الدفع، أرسل لقطة الشاشة إلى الإدارة ليتم فتح الحساب لبدء دورة جديدة.</Text>
          </View>
        )}

        {/* 📊 حاسبة التوصيلات والملخص المالي الذكي */}
        <Text style={styles.sectionTitle}>العداد والحاسبة المالية (دورة 50 توصيلة)</Text>
        <View style={styles.statsCard}>
          <View style={styles.counterRow}>
            <Text style={styles.counterValue}>{deliveryCounter} / 50</Text>
            <Text style={styles.counterLabel}>التوصيلات المكتملة:</Text>
          </View>
          
          {/* شريط تقدم بصري يوضح كم بقي له على الحظر */}
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${Math.min((deliveryCounter / 50) * 100, 100)}%` }]} />
          </View>

          <View style={styles.divider} />

          <View style={styles.financeRow}>
            <Text style={[styles.financeValue, { color: '#137333' }]}>{totalDriverEarnings} د.ج</Text>
            <Text style={styles.financeLabel}>صافي أرباحك كاش (80 دج/رحلة):</Text>
          </View>

          <View style={styles.financeRow}>
            <Text style={[styles.financeValue, { color: '#C5221F' }]}>{totalOwedToSite} د.ج</Text>
            <Text style={styles.financeLabel}>مستحقات الموقع (20 دج/رحلة):</Text>
          </View>
        </View>

        {/* 💳 بيانات الدفع بريدي موب الثابتة للمراجعة في أي وقت */}
        <Text style={styles.sectionTitle}>معلومات الدفع للمنصة</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>يمكنك تصفية مستحقات الموقع في أي وقت عبر تطبيق بريدي موب لإعادة تصفير العداد:</Text>
          <Text style={styles.ripTextSelectable}>RIP: {BARIDIMOB_RIP}</Text>
          <Text style={styles.infoSubtext}>سعر التوصيل داخل المدينة ثابت: 100 د.ج (اقتطاع 20% للموقع).</Text>
        </View>

        {/* 📦 طلبات التوصيل المتاحة حالياً */}
        <Text style={styles.sectionTitle}>الطلبات المتاحة حالياً في المدينة</Text>
        <View style={styles.requestCard}>
          <View style={styles.requestHeader}>
            <Text style={styles.requestId}>شحنة #D-909</Text>
            <Text style={styles.earningsValue}>100 د.ج</Text>
          </View>
          <Text style={styles.routeText}>🏪 من: سوبرماركت الهناء (حي الضلعة)</Text>
          <Text style={styles.routeText}>📍 إلى: حي قصر البلاد</Text>
          
          <TouchableOpacity 
            style={[styles.acceptButton, deliveryCounter >= 50 && styles.disabledButton]} 
            onPress={() => handleAcceptDelivery('D-909')}
          >
            <Text style={styles.acceptButtonText}>
              {deliveryCounter >= 50 ? "الحساب معطل - وجب الدفع" : "قبول التوصيلة (100 دج)"}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' },
  header: { backgroundColor: '#1B2A6B', padding: 20, alignItems: 'flex-end' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', fontFamily: 'Cairo' },
  deliveryStatus: { fontSize: 14, color: '#FFD54F', fontFamily: 'Tajawal', marginTop: 4, fontWeight: 'bold' },
  scrollContent: { paddingBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1B2A6B', marginHorizontal: 15, marginTop: 20, marginBottom: 10, textAlign: 'right', fontFamily: 'Cairo' },
  
  suspendedCard: { backgroundColor: '#FCE8E6', margin: 15, borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#C5221F' },
  suspendedTitle: { fontSize: 16, fontWeight: 'bold', color: '#C5221F', textAlign: 'right', fontFamily: 'Cairo', marginBottom: 6 },
  suspendedText: { fontSize: 13, color: '#333333', textAlign: 'right', fontFamily: 'Tajawal', lineHeight: 20 },
  ripBox: { backgroundColor: '#FFFFFF', padding: 10, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: '#EA4335', alignItems: 'center' },
  ripLabel: { fontSize: 11, color: '#666', fontFamily: 'Tajawal' },
  ripValue: { fontSize: 14, fontWeight: 'bold', color: '#1B2A6B', marginTop: 2 },
  warningNote: { fontSize: 11, color: '#C5221F', textAlign: 'right', marginTop: 8, fontFamily: 'Tajawal', fontStyle: 'italic' },
  
  statsCard: { backgroundColor: '#FFFFFF', marginHorizontal: 15, borderRadius: 14, padding: 15, borderWidth: 1, borderColor: '#EFEFEF' },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  counterValue: { fontSize: 18, fontWeight: 'bold', color: '#1B2A6B' },
  counterLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', fontFamily: 'Cairo' },
  progressBarBackground: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  progressBarFill: { height: '100%', backgroundColor: '#F26522' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  financeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  financeValue: { fontSize: 15, fontWeight: 'bold' },
  financeLabel: { fontSize: 13, color: '#666666', fontFamily: 'Tajawal' },
  
  infoCard: { backgroundColor: '#E8F0FE', marginHorizontal: 15, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#1A73E8' },
  infoText: { fontSize: 13, color: '#1B2A6B', textAlign: 'right', fontFamily: 'Tajawal' },
  ripTextSelectable: { fontSize: 14, fontWeight: 'bold', color: '#F26522', textAlign: 'center', marginVertical: 8 },
  infoSubtext: { fontSize: 11, color: '#555555', textAlign: 'right', fontFamily: 'Tajawal' },
  
  requestCard: { backgroundColor: '#FFFFFF', marginHorizontal: 15, marginTop: 10, borderRadius: 14, padding: 15, borderWidth: 1, borderColor: '#EFEFEF' },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 8, marginBottom: 10 },
  requestId: { fontSize: 14, fontWeight: 'bold', color: '#1B2A6B' },
  earningsValue: { fontSize: 16, fontWeight: 'bold', color: '#F26522' },
  routeText: { fontSize: 13, color: '#444444', fontFamily: 'Tajawal', marginBottom: 4, textAlign: 'right' },
  
  acceptButton: { backgroundColor: '#F26522', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  disabledButton: { backgroundColor: '#BCC1C6' },
  acceptButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', fontFamily: 'Cairo' },
  boldText: { fontWeight: 'bold', color: '#C5221F' }
});
                  
