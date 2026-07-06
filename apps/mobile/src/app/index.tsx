import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, ActivityIndicator, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { supabase } from '../supabase';
import { Colors, Spacing, Radius, Shadow } from '../constants/theme';

const logoAsset = require('../../assets/images/logo.png');

const { width } = Dimensions.get('window');

// 1. بيانات الشاشات الترحيبية (Onboarding Slides) - محفوظة بالكامل لحسابك
const slides = [
  {
    id: '1',
    title: 'تسوق بسرعة',
    description: 'احصل على كل احتياجاتك من المتاجر المحلية في لمح البصر',
    icon: '🛒',
  },
  {
    id: '2',
    title: 'توصيل فوري',
    description: 'خدمة توصيل سريعة وموثوقة لباب منزلك في عين الصفراء',
    icon: '🛵',
  },
  {
    id: '3',
    title: 'تجار محليون موثوقون',
    description: 'ندعم تجارنا المحليين ونوفر أفضل الأسعار لجميع سكان المنطقة',
    icon: '🏪',
  },
];

interface MediaPost {
  id: string;
  media_url: string;
  media_type: string;
  description: string;
  created_at: string;
  stores: {
    name: string;
    logo_url: string | null;
  };
}

export default function RootEntryScreen() {
  const router = useRouter();
  
  // التحكم في تدوير الشاشات
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  // بيانات التغذية التجارية
  const [loading, setLoading] = useState(true);
  const [refreshing, refreshingSet] = useState(false);
  const [feedData, setFeedData] = useState<MediaPost[]>([]);

  // الحقول الجديدة الخاصة بمحرك الردود والتعليقات الحية للمنصة
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchCommercialFeed();
  }, []);

  const fetchCommercialFeed = async () => {
    try {
      const { data, error } = await supabase
        .from('store_media')
        .select(`
          id,
          media_url,
          media_type,
          description,
          created_at,
          stores ( name, logo_url )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Supabase relational select returns `stores` as an array at the type level,
      // but the query always returns a single store object per post at runtime.
      // Cast to MediaPost[] to align with our interface.
      setFeedData((data || []) as unknown as MediaPost[]);
    } catch (error) {
      console.log('خطأ في جلب التغذية:', error);
    } finally {
      setLoading(false);
      refreshingSet(false);
    }
  };

  // فتح نافذة التعليقات وجلب ردود الزبائن والفرسان المرتبطة بالمنشور
  const openComments = async (postId: string) => {
    setSelectedPostId(postId); 
    setModalVisible(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.log('خطأ في جلب التعليقات:', error);
    }
  };

  // معالجة الفرز والإرسال الذكي حسب الرتب المعتمدة في جدار حماية Supabase
  const submitComment = async () => {
    if (!newComment.trim() || !selectedPostId) return;
    setIsSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let finalUsername = 'زبون سوق';
      let finalRole = 'customer';
      let userId = null;

      if (user) {
        userId = user.id;
        // الفحص البرمجي: هل المعلق مسجل كـ موصل رسمي؟
        const { data: driverData } = await supabase.from('drivers').select('name').eq('id', user.id).single();
        
        if (driverData) {
          finalUsername = driverData.name;
          finalRole = 'driver'; // رتبة موصل
        } else {
          // مستخدم عادي مسجل
          finalUsername = user.phone ? `زبون (${user.phone})` : (user.email?.split('@')[0] || 'مستخدم مسجل');
          finalRole = 'customer'; // رتبة زبون
        }
      }

      // إدراج التعليق المحمي بقوانين الـ RLS التي فعلناها للتو
      const { error } = await supabase.from('comments').insert([
        { 
          post_id: selectedPostId, 
          user_id: userId,
          content: newComment.trim(), 
          username: finalUsername,
          user_role: finalRole 
        }
      ]);

      if (error) throw error;

      setNewComment(''); 
      // تحديث فوري للقائمة حياً أمام عين المستخدم
      const { data: updatedComments } = await supabase.from('comments').select('*').eq('post_id', selectedPostId).order('created_at', { ascending: true });
      setComments(updatedComments || []);

    } catch (error: any) {
      Alert.alert('خطأ في إرسال التعليق', error.message);
    } finally {
      setIsSending(false);
    }
  };

  // معالجة التنقل في شاشات الترحيب
  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else {
      setShowOnboarding(false);
    }
  };

  const formatEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  };

  // ==================== [ شاشة الترحيب الافتراضية ] ====================
  if (showOnboarding) {
    return (
      <View style={styles.onboardingContainer}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>🐙 SOUG XPRESS</Text>
        </View>

        <View style={styles.slide}>
          <Text style={styles.slideIcon}>{slides[currentSlideIndex].icon}</Text>
          <Text style={styles.slideTitle}>{slides[currentSlideIndex].title}</Text>
          <Text style={styles.slideDescription}>{slides[currentSlideIndex].description}</Text>
        </View>

        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentSlideIndex === index ? styles.activeIndicator : styles.inactiveIndicator,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.orangeButton} onPress={handleNextSlide}>
          <Text style={styles.buttonText}>
            {currentSlideIndex === slides.length - 1 ? 'ابدأ الآن 🚀' : 'التالي'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ==================== [ شاشة تغذية العروض التجارية ] ====================
  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F26522" /></View>;
  }

  return (
    <View style={styles.feedContainer}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.push('/login')} style={styles.authBtn}>
          <Text style={styles.authBtnText}>🔑 دخول</Text>
        </TouchableOpacity>
        <View style={styles.headerMeta}>
          <Text style={styles.headerLogoText}>سوق إكسبريس ⚡</Text>
          <Text style={styles.headerSubtitle}>أحدث عروض تجار عين الصفراء ديركت</Text>
        </View>
      </View>

      <FlatList
        data={feedData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const store = item.stores || { name: 'متجر محلي', logo_url: null };
          return (
            <View style={styles.postCard}>
              <View style={styles.storeHeaderRow}>
                <View style={styles.storeMeta}>
                  <Text style={styles.storeNameText}>{store.name}</Text>
                  <Text style={styles.timeText}>عرض نشط الآن ⚡</Text>
                </View>
                {store.logo_url ? (
                  <Image source={{ uri: store.logo_url }} style={styles.storeLogoImage} />
                ) : (
                  <View style={styles.storeLogoPlaceholder}>
                    <Text style={styles.storeLogoLetter}>{store.name?.charAt(0) || '🏪'}</Text>
                  </View>
                )}
              </View>

              {/* مشغل الصورة أو الفيديو الذكي عبر الروابط */}
              {item.media_type === 'photo' ? (
                <Image source={{ uri: item.media_url }} style={styles.postMedia} />
              ) : (
                <View style={styles.postMedia}>
                  <WebView
                    source={{ uri: formatEmbedUrl(item.media_url) }}
                    style={styles.webView}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    allowsFullscreenVideo={true}
                    allowsInlineMediaPlayback={true}
                  />
                </View>
              )}

              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionText}>{item.description}</Text>
              </View>

              {/* الزر المضاف حديثاً لربط وفتح التعليقات الحية */}
              <TouchableOpacity onPress={() => openComments(item.id)} style={styles.commentBtn}>
                <Text style={styles.commentBtnText}>💬 تعليقات العرض والتفاعل</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { refreshingSet(true); fetchCommercialFeed(); }} colors={[Colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>🏪 لا توجد عروض ترويجية نشطة حالياً.</Text>
          </View>
        }
      />

      {/* نافذة التعليقات العامة المحدثة بالشارات الملونة للفرسان والزبائن */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>التعليقات الحية للمنصة</Text>
            
            <FlatList 
              data={comments} 
              keyExtractor={(item) => item.id} 
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.commentItemRow}>
                  <View style={styles.commentBody}>
                    <View style={styles.commentHeader}>
                      <Text style={[styles.roleBadge, item.user_role === 'driver' ? styles.driverBadge : styles.customerBadge]}>
                        {item.user_role === 'driver' ? '🛵 موصل' : '🛒 زبون'}
                      </Text>
                      <Text style={styles.commenterName}>{item.username}</Text>
                    </View>
                    <Text style={styles.commentContentText}>{item.content}</Text>
                  </View>
                </View>
              )} 
            />

            {/* حقل إدخال التعليقات الفوري */}
            <View style={styles.inputRow}>
              <TextInput style={styles.commentInput} placeholder="اكتب تعليقك أو استفسارك..." value={newComment} onChangeText={setNewComment} />
              <TouchableOpacity onPress={submitComment} style={[styles.sendBtn, !newComment.trim() && styles.disabledBtn]} disabled={isSending || !newComment.trim()}>
                {isSending ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={{color:Colors.white, fontWeight:'bold', fontFamily:'Tajawal', fontSize:12}}>إرسال</Text>}
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{marginTop:Spacing.base}}><Text style={{textAlign:'center', color:Colors.textMuted, fontFamily:'Tajawal'}}>إغلاق النافذة ❌</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // أونبوردينغ ستايلز الأصلية لحسابك مية بالمية
  onboardingContainer: { flex: 1, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 60, paddingHorizontal: Spacing.lg },
  logoContainer: { alignItems: 'center', marginTop: Spacing.lg },
  logoText: { fontSize: 26, fontWeight: 'bold', color: Colors.navyMid, fontFamily: 'Cairo' },
  slide: { alignItems: 'center', width: width - 40 },
  slideIcon: { fontSize: 90, marginBottom: Spacing.lg },
  slideTitle: { fontSize: 28, fontWeight: 'bold', color: Colors.navyMid, textAlign: 'center', marginBottom: Spacing.base, fontFamily: 'Cairo' },
  slideDescription: { fontSize: 16, color: Colors.textMuted, textAlign: 'center', lineHeight: 26, fontFamily: 'Tajawal', paddingHorizontal: Spacing.base },
  indicatorContainer: { flexDirection: 'row', marginBottom: Spacing.lg },
  indicator: { height: 8, borderRadius: Radius.sm, marginHorizontal: Spacing.xs },
  activeIndicator: { width: 24, backgroundColor: Colors.primary },
  inactiveIndicator: { width: 8, backgroundColor: Colors.borderLight },
  orangeButton: { width: '100%', backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: Radius.lg, alignItems: 'center', ...Shadow.primaryBtn },
  buttonText: { color: Colors.white, fontSize: 18, fontWeight: 'bold', fontFamily: 'Cairo' },

  // تغذية الميديا ستايلز الحديثة
  feedContainer: { flex: 1, backgroundColor: Colors.bgScreen },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bgScreen },
  headerBar: { backgroundColor: Colors.bgCard, width: '100%', paddingVertical: Spacing.md, paddingHorizontal: Spacing.base, borderBottomWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 40 },
  authBtn: { borderWidth: 1, borderColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.sm },
  authBtnText: { color: Colors.primary, fontSize: 12, fontFamily: 'Cairo', fontWeight: 'bold' },
  headerMeta: { alignItems: 'flex-end' },
  headerLogoText: { fontSize: 18, fontWeight: 'bold', color: Colors.navyMid, fontFamily: 'Cairo' },
  headerSubtitle: { fontSize: 10, color: Colors.textMuted, fontFamily: 'Tajawal', marginTop: 1 },
  listContent: { padding: Spacing.md, paddingBottom: 30 },
  postCard: { backgroundColor: Colors.bgCard, width: '100%', borderRadius: Radius.xl, marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadow.card },
  storeHeaderRow: { flexDirection: 'row', padding: Spacing.sm, alignItems: 'center', justifyContent: 'flex-end', backgroundColor: Colors.bgSubtle },
  storeMeta: { marginRight: Spacing.sm, alignItems: 'flex-end' },
  storeNameText: { fontSize: 13, fontWeight: 'bold', color: Colors.textPrimary, fontFamily: 'Cairo' },
  timeText: { fontSize: 9, color: Colors.primary, fontFamily: 'Tajawal', fontWeight: 'bold' },
  storeLogoImage: { width: 36, height: 36, borderRadius: 18, resizeMode: 'cover' },
  storeLogoPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.navyMid, justifyContent: 'center', alignItems: 'center' },
  storeLogoLetter: { color: Colors.white, fontSize: 12, fontWeight: 'bold' },
  postMedia: { width: '100%', height: 230, backgroundColor: '#000' },
  webView: { flex: 1 },
  descriptionContainer: { padding: Spacing.md, backgroundColor: Colors.bgCard },
  descriptionText: { fontSize: 12, color: Colors.textBody, fontFamily: 'Tajawal', textAlign: 'right', lineHeight: 18 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 13, color: Colors.textSecondary, fontFamily: 'Cairo' },

  // الستايلات المضافة لزر التعليقات والـ Modal المفروز
  commentBtn: { backgroundColor: Colors.bgSubtle, padding: Spacing.md, alignItems: 'center', borderTopWidth: 1, borderColor: Colors.border },
  commentBtnText: { color: Colors.textSecondary, fontSize: 12, fontWeight: 'bold', fontFamily: 'Tajawal' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: Colors.white, height: '58%', padding: Spacing.lg, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl },
  modalTitle: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: Spacing.base, color: Colors.navyMid, fontFamily: 'Cairo' },
  commentItemRow: { paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: 'row-reverse' },
  commentBody: { flex: 1, alignItems: 'flex-end' },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  commenterName: { fontSize: 12, fontWeight: 'bold', color: Colors.textBody, marginRight: 6, fontFamily: 'Tajawal' },
  commentContentText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'right', fontFamily: 'Tajawal' },
  roleBadge: { fontSize: 9, paddingHorizontal: 5, paddingVertical: 1, borderRadius: Radius.sm, overflow: 'hidden', fontWeight: 'bold', fontFamily: 'Tajawal' },
  customerBadge: { backgroundColor: Colors.customerBadgeBg, color: Colors.customerBadgeText },
  driverBadge: { backgroundColor: Colors.driverBadgeBg, color: Colors.driverBadgeText },
  inputRow: { flexDirection: 'row', marginTop: Spacing.base, alignItems: 'center' },
  commentInput: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, padding: Spacing.sm, textAlign: 'right', backgroundColor: Colors.bgSubtle, fontFamily: 'Tajawal' },
  sendBtn: { backgroundColor: Colors.primary, paddingVertical: Spacing.md, paddingHorizontal: 18, borderRadius: Radius.sm, marginLeft: Spacing.xs },
  disabledBtn: { backgroundColor: Colors.border },
});
