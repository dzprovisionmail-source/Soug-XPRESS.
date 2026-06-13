import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from './supabase'; // الاتصال المباشر بالجسر السحابي

interface Promotion {
  id: string;
  name: string;
  original_price: number;
  promo_price: number;
  is_active: boolean;
}

interface Comment {
  id: string;
  user_name: string;
  comment_text: string;
  is_buyer: boolean;
  created_at: string;
}

export default function MerchantDashboard() {
  // معرف المحل الافتراضي لتشغيل اللوحة تجريبياً على أول محل متاح في قاعدة البيانات
  const [storeId, setStoreId] = useState<string>(''); 
  const [storeName, setStoreName] = useState<string>('متجر الشريك التجاري');
  const [isFirstMonth, setIsFirstMonth] = useState<boolean>(true);
  
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  // حقول إضافة عرض ترويجي جديد
  const [promoName, setPromoName] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [promoPrice, setPromoPrice] = useState('');

  useEffect(() => {
    initializeMerchant();
  }, []);

  const initializeMerchant = async () => {
    setLoading(true);
    try {
      const { data: stores, error } = await supabase.from('stores').select('*').limit(1);
      if (error) throw error;
      
      if (stores && stores.length > 0) {
        setStoreId(stores[0].id);
        setStoreName(stores[0].name);
        setIsFirstMonth(stores[0].is_first_month);
        fetchStoreData(stores[0].id);
      }
    } catch (error: any) {
      console.log('Error initializing merchant:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreData = async (id: string) => {
    try {
      // 1. جلب العروض الترويجية النشطة للمحل من جدول السيرفر
      const { data: promos, error: promoError } = await supabase
        .from('products_promos')
        .select('*')
        .eq('store_id', id)
        .order('created_at', { ascending: false });

      if (promoError) throw promoError;
      setPromotions(promos || []);

      // 2. جلب تعليقات واستفسارات الزبائن للمحل
      const { data: comps, error: compError } = await supabase
        .from('store_comments')
        .select('*')
        .eq('store_id', id)
        .order('created_at', { ascending: false });

      if (compError) throw compError;
      setComments(comps || []);

    } catch (error: any) {
      Alert.alert('خطأ في جلب البيانات', error.message);
    }
  };

  // إرسال العرض الترويجي الجديد إلى قاعدة البيانات السحابية فوراً
  const handleAddPromotion = async () => {
    if (!promoName || !promoPrice) {
      Alert.alert('تنبيه', 'الرجاء إدخال اسم السلعة وسعر العرض الترويجي');
      return;
    }

    try {
      const { error } = await supabase
        .from('products_promos')
        .insert([
          {
            store_id: storeId,
            name: promoName,
            original_price: originalPrice ? parseFloat(originalPrice) : null,
            promo_price: parseFloat(promoPrice),
            is_active: true
          }
        ]);

      if (error) throw error;

      Alert.alert('تم النشر', `العرض الترويجي لـ (${promoName}) متاح الآن على هواتف الزبائن!`);
      setPromoName('');
      setOriginalPrice('');
      setPromoPrice('');
      fetchStoreData(storeId);
    } catch (error: any) {
      Alert.alert('فشل النشر', error.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#F26522" />
        <Text style={{ marginTop: 10, fontFamily: 'Cairo', color: '#111A44' }}>جاري تحميل لوحة التاجر السحابية...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* هيدر التاجر مع النظام المالي الذكي (إما مجاني أو عمولة 5%) */}
      <View style={styles.header}>
        <View style={styles.badgeContainer}>
          <Text style={[styles.billingBadge, isFirstMonth && styles.freeBadge]}>
            {isFirstMonth ? '🎁 الشهر الأول مجاني 0%' : '📊 نظام العمولة 5%'}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.headerTitle}>{storeName}</Text>
          <Text style={styles.headerSubtitle}>بوابة الشريك التجاري لـ سوق إكسبريس</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* قسم إضافة بروموسيون جديد */}
        <Text style={styles.sectionTitle}>📣 إطلاق بروموسيون جديد (عرض ترويجي)</Text>
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>اسم السلعة أو الوجبة:</Text>
          <TextInput style={styles.input} placeholder="مثال: كرتون حليب، بيتزا حجم عائلي..." value={promoName} onChangeText={setPromoName} />

          <View style={styles.priceRow}>
            <View style={{ width: '48%' }}>
              <Text style={styles.inputLabel}>السعر في العرض (دج):</Text>
              <TextInput style={styles.input} placeholder="مثال: 450" keyboardType="numeric" value={promoPrice} onChangeText={setPromoPrice} />
            </View>
            <View style={{ width: '48%' }}>
              <Text style={styles.inputLabel}>السعر القديم (اختياري):</Text>
              <TextInput style={styles.input} placeholder="مثال: 600" keyboardType="numeric" value={originalPrice} onChangeText={setOriginalPrice} />
            </View>
          </View>

          <TouchableOpacity style={styles.publishButton} onPress={handleAddPromotion}>
            <Text style={styles.publishButtonText}>⚡ تفعيل البروموسيون ونشره فوراً للزبائن</Text>
          </TouchableOpacity>
        </View>

        {/* استعراض العروض النشطة في السيرفر للرقابة */}
        <Text style={styles.sectionTitle}>🏷️ عروضك الترويجية النشطة بالتطبيق ({promotions.length})</Text>
        {promotions.length === 0 ? (
          <Text style={styles.noDataText}>لا توجد عروض منشورة حالياً. ابدأ بإضافة عرضك الأول!</Text>
        ) : (
          promotions.map(promo => (
            <View key={promo.id} style={styles.promoCard}>
              <View style={styles.promoPrices}>
                <Text style={styles.newPrice}>{promo.promo_price} د.ج</Text>
                {promo.original_price && <Text style={styles.oldPrice}>{promo.original_price} د.ج</Text>}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.promoName}>{promo.name}</Text>
                <Text style={styles.promoStatus}>الحالة: 🟢 مباشر على التطبيق</Text>
              </View>
            </View>
          ))
        )}

        {/* تعليقات واستفسارات زبائن المدينة */}
        <Text style={styles.sectionTitle}>💬 استفسارات وتعليقات أهل المدينة</Text>
        {comments.length === 0 ? (
          <Text style={styles.noDataText}>لا توجد تعليقات أو أسئلة من الزبائن حالياً.</Text>
        ) : (
          comments.map(comment => (
            <View key={comment.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentUser}>{comment.user_name}</Text>
                <Text style={[styles.commentBadge, comment.is_buyer && styles.buyerBadge]}>
                  {comment.is_buyer ? '🛍️ زبون حقيقي' : '❓ استفسار عام'}
                </Text>
              </View>
              <Text style={styles.commentText}>{comment.comment_text}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFD' },
  header: { backgroundColor: '#F26522', padding: 20, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', fontFamily: 'Cairo' },
  headerSubtitle: { fontSize: 11, color: '#FFE0D3', fontFamily: 'Tajawal', marginTop: 2 },
  badgeContainer: { alignItems: 'center' },
  billingBadge: { backgroundColor: '#111A44', color: '#FFFFFF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, fontSize: 11, fontWeight: 'bold', fontFamily: 'Cairo' },
  freeBadge: { backgroundColor: '#137333' },
  scrollContent: { paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#111A44', marginHorizontal: 15, marginTop: 22, marginBottom: 10, textAlign: 'right', fontFamily: 'Cairo' },
  formCard: { backgroundColor: '#FFFFFF', marginHorizontal: 15, borderRadius: 14, padding: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#4A5568', textAlign: 'right', marginBottom: 6, fontFamily: 'Cairo' },
  input: { borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8, padding: 12, textAlign: 'right', fontSize: 14, fontFamily: 'Tajawal', backgroundColor: '#F8FAFC', marginBottom: 15 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  publishButton: { backgroundColor: '#111A44', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  publishButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', fontFamily: 'Cairo' },
  promoCard: { backgroundColor: '#FFFFFF', marginHorizontal: 15, marginBottom: 8, borderRadius: 12, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  promoPrices: { alignItems: 'flex-start' },
  newPrice: { fontSize: 16, fontWeight: 'bold', color: '#F26522' },
  oldPrice: { fontSize: 13, color: '#A0AEC0', textDecorationLine: 'line-through', marginTop: 2 },
  promoName: { fontSize: 14, fontWeight: 'bold', color: '#111A44', fontFamily: 'Cairo' },
  promoStatus: { fontSize: 11, color: '#718096', fontFamily: 'Tajawal', marginTop: 2 },
  commentCard: { backgroundColor: '#FFFFFF', marginHorizontal: 15, marginBottom: 8, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  commentHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  commentUser: { fontSize: 13, fontWeight: 'bold', color: '#111A44', fontFamily: 'Cairo' },
  commentBadge: { backgroundColor: '#EDF2F7', color: '#4A5568', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8, fontSize: 10, fontFamily: 'Tajawal' },
  buyerBadge: { backgroundColor: '#E3F2FD', color: '#1E88E5', fontWeight: 'bold' },
  commentText: { fontSize: 13, color: '#4A5568', textAlign: 'right', fontFamily: 'Tajawal' },
  noDataText: { textAlign: 'center', color: '#718096', marginVertical: 15, fontFamily: 'Tajawal', fontSize: 13 }
});
