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
import { Colors, Spacing, Radius, Shadow } from '../../constants/theme';

export default function MerchantDashboard() {
  // ── Auth / store identity ────────────────────────────────────────────────
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // ── Store profile ────────────────────────────────────────────────────────
  const [storeName, setStoreName] = useState('');
  const [storeLogo, setStoreLogo] = useState<string | null>(null);

  // ── Financial dashboard (mock data — TODO Phase 3) ───────────────────────
  // TODO(Phase 3): Replace totalSales with real daily aggregation from `orders` table.
  // 📆 حالة الاشتراك: true تعني الشهر الأول المجاني (أرباح 100%)، و false تعني الشهر الثاني فما فوق (عمولة 5%)
  // وضعتها كـ State لتتمكن من تجربة الحالتين في العرض والتنقل بينهما
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
        .from('products_promos')
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
        .from('products_promos')
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
        <ActivityIndicator size="large" color={Colors.primary} />
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
          <Text style={[styles.financeValue, { color: Colors.success, fontSize: 16 }]}>{netMerchantProfit.toFixed(0)} د.ج</Text>
          <Text style={[styles.financeLabel, { fontWeight: 'bold', color: Colors.textPrimary }]}>أرباحك الصافية الحقيقية:</Text>
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
          <Text style={{ color: Colors.white, fontFamily: 'Tajawal' }}>🖼️ رفع صورة منتج من ألبوم الهاتف</Text>
        </TouchableOpacity>
        {localPhoto && <Image source={{ uri: localPhoto }} style={styles.previewImage} />}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.base }}>
          <Text style={{ color: Colors.primary, fontFamily: 'Tajawal' }}>{50 - description.length} حرف متبقي</Text>
          <Text style={{ fontSize: 12, fontFamily: 'Tajawal', color: Colors.textSecondary }}>الوصف القصير (أقصى حد 50 حرف):</Text>
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
            ? <ActivityIndicator color={Colors.white} />
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
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: Spacing.lg }} />
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
              <Text style={{ textAlign: 'center', color: Colors.textMuted, fontWeight: 'bold', fontFamily: 'Tajawal' }}>
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
  container: { padding: 0, backgroundColor: Colors.bgScreen },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    backgroundColor: Colors.navyMid,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.headerTop,
    paddingBottom: Spacing.lg,
    alignItems: 'flex-end',
    borderBottomWidth: 3,
    borderColor: Colors.primary,
  },
  headerTitle: { fontSize: 21, fontWeight: 'bold', color: Colors.white, fontFamily: 'Cairo' },
  headerStoreName: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'Tajawal', marginTop: Spacing.xs },

  // Layout helpers
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.navyMid,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    textAlign: 'right',
    fontFamily: 'Cairo',
  },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.sm },

  // Policy banner
  policyBanner: { margin: Spacing.base, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1 },
  promoBanner: { backgroundColor: Colors.successBg, borderColor: Colors.success },
  activePolicyBanner: { backgroundColor: Colors.warningBg, borderColor: Colors.warning },
  policyTitle: { fontSize: 15, fontWeight: 'bold', fontFamily: 'Cairo', textAlign: 'right', marginBottom: Spacing.xs, color: Colors.textPrimary },
  policyText: { fontSize: 12, color: Colors.textBody, fontFamily: 'Tajawal', textAlign: 'right', lineHeight: 18 },
  togglePolicyButton: { backgroundColor: Colors.white, padding: Spacing.sm, borderRadius: Radius.sm, alignItems: 'center', marginTop: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  togglePolicyText: { fontSize: 11, fontWeight: 'bold', color: Colors.navyMid, fontFamily: 'Tajawal' },

  // Financial stats
  statsCard: { backgroundColor: Colors.bgCard, marginHorizontal: Spacing.base, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.borderLight, ...Shadow.card },
  financeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  financeValue: { fontSize: 14, fontWeight: 'bold', fontFamily: 'Cairo' },
  financeLabel: { fontSize: 13, color: Colors.textMuted, fontFamily: 'Tajawal' },

  // Store profile card
  profileCard: {
    backgroundColor: Colors.bgCard,
    marginHorizontal: Spacing.base,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  logoContainer: {
    width: 60, height: 60, borderRadius: Radius.full,
    borderWidth: 2, borderColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  logoImage: { width: '100%', height: '100%' },
  profileInput: {
    flex: 1, marginRight: Spacing.base,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm,
    padding: Spacing.sm, backgroundColor: Colors.bgSubtle, fontFamily: 'Tajawal',
  },

  // Generic card
  card: {
    backgroundColor: Colors.bgCard,
    marginHorizontal: Spacing.base,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },

  // Post publishing
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm,
    padding: Spacing.md, textAlign: 'right', backgroundColor: Colors.bgSubtle,
    marginTop: Spacing.sm, fontFamily: 'Tajawal',
  },
  checkboxRow: { flexDirection: 'row-reverse', alignItems: 'center', padding: Spacing.sm, backgroundColor: Colors.dangerBg, borderRadius: Radius.sm, marginTop: Spacing.sm },
  checkboxActive: { backgroundColor: Colors.successBg },
  checkboxText: { fontSize: 10, flex: 1, textAlign: 'right', fontFamily: 'Tajawal' },
  photoUploadBtn: { backgroundColor: Colors.navyDark, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing.base },
  previewImage: { width: '100%', height: 150, borderRadius: Radius.sm, marginTop: Spacing.sm, resizeMode: 'cover' },
  submitBtn: { backgroundColor: Colors.primary, paddingVertical: Spacing.base, borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing.lg, ...Shadow.primaryBtn },
  submitBtnText: { color: Colors.white, fontWeight: 'bold', fontFamily: 'Cairo' },

  // Promo management
  smallInput: {
    borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radius.sm,
    padding: Spacing.sm, textAlign: 'right', fontSize: 13,
    fontFamily: 'Tajawal', backgroundColor: Colors.bgSubtle, marginBottom: Spacing.sm,
  },
  addPromoButton: { backgroundColor: Colors.primary, paddingVertical: Spacing.md, borderRadius: Radius.sm, alignItems: 'center', marginTop: 2, ...Shadow.primaryBtn },
  addPromoButtonText: { color: Colors.white, fontSize: 13, fontWeight: 'bold', fontFamily: 'Cairo' },
  promoItemRow: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    marginTop: Spacing.sm, backgroundColor: Colors.primaryLight, padding: Spacing.sm, borderRadius: Radius.sm,
  },
  promoItemName: { fontSize: 13, color: Colors.navyMid, fontFamily: 'Tajawal', flex: 1, textAlign: 'right' },
  oldPriceText: { fontSize: 11, color: Colors.textMuted, textDecorationLine: 'line-through', marginHorizontal: Spacing.sm },
  promoPriceBadge: { fontSize: 13, fontWeight: 'bold', color: Colors.primary, fontFamily: 'Cairo' },

  // Posts list
  postItemRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  postInfo: { alignItems: 'flex-end', flex: 1, marginLeft: Spacing.sm },
  postDescText: { fontSize: 13, fontWeight: '500', color: Colors.textBody, fontFamily: 'Tajawal' },
  mediaTypeBadge: { fontSize: 10, color: Colors.textMuted, marginTop: 2, fontFamily: 'Tajawal' },
  commentCheckBtn: {
    backgroundColor: Colors.bgScreen, borderWidth: 1, borderColor: Colors.border,
    paddingVertical: 6, paddingHorizontal: Spacing.md, borderRadius: Radius.sm,
  },
  commentCheckBtnText: { fontSize: 11, color: Colors.textSecondary, fontWeight: 'bold', fontFamily: 'Tajawal' },
  noPostsText: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, paddingVertical: Spacing.base, fontFamily: 'Tajawal' },

  // Comment modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: Colors.white, height: '58%', padding: Spacing.lg, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl },
  modalTitle: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: Spacing.base, color: Colors.navyMid, fontFamily: 'Cairo' },
  commentContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  commentBodyArea: { flex: 1, alignItems: 'flex-end', marginLeft: Spacing.base },
  commentHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  commenterName: { fontSize: 13, fontWeight: 'bold', color: Colors.textBody, marginRight: Spacing.sm, fontFamily: 'Tajawal' },
  commentContentText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'right', fontFamily: 'Tajawal' },
  roleBadge: {
    fontSize: 9, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Radius.sm, overflow: 'hidden', fontWeight: 'bold', fontFamily: 'Tajawal',
  },
  customerBadge: { backgroundColor: Colors.customerBadgeBg, color: Colors.customerBadgeText },
  driverBadge: { backgroundColor: Colors.driverBadgeBg, color: Colors.driverBadgeText },
  deleteCommentBtn: { backgroundColor: Colors.dangerBg, paddingVertical: 6, paddingHorizontal: Spacing.sm, borderRadius: Radius.sm },
  deleteText: { color: Colors.danger, fontSize: 11, fontWeight: 'bold', fontFamily: 'Tajawal' },
  noCommentsText: { textAlign: 'center', color: Colors.textMuted, fontSize: 13, marginTop: 40, fontFamily: 'Tajawal' },
  closeModalBtn: { marginTop: Spacing.base, paddingVertical: Spacing.sm },
});
