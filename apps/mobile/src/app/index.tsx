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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { refreshingSet(true); fetchCommercialFeed(); }} colors={['#F26522']} />}
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
                {isSending ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{color:'#FFF', fontWeight:'bold', fontFamily:'Tajawal', fontSize:12}}>إرسال</Text>}
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{marginTop:15}}><Text style={{textAlign:'center', color:'#718096', fontFamily:'Tajawal'}}>إغلاق النافذة ❌</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // أونبوردينغ ستايلز الأصلية لحسابك مية بالمية
  onboardingContainer: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 60, paddingHorizontal: 20 },
  logoContainer: { alignItems: 'center', marginTop: 20 },
  logoText: { fontSize: 26, fontWeight: 'bold', color: '#1B2A6B', fontFamily: 'Cairo' },
  slide: { alignItems: 'center', width: width - 40 },
  slideIcon: { fontSize: 90, marginBottom: 20 },
  slideTitle: { fontSize: 28, fontWeight: 'bold', color: '#1B2A6B', textAlign: 'center', marginBottom: 15, fontFamily: 'Cairo' },
  slideDescription: { fontSize: 16, color: '#666666', textAlign: 'center', lineHeight: 26, fontFamily: 'Tajawal', paddingHorizontal: 15 },
  indicatorContainer: { flexDirection: 'row', marginBottom: 20 },
  indicator: { height: 8, borderRadius: 4, marginHorizontal: 4 },
  activeIndicator: { width: 24, backgroundColor: '#F26522' },
  inactiveIndicator: { width: 8, backgroundColor: '#E0E0E0' },
  orangeButton: { width: '100%', backgroundColor: '#F26522', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', fontFamily: 'Cairo' },

  // تغذية الميديا ستايلز الحديثة
  feedContainer: { flex: 1, backgroundColor: '#F7FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC' },
  headerBar: { backgroundColor: '#FFFFFF', width: '100%', paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 40 },
  authBtn: { borderWidth: 1, borderColor: '#F26522', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  authBtnText: { color: '#F26522', fontSize: 12, fontFamily: 'Cairo', fontWeight: 'bold' },
  headerMeta: { alignItems: 'flex-end' },
  headerLogoText: { fontSize: 18, fontWeight: 'bold', color: '#1B2A6B', fontFamily: 'Cairo' },
  headerSubtitle: { fontSize: 10, color: '#718096', fontFamily: 'Tajawal', marginTop: 1 },
  listContent: { padding: 12, paddingBottom: 30 },
  postCard: { backgroundColor: '#FFFFFF', width: '100%', borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  storeHeaderRow: { flexDirection: 'row', padding: 10, alignItems: 'center', justifyContent: 'flex-end', backgroundColor: '#FAFBFC' },
  storeMeta: { marginRight: 10, alignItems: 'flex-end' },
  storeNameText: { fontSize: 13, fontWeight: 'bold', color: '#111A44', fontFamily: 'Cairo' },
  timeText: { fontSize: 9, color: '#F26522', fontFamily: 'Tajawal', fontWeight: 'bold' },
  storeLogoImage: { width: 36, height: 36, borderRadius: 18, resizeMode: 'cover' },
  storeLogoPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1B2A6B', justifyContent: 'center', alignItems: 'center' },
  storeLogoLetter: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  postMedia: { width: '100%', height: 230, backgroundColor: '#000' },
  webView: { flex: 1 },
  descriptionContainer: { padding: 12, backgroundColor: '#FFFFFF' },
  descriptionText: { fontSize: 12, color: '#2D3748', fontFamily: 'Tajawal', textAlign: 'right', lineHeight: 18 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 13, color: '#4A5568', fontFamily: 'Cairo' },

  // الستايلات المضافة لزر التعليقات والـ Modal المفروز
  commentBtn: { backgroundColor: '#F8FAFC', padding: 12, alignItems: 'center', borderTopWidth: 1, borderColor: '#E2E8F0' },
  commentBtnText: { color: '#4A5568', fontSize: 12, fontWeight: 'bold', fontFamily: 'Tajawal' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#FFF', height: '58%', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#1B2A6B', fontFamily: 'Cairo' },
  commentItemRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EDF2F7', flexDirection: 'row-reverse' },
  commentBody: { flex: 1, alignItems: 'flex-end' },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  commenterName: { fontSize: 12, fontWeight: 'bold', color: '#2D3748', marginRight: 6, fontFamily: 'Tajawal' },
  commentContentText: { fontSize: 13, color: '#4A5568', textAlign: 'right', fontFamily: 'Tajawal' },
  roleBadge: { fontSize: 9, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5, overflow: 'hidden', fontWeight: 'bold', fontFamily: 'Tajawal' },
  customerBadge: { backgroundColor: '#EBF8FF', color: '#2B6CB0' }, // أزرق للزبون
  driverBadge: { backgroundColor: '#FEFCBF', color: '#744210' },   // ذهبي للموصل
  inputRow: { flexDirection: 'row', marginTop: 15, alignItems: 'center' },
  commentInput: { flex: 1, borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8, padding: 10, textAlign: 'right', backgroundColor: '#F8FAFC', fontFamily: 'Tajawal' },
  sendBtn: { backgroundColor: '#F26522', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 8, marginLeft: 5 },
  disabledBtn: { backgroundColor: '#CBD5E0' }
});
