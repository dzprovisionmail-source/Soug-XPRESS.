import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Modal, FlatList } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabase';

export default function MerchantDashboard() {
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  
  // بيانات المتجر والبروفايل
  const [storeName, setStoreName] = useState('');
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  
  // بيانات إنشاء عرض جديد
  const [description, setDescription] = useState('');
  const [socialUrl, setSocialUrl] = useState('');
  const [localPhoto, setLocalPhoto] = useState<string | null>(null);
  const [isOwnVideoChecked, setIsOwnVideoChecked] = useState(false);

  // إدارة المنشورات والتعليقات الحية
  const [merchantPosts, setMerchantPosts] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => { 
    fetchStoreData(); 
  }, []);

  // جلب بيانات بروفايل التاجر ومنشوراته الحالية من السيرفر
  const fetchStoreData = async () => {
    try {
      const userResult = await supabase.auth.getUser();
      const userId = userResult.data.user?.id;
      if (!userId) return;

      // 1. جلب بيانات المحل
      const { data: storeData } = await supabase.from('stores').select('name, logo_url').eq('id', userId).single();
      if (storeData) { 
        setStoreName(storeData.name || ''); 
        setStoreLogo(storeData.logo_url || null); 
      }

      // 2. جلب جميع العروض المنشورة بواسطة هذا التاجر
      const { data: postsData } = await supabase
        .from('store_media')
        .select('*')
        .eq('store_id', userId)
        .order('created_at', { ascending: false });
      
      setMerchantPosts(postsData || []);
    } catch (e) { 
      console.log(e); 
    } finally { 
      setProfileLoading(false); 
    }
  };

  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets.length > 0) setStoreLogo(result.assets[0].uri);
  };

  const pickProductPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets.length > 0) { setLocalPhoto(result.assets[0].uri); setSocialUrl(''); }
  };

  const handlePublishContent = async () => {
    if (!localPhoto && !socialUrl.trim()) { Alert.alert('تنبيه', 'أدخل رابط فيديو أو اختر صورة من الألبوم.'); return; }
    if (socialUrl.trim() && !isOwnVideoChecked) { Alert.alert('تعهد الملكية', 'يرجى تأكيد تعهد ملكية الفيديو لحسابك.'); return; }
    if (!description.trim()) { Alert.alert('تنبيه', 'الرجاء كتابة وصف ترويجي.'); return; }

    setLoading(true);
    try {
      const userResult = await supabase.auth.getUser();
      const userId = userResult.data.user?.id;
      let finalMediaUrl = socialUrl.trim();

      if (localPhoto) {
        const fileName = `${userId}/products/${Date.now()}.jpg`;
        const response = await fetch(localPhoto);
        const blob = await response.blob();
        await supabase.storage.from('store-media').upload(fileName, blob, { contentType: 'image/jpeg' });
        finalMediaUrl = supabase.storage.from('store-media').getPublicUrl(fileName).data.publicUrl;
      }

      await supabase.from('store_media').insert([{ store_id: userId, media_url: finalMediaUrl, media_type: localPhoto ? 'photo' : 'social_link', description: description.trim() }]);
      await supabase.from('stores').update({ name: storeName, logo_url: storeLogo }).eq('id', userId);

      Alert.alert('تم النشر بنجاح 🎉', 'منشورك متاح الآن على منصة سوق إكسبريس.');
      setDescription(''); setSocialUrl(''); setLocalPhoto(null); setIsOwnVideoChecked(false);
      
      // إعادة تحديث المنشورات فوراً لكي تظهر في القائمة بالأسفل
      fetchStoreData();
    } catch (error: any) { 
      Alert.alert('خطأ في النشر', error.message); 
    } finally { 
      setLoading(false); 
    }
  };

  // فتح نافذة التعليقات وجلب ردود الزبائن والموصلين حياً
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
      console.log(error);
    } finally {
      setCommentsLoading(false);
    }
  };

  // صلاحية الحذف الإدارية للتاجر للتخلص من التعليقات المسيئة
  const handleDeleteComment = async (commentId: string) => {
    Alert.alert('حذف التعليق 🗑️', 'هل أنت متأكد من رغبتك في إزالة هذا التعليق نهائياً من عرضك التجاري؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'نعم، احذفه ديركت', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('comments').delete().eq('id', commentId);
          if (error) {
            Alert.alert('فشل الحذف', error.message);
          } else if (selectedPostId) {
            openComments(selectedPostId); // تحديث القائمة فوراً
          }
        }
      }
    ]);
  };

  if (profileLoading) return <View style={styles.centered}><ActivityIndicator size="large" color="#F26522" /></View>;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. إدارة ملف الحساب البصري */}
      <View style={styles.profileCard}>
        <TouchableOpacity style={styles.logoContainer} onPress={pickLogo}>
          {storeLogo ? <Image source={{ uri: storeLogo }} style={styles.logoImage} /> : <Text style={{fontSize: 10, fontFamily:'Tajawal'}}>لوقو 🖼️</Text>}
        </TouchableOpacity>
        <TextInput style={styles.profileInput} value={storeName} onChangeText={setStoreName} placeholder="اسم المحل التجاري" textAlign="right" />
      </View>

      {/* 2. كارت إنشاء ونشر عرض ترويجي جديد */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📣 عروض تجارية هجينة</Text>
        <TextInput style={styles.input} placeholder="إلصق رابط تيك توك، انستا، فيسبوك أو يوتيوب هنا..." value={socialUrl} onChangeText={(text) => { setSocialUrl(text); if(text) setLocalPhoto(null); }} />
        {socialUrl.length > 0 && (
          <TouchableOpacity style={[styles.checkboxRow, isOwnVideoChecked && styles.checkboxActive]} onPress={() => setIsOwnVideoChecked(!isOwnVideoChecked)}>
            <Text style={styles.checkboxText}>{isOwnVideoChecked ? '✅ أتعهد بأن الفيديو خاص بنشاطي التجاري مية بالمية' : '⬜ أقر وأتعهد بأن هذا الفيديو ملك لتجارتي المعنية'}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.photoUploadBtn} onPress={pickProductPhoto}><Text style={{color:'#FFF', fontFamily:'Tajawal'}}>🖼️ رفع صورة منتج من ألبوم الهاتف</Text></TouchableOpacity>
        {localPhoto && <Image source={{ uri: localPhoto }} style={styles.previewImage} />}
        
        <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:15}}><Text style={{color:'#F26522', fontFamily:'Tajawal'}}>{50 - description.length} حرف متبقي</Text><Text style={{fontSize:12, fontFamily:'Tajawal'}}>الوصف القصير (أقصى حد 50 حرف):</Text></View>
        <TextInput style={[styles.input, {minHeight:50}]} maxLength={50} value={description} onChangeText={setDescription} multiline={true} placeholder="عبارة ترويجية قصيرة..." />

        <TouchableOpacity style={styles.submitBtn} onPress={handlePublishContent} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>🚀 نشر العرض ديركت</Text>}
        </TouchableOpacity>
      </View>

      {/* 3. مراقبة وإدارة العروض الحية وتفاعل الزبائن والموصلين */}
      <View style={[styles.card, { marginTop: 15 }]}>
        <Text style={styles.sectionTitle}>📦 منشوراتك وعروضك النشطة</Text>
        {merchantPosts.length === 0 ? (
          <Text style={styles.noPostsText}>لم تقم بنشر أي عروض ترويجية حتى الآن في عين الصفراء.</Text>
        ) : (
          merchantPosts.map((item) => (
            <View key={item.id} style={styles.postItemRow}>
              <View style={styles.postInfo}>
                <Text style={styles.postDescText} numberOfLines={1}>{item.description}</Text>
                <Text style={styles.mediaTypeBadge}>{item.media_type === 'photo' ? '🖼️ صورة فوتوغرافية' : '🔗 فيديو خارجي Web'}</Text>
              </View>
              <TouchableOpacity style={styles.commentCheckBtn} onPress={() => openComments(item.id)}>
                <Text style={styles.commentCheckBtnText}>💬 الردود والتعليقات</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* 4. نافذة المعاينة والفرز الذكي للتعليقات */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
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
                    {/* زر الحذف المتاح للتاجر لردع التعليقات غير اللائقة */}
                    <TouchableOpacity onPress={() => handleDeleteComment(item.id)} style={styles.deleteCommentBtn}>
                      <Text style={styles.deleteText}>🗑️ حذف</Text>
                    </TouchableOpacity>
                    
                    {/* عرض الاسم والشارة المفروزة */}
                    <View style={styles.commentBodyArea}>
                      <View style={styles.commentHeaderRow}>
                        <Text style={[
                          styles.roleBadge, 
                          item.user_role === 'driver' ? styles.driverBadge : styles.customerBadge
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
              <Text style={{textAlign:'center', color:'#718096', fontWeight:'bold', fontFamily:'Tajawal'}}>إغلاق النافذة ❌</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: '#FAFBFD' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileCard: { backgroundColor: '#FFFFFF', width: '100%', borderRadius: 16, padding: 15, flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  logoContainer: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#F26522', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  logoImage: { width: '100%', height: '100%' },
  profileInput: { flex: 1, marginRight: 15, borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8, padding: 10, backgroundColor: '#F8FAFC', fontFamily:'Tajawal' },
  card: { backgroundColor: '#FFFFFF', width: '100%', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'right', marginBottom: 12, color: '#1B2A6B', fontFamily:'Cairo' },
  input: { borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8, padding: 12, textAlign: 'right', backgroundColor: '#F8FAFC', marginTop: 8, fontFamily:'Tajawal' },
  checkboxRow: { flexDirection: 'row-reverse', alignItems: 'center', padding: 10, backgroundColor: '#FFF5F5', borderRadius: 8, marginTop: 8 },
  checkboxActive: { backgroundColor: '#F0FFF4', borderColor: '#C6F6D5' },
  checkboxText: { fontSize: 10, flex: 1, textAlign: 'right', fontFamily:'Tajawal' },
  photoUploadBtn: { backgroundColor: '#111A44', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  previewImage: { width: '100%', height: 150, borderRadius: 8, marginTop: 10, resizeMode: 'cover' },
  submitBtn: { backgroundColor: '#F26522', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontFamily:'Cairo' },
  
  // تنسيقات قائمة المنشورات والتعليقات المفروزة
  postItemRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  postInfo: { alignItems: 'flex-end', flex: 1, marginLeft: 10 },
  postDescText: { fontSize: 13, fontWeight: '500', color: '#2D3748', fontFamily:'Tajawal' },
  mediaTypeBadge: { fontSize: 10, color: '#718096', marginTop: 2, fontFamily:'Tajawal' },
  commentCheckBtn: { backgroundColor: '#FAFBFD', borderWidth: 1, borderColor: '#CBD5E0', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  commentCheckBtnText: { fontSize: 11, color: '#4A5568', fontWeight: 'bold', fontFamily:'Tajawal' },
  noPostsText: { textAlign: 'center', color: '#718096', fontSize: 12, paddingVertical: 15, fontFamily:'Tajawal' },
  
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#FFF', height: '58%', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#1B2A6B', fontFamily: 'Cairo' },
  
  commentContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
  commentBodyArea: { flex: 1, alignItems: 'flex-end', marginLeft: 15 },
  commentHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  commenterName: { fontSize: 13, fontWeight: 'bold', color: '#1A202C', marginRight: 8, fontFamily:'Tajawal' },
  commentContentText: { fontSize: 13, color: '#4A5568', textAlign: 'right', fontFamily:'Tajawal' },
  
  roleBadge: { fontSize: 9, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden', fontWeight: 'bold', fontFamily: 'Tajawal' },
  customerBadge: { backgroundColor: '#EBF8FF', color: '#2B6CB0' }, // شارة زرقاء ناصعة للزبائن
  driverBadge: { backgroundColor: '#FEFCBF', color: '#744210' }, // شارة ذهبية لفرسان التوصيل
  
  deleteCommentBtn: { backgroundColor: '#FFF5F5', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  deleteText: { color: '#E53E3E', fontSize: 11, fontWeight: 'bold', fontFamily:'Tajawal' },
  noCommentsText: { textAlign: 'center', color: '#718096', fontSize: 13, marginTop: 40, fontFamily: 'Tajawal' },
  closeModalBtn: { marginTop: 15, paddingVertical: 10 }
});
