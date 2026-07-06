/**
 * MerchantDashboard — Canonical merchant screen.
 *
 * Merged from:
 *   • src/app/merchant.tsx        → store profile, image upload, post publishing,
 *                                   real comment management (fetch + delete)
 *   • src/app/(tabs)/merchant.tsx → policy banner, financial dashboard (mock, TODO),
 *                                   promo management (real Supabase `promotions` table)
 *
 * src/app/merchant.tsx has been renamed to merchant.tsx.bak (deprecated).
 */
import React, { useState, useEffect } from 'react';

/** UI-normalized shape for promo items (camelCase, matches DB columns mapped on read) */
interface PromoItem {
  id: string;
  name: string;
  originalPrice: string;
  promoPrice: string;
}

/** Map a raw Supabase `promotions` row → PromoItem (handles both snake_case DB and UI shape) */
function toPromoItem(row: any): PromoItem {
  return {
    id: String(row.id),
    name: row.name,
    originalPrice: row.original_price ?? row.originalPrice ?? 'السعر القديم',
    promoPrice: row.promo_price ?? row.promoPrice ?? '',
  };
}
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  TextInput, Image, Modal, FlatList, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../supabase';

export default function MerchantDashboard() {
  // ── Auth / store identity ────────────────────────────────────────────────
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // ── Store profile ────────────────────────────────────────────────────────
  const [storeName, setStoreName] = useState('');
  const [storeLogo, setStoreLogo] = useState<string | null>(null);

  // ── Financial dashboard (mock data — TODO Phase 3) ───────────────────────
  // TODO(Phase 3): Replace totalSales with real daily aggregation from `orders` table.
  const [isFirstMonth, setIsFirstMonth] = useState(true);
  const [totalSales, setTotalSales] = useState(8500);
  // No commission on merchants — net profit always equals total sales.
  const netMerchantProfit = totalSales;

  // ── Promo management (real Supabase `promotions` table) ──────────────────
  // UI shape: { id, name, originalPrice, promoPrice } (camelCase throughout)
  // DB shape: { id, name, original_price, promo_price } — normalized on load
  const [promoItems, setPromoItems] = useState<PromoItem[]>([]);
  const [newPromoName, setNewPromoName] = useState('');
  const [newPromoPrice, setNewPromoPrice] = useState('');

  // ── Post publishing ──────────────────────────────────────────────────────
  const [publishing, setPublishing] = useState(false);
  const [description, setDescription] = useState('');
  const [socialUrl, setSocialUrl] = useState('');
  const [localPhoto, setLocalPhoto] = useState<string | null>(null);
  const [isOwnVideoChecked, setIsOwnVideoChecked] = useState(false);
  const [merchantPosts, setMerchantPosts] = useState<any[]>([]);

  // ── Comment modal ────────────────────────────────────────────────────────
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    initializeData();
  }, []);

  /** Load store profile, posts, and promotions from Supabase in one pass */
  const initializeData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      if (!userId) return;

      setMerchantId(userId);

      // 1. Store profile
      const { data: storeData } = await supabase
        .from('stores')
        .select('name, logo_url')
        .eq('id', userId)
        .single();
      if (storeData) {
        setStoreName(storeData.name || '');
        setStoreLogo(storeData.logo_url || null);
      }

      // 2. Published posts
      const { data: postsData } = await supabase
        .from('store_media')
        .select('*')
        .eq('store_id', userId)
        .order('created_at', { ascending: false });
      setMerchantPosts(postsData || []);

      // 3. Promotions — always override state with DB result (empty [] if none)
      const { data: livePromos } = await supabase
        .from('promotions')
        .select('*')
        .eq('store_id', userId);
      setPromoItems((livePromos || []).map(toPromoItem));
    } catch (e) {
      console.log('[MerchantDashboard] Error loading data:', e);
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Image pickers ─────────────────────────────────────────────────────────

  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) setStoreLogo(result.assets[0].uri);
  };

  const pickProductPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setLocalPhoto(result.assets[0].uri);
      setSocialUrl('');
    }
  };

  // ── Post publishing ───────────────────────────────────────────────────────

  const handlePublishContent = async () => {
    if (!localPhoto && !socialUrl.trim()) {
      Alert.alert('تنبيه', 'أدخل رابط فيديو أو اختر صورة من الألبوم.');
      return;
    }
    if (socialUrl.trim() && !isOwnVideoChecked) {
      Alert.alert('تعهد الملكية', 'يرجى تأكيد تعهد ملكية الفيديو لحسابك.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('تنبيه', 'الرجاء كتابة وصف ترويجي.');
      return;
    }

    setPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      if (!userId) throw new Error('No active session');

      let finalMediaUrl = socialUrl.trim();

      if (localPhoto) {
        const fileName = `${userId}/products/${Date.now()}.jpg`;
        const response = await fetch(localPhoto);
        const blob = await response.blob();
        await supabase.storage.from('store-media').upload(fileName, blob, { contentType: 'image/jpeg' });
        finalMediaUrl = supabase.storage.from('store-media').getPublicUrl(fileName).data.publicUrl;
      }

      await supabase.from('store_media').insert([{
        store_id: userId,
        media_url: finalMediaUrl,
        media_type: localPhoto ? 'photo' : 'social_link',
        description: description.trim(),
      }]);
      await supabase.from('stores').update({ name: storeName, logo_url: storeLogo }).eq('id', userId);

      Alert.alert('تم النشر بنجاح 🎉', 'منشورك متاح الآن على منصة سوق إكسبريس.');
      setDescription('');
      setSocialUrl('');
      setLocalPhoto(null);
      setIsOwnVideoChecked(false);
      initializeData();
    } catch (error: unknown) {
      Alert.alert('خطأ في النشر', error instanceof Error ? error.message : 'خطأ غير معروف');
    } finally {
      setPublishing(false);
    }
  };

  // ── Promo management ──────────────────────────────────────────────────────

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
          promo_price: `${newPromoPrice} د.ج`,
        }])
        .select();
      if (error) throw error;
      Alert.alert('نجاح', `تم نشر عرض ${newPromoName} في عين الصفراء 🔥`);
      // Normalize DB row to camelCase UI shape before appending to state
      if (data) setPromoItems([...promoItems, toPromoItem(data[0])]);
      setNewPromoName('');
      setNewPromoPrice('');
    } catch (err: unknown) {
      Alert.alert('خطأ', 'تعذر حفظ العرض في قاعدة البيانات');
    }
  };

  // ── Comment management ────────────────────────────────────────────────────

  const openComments = async (postId: string) => {
    setSelectedPostId(postId);
    setModalVisible(true);
    setCommentsLoading(true);
    try {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      setComments(data || []);
    } catch (error) {
      console.log('[MerchantDashboard] Error fetching comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert('حذف التعليق 🗑️', 'هل أنت متأكد من رغبتك في إزالة هذا التعليق نهائياً من عرضك التجاري؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'نعم، احذفه ديركت',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('comments').delete().eq('id', commentId);
          if (error) {
            Alert.alert('فشل الحذف', error.message);
          } else if (selectedPostId) {
            openComments(selectedPostId);
          }
        },
      },
    ]);
  };

  // ── Loading guard ─────────────────────────────────────────────────────────

  if (profileLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F26522" />
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── 1. Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>لوحة إدارة المتجر الاحترافية 🏪</Text>
        <Text style={styles.headerStoreName}>{storeName || 'اسم المتجر'}</Text>
      </View>

      {/* ── 2. Policy banner + financial dashboard (mock data, TODO Phase 3) ── */}
      <View style={[styles.policyBanner, isFirstMonth ? styles.promoBanner : styles.activePolicyBanner]}>
        <Text style={styles.policyTitle}>
          {isFirstMonth
            ? '🎉 هدايا الانطلاق: أنت في الشهر الأول للتسجيل'
            : '📊 نظام العضوية: أنت في الشهر الثاني فما فوق'}
        </Text>
        <Text style={styles.policyText}>
          {isFirstMonth
            ? 'سياسة المنصة تفعل لك ميزة إعفاء تام؛ أرباح مبيعاتك كاملة 100% لك دون أي اقتطاع!'
            : 'أرباح مبيعاتك كاملة 100% لك — المنصة لا تقتطع أي عمولة على المبيعات.'}
        </Text>
        <TouchableOpacity style={styles.togglePolicyButton} onPress={() => setIsFirstMonth(!isFirstMonth)}>
          <Text style={styles.togglePolicyText}>
            🔄 التبديل لرؤية الحسبة المالية للشهر {isFirstMonth ? 'الثاني' : 'الأول'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>💰 التقرير المالي لليوم الحالي</Text>
      <View style={styles.statsCard}>
        <View style={styles.financeRow}>
          <Text style={styles.financeValue}>{totalSales} د.ج</Text>
          <Text style={styles.financeLabel}>مبيعات اليوم الإجمالية:</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.financeRow}>
          <Text style={[styles.financeValue, { color: '#137333', fontSize: 16 }]}>{netMerchantProfit.toFixed(0)} د.ج</Text>
          <Text style={[styles.financeLabel, { fontWeight: 'bold', color: '#111A44' }]}>أرباحك الصافية الحقيقية:</Text>
        </View>
      </View>

      {/* ── 3. Store profile (logo + name) ── */}
      <Text style={styles.sectionTitle}>⚙️ هوية المتجر والبيانات الأساسية</Text>
      <View style={styles.profileCard}>
        <TouchableOpacity style={styles.logoContainer} onPress={pickLogo}>
          {storeLogo
            ? <Image source={{ uri: storeLogo }} style={styles.logoImage} />
            : <Text style={{ fontSize: 10, fontFamily: 'Tajawal' }}>لوقو 🖼️</Text>}
        </TouchableOpacity>
        <TextInput
          style={styles.profileInput}
          value={storeName}
          onChangeText={setStoreName}
          placeholder="اسم المحل التجاري"
          textAlign="right"
        />
      </View>

      {/* ── 4. Post publishing (photo / social link) ── */}
      <Text style={styles.sectionTitle}>📣 عروض تجارية هجينة</Text>
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="إلصق رابط تيك توك، انستا، فيسبوك أو يوتيوب هنا..."
          value={socialUrl}
          onChangeText={(text) => { setSocialUrl(text); if (text) setLocalPhoto(null); }}
        />
        {socialUrl.length > 0 && (
          <TouchableOpacity
            style={[styles.checkboxRow, isOwnVideoChecked && styles.checkboxActive]}
            onPress={() => setIsOwnVideoChecked(!isOwnVideoChecked)}
          >
            <Text style={styles.checkboxText}>
              {isOwnVideoChecked
                ? '✅ أتعهد بأن الفيديو خاص بنشاطي التجاري مية بالمية'
                : '⬜ أقر وأتعهد بأن هذا الفيديو ملك لتجارتي المعنية'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.photoUploadBtn} onPress={pickProductPhoto}>
          <Text style={{ color: '#FFF', fontFamily: 'Tajawal' }}>🖼️ رفع صورة منتج من ألبوم الهاتف</Text>
        </TouchableOpacity>
        {localPhoto && <Image source={{ uri: localPhoto }} style={styles.previewImage} />}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }}>
          <Text style={{ color: '#F26522', fontFamily: 'Tajawal' }}>{50 - description.length} حرف متبقي</Text>
          <Text style={{ fontSize: 12, fontFamily: 'Tajawal' }}>الوصف القصير (أقصى حد 50 حرف):</Text>
        </View>
        <TextInput
          style={[styles.input, { minHeight: 50 }]}
          maxLength={50}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="عبارة ترويجية قصيرة..."
        />
        <TouchableOpacity style={styles.submitBtn} onPress={handlePublishContent} disabled={publishing}>
          {publishing
            ? <ActivityIndicator color="#FFF" />
            : <Text style={styles.submitBtnText}>🚀 نشر العرض ديركت</Text>}
        </TouchableOpacity>
      </View>

      {/* ── 5. Promo management (real Supabase `promotions` table) ── */}
      <Text style={styles.sectionTitle}>🔥 إدارة عروض البروموسيون والتخفيضات الحاليّة</Text>
      <View style={styles.card}>
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
        {promoItems.map((item) => (
          <View key={item.id} style={styles.promoItemRow}>
            <Text style={styles.promoPriceBadge}>{item.promoPrice}</Text>
            <Text style={styles.oldPriceText}>{item.originalPrice}</Text>
            <Text style={styles.promoItemName}>{item.name}</Text>
          </View>
        ))}
      </View>

      {/* ── 6. My posts list ── */}
      <Text style={styles.sectionTitle}>📦 منشوراتك وعروضك النشطة</Text>
      <View style={[styles.card, { marginBottom: 20 }]}>
        {merchantPosts.length === 0 ? (
          <Text style={styles.noPostsText}>لم تقم بنشر أي عروض ترويجية حتى الآن في عين الصفراء.</Text>
        ) : (
          merchantPosts.map((item) => (
            <View key={item.id} style={styles.postItemRow}>
              <View style={styles.postInfo}>
                <Text style={styles.postDescText} numberOfLines={1}>{item.description}</Text>
                <Text style={styles.mediaTypeBadge}>
                  {item.media_type === 'photo' ? '🖼️ صورة فوتوغرافية' : '🔗 فيديو خارجي Web'}
                </Text>
              </View>
              <TouchableOpacity style={styles.commentCheckBtn} onPress={() => openComments(item.id)}>
                <Text style={styles.commentCheckBtnText}>💬 الردود والتعليقات</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* ── 7. Comment modal ── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>💬 تعليقات الزبائن وفرسان التوصيل</Text>
            {commentsLoading ? (
              <ActivityIndicator size="small" color="#F26522" style={{ marginTop: 20 }} />
            ) : comments.length === 0 ? (
              <Text style={styles.noCommentsText}>لا توجد أي تعليقات منشورة على هذا العرض حتى الآن.</Text>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(c) => c.id}
                renderItem={({ item }) => (
                  <View style={styles.commentContainer}>
                    <TouchableOpacity onPress={() => handleDeleteComment(item.id)} style={styles.deleteCommentBtn}>
                      <Text style={styles.deleteText}>🗑️ حذف</Text>
                    </TouchableOpacity>
                    <View style={styles.commentBodyArea}>
                      <View style={styles.commentHeaderRow}>
                        <Text style={[
                          styles.roleBadge,
                          item.user_role === 'driver' ? styles.driverBadge : styles.customerBadge,
                        ]}>
                          {item.user_role === 'driver' ? '🛵 موصل' : '🛒 زبون'}
                        </Text>
                        <Text style={styles.commenterName}>{item.username}</Text>
                      </View>
                      <Text style={styles.commentContentText}>{item.content}</Text>
                    </View>
                  </View>
                )}
              />
            )}
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeModalBtn}>
              <Text style={{ textAlign: 'center', color: '#718096', fontWeight: 'bold', fontFamily: 'Tajawal' }}>
                إغلاق النافذة ❌
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 0, backgroundColor: '#F4F6F9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    backgroundColor: '#1B2A6B',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 21, fontWeight: 'bold', color: '#FFFFFF', fontFamily: 'Cairo' },
  headerStoreName: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'Tajawal', marginTop: 4 },

  // Layout helpers
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1B2A6B',
    marginHorizontal: 15,
    marginTop: 22,
    marginBottom: 10,
    textAlign: 'right',
    fontFamily: 'Cairo',
  },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },

  // Policy banner
  policyBanner: { margin: 15, borderRadius: 14, padding: 15, borderWidth: 1 },
  promoBanner: { backgroundColor: '#E6F4EA', borderColor: '#137333' },
  activePolicyBanner: { backgroundColor: '#FEF7E0', borderColor: '#B06000' },
  policyTitle: { fontSize: 15, fontWeight: 'bold', fontFamily: 'Cairo', textAlign: 'right', marginBottom: 5, color: '#111A44' },
  policyText: { fontSize: 12, color: '#444444', fontFamily: 'Tajawal', textAlign: 'right', lineHeight: 18 },
  togglePolicyButton: { backgroundColor: '#FFFFFF', padding: 8, borderRadius: 8, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#CBD5E0' },
  togglePolicyText: { fontSize: 11, fontWeight: 'bold', color: '#1B2A6B', fontFamily: 'Tajawal' },

  // Financial stats
  statsCard: { backgroundColor: '#FFFFFF', marginHorizontal: 15, borderRadius: 14, padding: 15, borderWidth: 1, borderColor: '#EFEFEF' },
  financeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  financeValue: { fontSize: 14, fontWeight: 'bold', fontFamily: 'Cairo' },
  financeLabel: { fontSize: 13, color: '#666666', fontFamily: 'Tajawal' },

  // Store profile card
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logoContainer: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 2, borderColor: '#F26522',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  logoImage: { width: '100%', height: '100%' },
  profileInput: {
    flex: 1, marginRight: 15,
    borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8,
    padding: 10, backgroundColor: '#F8FAFC', fontFamily: 'Tajawal',
  },

  // Generic card
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Post publishing
  input: {
    borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8,
    padding: 12, textAlign: 'right', backgroundColor: '#F8FAFC',
    marginTop: 8, fontFamily: 'Tajawal',
  },
  checkboxRow: { flexDirection: 'row-reverse', alignItems: 'center', padding: 10, backgroundColor: '#FFF5F5', borderRadius: 8, marginTop: 8 },
  checkboxActive: { backgroundColor: '#F0FFF4' },
  checkboxText: { fontSize: 10, flex: 1, textAlign: 'right', fontFamily: 'Tajawal' },
  photoUploadBtn: { backgroundColor: '#111A44', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  previewImage: { width: '100%', height: 150, borderRadius: 8, marginTop: 10, resizeMode: 'cover' },
  submitBtn: { backgroundColor: '#F26522', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontFamily: 'Cairo' },

  // Promo management
  smallInput: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8,
    padding: 10, textAlign: 'right', fontSize: 13,
    fontFamily: 'Tajawal', backgroundColor: '#FAFAFA', marginBottom: 10,
  },
  addPromoButton: { backgroundColor: '#F26522', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 2 },
  addPromoButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold', fontFamily: 'Cairo' },
  promoItemRow: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 10, backgroundColor: '#FFF5F0', padding: 10, borderRadius: 8,
  },
  promoItemName: { fontSize: 13, color: '#1B2A6B', fontFamily: 'Tajawal', flex: 1, textAlign: 'right' },
  oldPriceText: { fontSize: 11, color: '#999', textDecorationLine: 'line-through', marginHorizontal: 10 },
  promoPriceBadge: { fontSize: 13, fontWeight: 'bold', color: '#F26522', fontFamily: 'Cairo' },

  // Posts list
  postItemRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  postInfo: { alignItems: 'flex-end', flex: 1, marginLeft: 10 },
  postDescText: { fontSize: 13, fontWeight: '500', color: '#2D3748', fontFamily: 'Tajawal' },
  mediaTypeBadge: { fontSize: 10, color: '#718096', marginTop: 2, fontFamily: 'Tajawal' },
  commentCheckBtn: {
    backgroundColor: '#FAFBFD', borderWidth: 1, borderColor: '#CBD5E0',
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8,
  },
  commentCheckBtnText: { fontSize: 11, color: '#4A5568', fontWeight: 'bold', fontFamily: 'Tajawal' },
  noPostsText: { textAlign: 'center', color: '#718096', fontSize: 12, paddingVertical: 15, fontFamily: 'Tajawal' },

  // Comment modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#FFF', height: '58%', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#1B2A6B', fontFamily: 'Cairo' },
  commentContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EDF2F7',
  },
  commentBodyArea: { flex: 1, alignItems: 'flex-end', marginLeft: 15 },
  commentHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  commenterName: { fontSize: 13, fontWeight: 'bold', color: '#1A202C', marginRight: 8, fontFamily: 'Tajawal' },
  commentContentText: { fontSize: 13, color: '#4A5568', textAlign: 'right', fontFamily: 'Tajawal' },
  roleBadge: {
    fontSize: 9, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, overflow: 'hidden', fontWeight: 'bold', fontFamily: 'Tajawal',
  },
  customerBadge: { backgroundColor: '#EBF8FF', color: '#2B6CB0' },
  driverBadge: { backgroundColor: '#FEFCBF', color: '#744210' },
  deleteCommentBtn: { backgroundColor: '#FFF5F5', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  deleteText: { color: '#E53E3E', fontSize: 11, fontWeight: 'bold', fontFamily: 'Tajawal' },
  noCommentsText: { textAlign: 'center', color: '#718096', fontSize: 13, marginTop: 40, fontFamily: 'Tajawal' },
  closeModalBtn: { marginTop: 15, paddingVertical: 10 },
});
