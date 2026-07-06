import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';

export default function MerchantDashboard() {
  const [displayStoreName, setDisplayStoreName] = useState('جاري تحميل اسم المتجر...');
  const [merchantId, setMerchantId] = useState<string | null>(null);

  useEffect(() => {
    async function loadMerchantData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setMerchantId(user.id);
          const { data: storeData } = await supabase.from('stores').select('name').eq('id', user.id).single();
          if (storeData && storeData.name) {
            setDisplayStoreName(storeData.name + ' (عين الصفراء)');
          }
          const { data: livePromos } = await supabase.from('promotions').select('*').eq('store_id', user.id);
          if (livePromos) setPromoItems(livePromos);
        }
      } catch (err) { console.log(err); }
    }
    loadMerchantData();
  }, []);
  // 📆 حالة الاشتراك: true تعني الشهر الأول المجاني (أرباح 100%)، و false تعني الشهر الثاني فما فوق (عمولة 5%)
  // وضعتها كـ State لتتمكن من تجربة الحالتين في العرض والتنقل بينهما
  const [isFirstMonth, setIsFirstMonth] = useState(true);

  // TODO(Phase 2): Replace with real daily sales fetched from the `orders` table.
  // This is a hardcoded fallback — it does NOT reflect actual merchant revenue.
  const [totalSales, setTotalSales] = useState(8500);

  // العداد المالي الذكي المبني على سياسة المنصة الجديدة
  const SITE_COMMISSION_PCT = isFirstMonth ? 0 : 0.05; 
  const totalOwedToSite = totalSales * SITE_COMMISSION_PCT;
  const netMerchantProfit = totalSales - totalOwedToSite;

  // TODO(Phase 2): Initial promo items should be empty []. These hardcoded items appear before
  // any real promotions are loaded from Supabase.
  const [promoItems, setPromoItems] = useState([
    { id: 'p1', name: 'كيس دقيق 10 كغ', originalPrice: '650 د.ج', promoPrice: '590 د.ج' },
    { id: 'p2', name: 'عصير رامي لتر ونصف', originalPrice: '210 د.ج', promoPrice: '180 د.ج' },
  ]);

  // TODO(Phase 2): Replace with live comments fetched from the `comments` table for this store's posts.
  // These are hardcoded sample comments — not real customer interactions.
  const [comments, setComments] = useState([
    { id: 'c1', user: 'أحمد بوعلام', text: 'هل يتوفر عندكم حليب الأكياس اليوم؟', date: 'منذ 10 دقائق', isBuyer: false },
    { id: 'c2', user: 'مريم الصافية', text: 'الخدمة ممتازة والتوصيل سريع جداً بارك الله فيكم', date: 'منذ ساعة', isBuyer: true },
  ]);

  const [newPromoName, setNewPromoName] = useState('');
  const [newPromoPrice, setNewPromoPrice] = useState('');

  // إضافة عرض ترويجي سريع
  const handleAddPromo = async () => {
    if (!newPromoName || !newPromoPrice) {
      Alert.alert('تنبيه', 'الرجاء إدخال اسم المنتج والسعر');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('promotions')
        .insert([{
          store_id: merchantId,
          name: newPromoName,
          original_price: 'السعر القديم',
          promo_price: `${newPromoPrice} د.ج`
        }])
        .select();
      if (error) throw error;
      Alert.alert('نجاح', `تم نشر عرض ${newPromoName} في عين الصفراء 🔥`);
      if (data) setPromoItems([...promoItems, data[0]]);
      setNewPromoName('');
      setNewPromoPrice('');
    } catch (err) {
      Alert.alert('خطأ', 'تعذر حفظ العرض في قاعدة البيانات');
    }
  };

  return (
    <View style={styles.container}>
      {/* هيدر لوحة التحكم للتاجر */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>لوحة إدارة المتجر الاحترافية 🏪</Text>
        <Text style={styles.storeName}>{displayStoreName}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* 🎁 لافتة سياسة الموقع الذكية: الشهر الأول مجاني والشهر الثاني 5% */}
        <View style={[styles.policyBanner, isFirstMonth ? styles.promoBanner : styles.activePolicyBanner]}>
          <Text style={styles.policyTitle}>
            {isFirstMonth ? "🎉 هدايا الانطلاق: أنت في الشهر الأول للتسجيل" : "📊 نظام العضوية: أنت في الشهر الثاني فما فوق"}
          </Text>
          <Text style={styles.policyText}>
            {isFirstMonth 
              ? "سياسة المنصة تفعل لك ميزة إعفاء تام؛ أرباح مبيعاتك كاملة 100% لك دون أي اقتطاع!" 
              : "تفعيل عمولة المنصة القياسية المقدرة بـ 5% فقط عن كل فاتورة لتغطية خدمات الصيانة الرقمية."}
          </Text>
          {/* زر للمحاكاة والتنقل بين الحالتين لرؤية كيف يتغير الحساب */}
          <TouchableOpacity style={styles.togglePolicyButton} onPress={() => setIsFirstMonth(!isFirstMonth)}>
            <Text style={styles.togglePolicyText}>🔄 التبديل لرؤية الحسبة المالية للشهر {isFirstMonth ? "الثاني" : "الأول"}</Text>
          </TouchableOpacity>
        </View>

        {/* 📊 حاسبة التقرير المالي الحي الحالية لليوم */}
        <Text style={styles.sectionTitle}>💰 التقرير المالي لليوم الحالي</Text>
        <View style={styles.statsCard}>
          <View style={styles.financeRow}>
            <Text style={styles.financeValue}>{totalSales} د.ج</Text>
            <Text style={styles.financeLabel}>مبيعات اليوم الإجمالية:</Text>
          </View>
          <View style={styles.financeRow}>
            <Text style={[styles.financeValue, { color: isFirstMonth ? '#137333' : '#C5221F' }]}>
              {isFirstMonth ? "0 د.ج (عفو مجاني)" : `-${totalOwedToSite.toFixed(0)} د.ج`}
            </Text>
            <Text style={styles.financeLabel}>مستحقات المنصة الموقع ({isFirstMonth ? "0%" : "5%"}):</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.financeRow}>
            <Text style={[styles.financeValue, { color: '#137333', fontSize: 16 }]}>{netMerchantProfit.toFixed(0)} د.ج</Text>
            <Text style={[styles.financeLabel, { fontWeight: 'bold', color: '#111A44' }]}>أرباحك الصافية الحقيقية:</Text>
          </View>
        </View>

        {/* 📸 مركز التحديثات المرئية وجديد المتجر - Media & News Update Center */}
        <Text style={styles.sectionTitle}>⚙️ التحيين الفوري والهوية البصرية للمحل</Text>
        <View style={styles.controlCardRow}>
          <TouchableOpacity style={styles.actionControlCard} onPress={() => Alert.alert('الكاميرا', 'تحديث شعار وصور الواجهة الخارجية للمحل')}>
            <Text style={styles.controlIcon}>📸</Text>
            <Text style={styles.controlText}>تحيين صور المحل</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionControlCard} onPress={() => Alert.alert('جديد المتجر', 'أعلن لزبائن عين الصفراء عن سلع جديدة وصلت الآن')}>
            <Text style={styles.controlIcon}>📢</Text>
            <Text style={styles.controlText}>نشر جديد المتجر</Text>
          </TouchableOpacity>
        </View>

        {/* 🏷️ قسم إدارة البروموسيون والعروض الخاصة السريعة */}
        <Text style={styles.sectionTitle}>🔥 إدارة عروض البروموسيون والتخفيضات الحاليّة</Text>
        <View style={styles.promoFormCard}>
          <TextInput 
            style={styles.smallInput} 
            placeholder="اسم المنتج (مثال: عجائن عمر بن عمر)" 
            value={newPromoName}
            onChangeText={setNewPromoName}
          />
          <TextInput 
            style={styles.smallInput} 
            placeholder="السعر الجديد في البروموسيون (د.ج)" 
            keyboardType="numeric"
            value={newPromoPrice}
            onChangeText={setNewPromoPrice}
          />
          <TouchableOpacity style={styles.addPromoButton} onPress={handleAddPromo}>
            <Text style={styles.addPromoButtonText}>🚀 إطلاق العرض في التطبيق فوراً</Text>
          </TouchableOpacity>

          <View style={styles.divider} />
          
          {promoItems.map(item => (
            <View key={item.id} style={styles.promoItemRow}>
              <Text style={styles.promoPriceBadge}>{item.promoPrice}</Text>
              <Text style={styles.oldPriceText}>{item.originalPrice}</Text>
              <Text style={styles.promoItemName}>{item.name}</Text>
            </View>
          ))}
        </View>

        {/* 💬 جدار تفاعلات وآراء أهل عين الصفراء (التعليقات الحرة والمفتوحة) */}
        <Text style={styles.sectionTitle}>💬 ساحة تفاعل واستفسارات زبائن المحل</Text>
        <View style={styles.commentsCard}>
          <Text style={styles.commentNotice}>* ملاحظة: التعليقات مفتوحة لجميع زبائن المدينة للاستفسار وبناء الثقة حتى وإن لم يقوموا بعمل طلبية مسبقاً.</Text>
          {comments.map(comment => (
            <View key={comment.id} style={styles.commentItem}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentDate}>{comment.date}</Text>
                <View style={styles.userInfoRow}>
                  {comment.isBuyer && <Text style={styles.buyerBadge}>🛒 زبون سابق</Text>}
                  <Text style={styles.commentUser}>{comment.user}</Text>
                </View>
              </View>
              <Text style={styles.commentText}>{comment.text}</Text>
              <TouchableOpacity style={styles.replyLinkButton} onPress={() => Alert.alert('الرد المباشر', `اكتب ردك العلوي لـ ${comment.user}`)}>
                <Text style={styles.replyLinkText}>إضافة رد رسمي من المحل ↩️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' },
  header: { backgroundColor: '#1B2A6B', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, alignItems: 'flex-end' },
  headerTitle: { fontSize: 21, fontWeight: 'bold', color: '#FFFFFF', fontFamily: 'Cairo' },
  storeName: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'Tajawal', marginTop: 4 },
  scrollContent: { paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1B2A6B', marginHorizontal: 15, marginTop: 22, marginBottom: 10, textAlign: 'right', fontFamily: 'Cairo' },
  
  // لافتة السياسة الذكية المحدثة لملء المتجر بمرونة
  policyBanner: { margin: 15, borderRadius: 14, padding: 15, borderWidth: 1 },
  promoBanner: { backgroundColor: '#E6F4EA', borderColor: '#137333' },
  activePolicyBanner: { backgroundColor: '#FEF7E0', borderColor: '#B06000' },
  policyTitle: { fontSize: 15, fontWeight: 'bold', fontFamily: 'Cairo', textAlign: 'right', marginBottom: 5, color: '#111A44' },
  policyText: { fontSize: 12, color: '#444444', fontFamily: 'Tajawal', textAlign: 'right', lineHeight: 18 },
  togglePolicyButton: { backgroundColor: '#FFFFFF', padding: 8, borderRadius: 8, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#CBD5E0' },
  togglePolicyText: { fontSize: 11, fontWeight: 'bold', color: '#1B2A6B', fontFamily: 'Tajawal' },

  statsCard: { backgroundColor: '#FFFFFF', marginHorizontal: 15, borderRadius: 14, padding: 15, borderWidth: 1, borderColor: '#EFEFEF' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  financeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  financeValue: { fontSize: 14, fontWeight: 'bold', fontFamily: 'Cairo' },
  financeLabel: { fontSize: 13, color: '#666666', fontFamily: 'Tajawal' },
  
  controlCardRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingHorizontal: 15, gap: 10 },
  actionControlCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#EFEFEF' },
  controlIcon: { fontSize: 26, marginBottom: 5 },
  controlText: { fontSize: 12, fontWeight: 'bold', color: '#1B2A6B', fontFamily: 'Cairo' },
  
  promoFormCard: { backgroundColor: '#FFFFFF', marginHorizontal: 15, borderRadius: 14, padding: 15, borderWidth: 1, borderColor: '#EFEFEF' },
  smallInput: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 10, textAlign: 'right', fontSize: 13, fontFamily: 'Tajawal', backgroundColor: '#FAFAFA', marginBottom: 10 },
  addPromoButton: { backgroundColor: '#F26522', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 2 },
  addPromoButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold', fontFamily: 'Cairo' },
  promoItemRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, backgroundColor: '#FFF5F0', padding: 10, borderRadius: 8 },
  promoItemName: { fontSize: 13, color: '#1B2A6B', fontFamily: 'Tajawal', flex: 1, textAlign: 'right' },
  oldPriceText: { fontSize: 11, color: '#999', textDecorationLine: 'line-through', marginHorizontal: 10 },
  promoPriceBadge: { fontSize: 13, fontWeight: 'bold', color: '#F26522', fontFamily: 'Cairo' },

  commentsCard: { backgroundColor: '#FFFFFF', marginHorizontal: 15, borderRadius: 14, padding: 15, borderWidth: 1, borderColor: '#EFEFEF' },
  commentNotice: { fontSize: 11, color: '#666666', fontStyle: 'italic', textAlign: 'right', fontFamily: 'Tajawal', marginBottom: 12, lineHeight: 16 },
  commentItem: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 10, marginBottom: 10 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  commentDate: { fontSize: 11, color: '#999', fontFamily: 'Tajawal' },
  userInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentUser: { fontSize: 13, fontWeight: 'bold', color: '#1B2A6B', fontFamily: 'Cairo' },
  buyerBadge: { backgroundColor: '#E6F4EA', color: '#137333', fontSize: 10, fontWeight: 'bold', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, fontFamily: 'Tajawal' },
  commentText: { fontSize: 13, color: '#444', textAlign: 'right', fontFamily: 'Tajawal', lineHeight: 20 },
  replyLinkButton: { alignSelf: 'flex-start', marginTop: 6 },
  replyLinkText: { fontSize: 11, color: '#F26522', fontFamily: 'Cairo', fontWeight: 'bold' }
});
