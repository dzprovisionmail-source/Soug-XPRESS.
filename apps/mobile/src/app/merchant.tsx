import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

interface StoreProfile {
  name: string;
  logo_url: string | null;
}

export default function MerchantDashboard() {
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  
  // بيانات الهوية التجارية للمتجر
  const [storeName, setStoreName] = useState('');
  const [storeLogo, setStoreLogo] = useState<string | null>(null);

  // بيانات المنشور الترويجي الجديد
  const [description, setDescription] = useState('');
  const [socialUrl, setSocialUrl] = useState('');
  const [localPhoto, setLocalPhoto] = useState<string | null>(null);
  const [isOwnVideoChecked, setIsOwnVideoChecked] = useState(false); // تعهد ملكية الفيديو

  // جلب بيانات المتجر الحالية عند فتح الشاشة
  useEffect(() => {
    fetchStoreProfile();
  }, []);

  const fetchStoreProfile = async () => {
    try {
      const userResult = await supabase.auth.getUser();
      const userId = userResult.data.user?.id;
      if (!userId) return;

      const { data, error } = await supabase.from('stores').select('name, logo_url').eq('id', userId).single();
      if (error) throw error;

      if (data) {
        setStoreName(data.name || '');
        setStoreLogo(data.logo_url || null);
      }
    } catch (error) {
      console.log('خطأ في جلب بيانات البروفايل:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  // 🖼️ 1. اختيار اللوقو أو صورة المتجر من الألبوم
  const pickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('صلاحية مرفوضة ⚠️', 'نحتاج صلاحية المعرض لتحديث اللوقو الخاص بك.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // صور فقط
      allowsEditing: true,
      aspect: [1, 1], // لوقو مربع ومثالي
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setStoreLogo(result.assets[0].uri);
      // يمكنك هنا إضافة دالة الرفع التلقائي للوقو في السيرفر لتحديث بروفايل المحل ديركت
    }
  };

  // 🖼️ 2. اختيار صورة المنتج/المعرض من الألبوم (ممنوع الفيديوهات تماماً لحماية السعة)
  const pickProductPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // صور فقط لحماية الداتا سعة السيرفر
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setLocalPhoto(result.assets[0].uri);
      setSocialUrl(''); // تفريغ حقل الرابط إذا تم اختيار صورة محلية
    }
  };

  // 🚀 3. دالة النشر النهائي بالتوافق مع الشروط اللوجستية
  const handlePublishContent = async () => {
    if (!localPhoto && !socialUrl.trim()) {
      Alert.alert('تنبيه ⚠️', 'الرجاء إدخال رابط (تيك توك/فيسبوك/انستا/يوتيوب) أو اختيار صورة من الألبوم.');
      return;
    }

    if (socialUrl.trim() && !isOwnVideoChecked) {
      Alert.alert('تعهد الملكية الرقمية 🔐', 'يرجى تأكيد التعهد بأن الفيديو خاص بتجارتك المعنية وليس لتاجر آخر قبل النشر.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('تنبيه ⚠️', 'الرجاء إدخال وصف تجاري قصير للمنشور.');
      return;
    }

    setLoading(true);
    try {
      const userResult = await supabase.auth.getUser();
      const userId = userResult.data.user?.id;
      if (!userId) throw new Error('جلسة المستخدم غير نشطة');

      let finalMediaUrl = socialUrl.trim();

      // إذا كانت صورة محليّة من الألبوم، نرفعها ديركت لسيرفر التخزين المحدود
      if (localPhoto) {
        const fileName = `${userId}/products/${Date.now()}.jpg`;
        const response = await fetch(localPhoto);
        const blob = await response.blob();

        const { error: storageError } = await supabase.storage
          .from('store-media')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (storageError) throw storageError;

        const { data: urlData } = supabase.storage.from('store-media').getPublicUrl(fileName);
        finalMediaUrl = urlData.publicUrl;
      }

      // حفظ تتبع المنشور في جدول قاعدة البيانات
      const { error: dbError } = await supabase.from('store_media').insert([
        {
          store_id: userId,
          media_url: finalMediaUrl,
          media_type: localPhoto ? 'photo' : 'social_link',
          description: description.trim()
        }
      ]);

      if (dbError) throw dbError;

      // تحديث اسم المتجر إذا قام التاجر بتغييره في الأعلى
      await supabase.from('stores').update({ name: storeName }).eq('id', userId);

      Alert.alert('تم النشر بنجاح 🎉', 'منشورك التجاري الحديث متاح الآن لزبائن سوق إكسبريس في عين الصفراء.');
      setDescription('');
      setSocialUrl('');
      setLocalPhoto(null);
      setIsOwnVideoChecked(false);

    } catch (error: any) {
      Alert.alert('فشل في عملية النشر', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F26522" /></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* 🏪 القسم الأول: الهوية التجارية والبروفايل للمحل */}
      <View style={styles.profileCard}>
        <TouchableOpacity style={styles.logoContainer} onPress={pickLogo}>
          {storeLogo ? (
            <Image source={{ uri: storeLogo }} style={styles.logoImage} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderText}>إضافة لوقو 🖼️</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          <Text style={styles.inputLabel}>الاسم التجاري للمحل (يظهر للزبائن):</Text>
          <TextInput
            style={styles.profileInput}
            value={storeName}
            onChangeText={setStoreName}
            placeholder="مثال: مجوهرات الأمل / فاست فود السعادة"
            textAlign="right"
          />
        </View>
      </View>

      {/* 🚀 القسم الثاني: واجهة إضافة العروض السلسة والواضحة */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📣 نشر عرض تجاري سريع وموفر</Text>
        <Text style={styles.infoText}>اختر رفع صورة للمنتج من الألبوم ديركت، أو ضع رابط فيديو ترويجي جاهز لتقليص استهلاك الإنترنت.</Text>

        {/* حقل إدخال رابط السوشيال ميديا */}
        <Text style={styles.inputLabel}>رابط فيديو أو صورة خارجية:</Text>
        <TextInput
          style={styles.input}
          placeholder="إلصق رابط تيك توك، فيسبوك، انستا، أو يوتيوب هنا..."
          value={socialUrl}
          onChangeText={(text) => {
            setSocialUrl(text);
            if (text) setLocalPhoto(null); // إلغاء الصورة المحلية إذا كتب رابطاً
          }}
          disabled={!!localPhoto}
        />

        {/* تعهد مصداقية الفيديو للتاجر المعني */}
        {socialUrl.length > 0 && (
          <TouchableOpacity 
            style={[styles.checkboxRow, isOwnVideoChecked && styles.checkboxActive]} 
            onPress={() => setIsOwnVideoChecked(!isOwnVideoChecked)}
          >
            <Text style={styles.checkboxText}>
              {isOwnVideoChecked ? '✅ أتعهد بأن هذا الفيديو خاص بنشاطي التجاري مية بالمية' : '⬜ أقر وأتعهد بأن هذا الفيديو ملك لتجارتي وليس لتاجر آخر'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>أو</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* زر رفع صورة من الألبوم مباشرة */}
        <TouchableOpacity style={styles.photoUploadBtn} onPress={pickProductPhoto}>
          <Text style={styles.photoUploadBtnText}>🖼️ تجميل ورفع صورة مباشرة من الألبوم</Text>
        </TouchableOpacity>

        {/* معاينة الصورة المختارة من الهاتف قبل الرفع */}
        {localPhoto && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: localPhoto }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => setLocalPhoto(null)}>
              <Text style={styles.removeBtnText}>إلغاء الصورة ❌</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* حقل الوصف المحدود بـ 50 حرفاً */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.charCounter}>{50 - description.length} حرف متبقي</Text>
            <Text style={styles.inputLabel}>الوصف التجاري السريع العرض (أقصى حد 50 حرف):</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="اكتب عبارة ترويجية قصيرة وجذابة..."
            maxLength={50}
            value={description}
            onChangeText={setDescription}
            multiline={true}
          />
        </View>

        {/* زر الإرسال والنشر النهائي الفوري */}
        <TouchableOpacity style={styles.submitBtn} onPress={handlePublishContent} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>🚀 نشر وتحديث العرض ديركت في ثانية</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: '#FAFBFD', alignItems: 'center', paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFBFD' },
  
  // تصفيف كارت البروفايل العلوي
  profileCard: { backgroundColor: '#FFFFFF', width: '100%', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 15 },
  logoContainer: { width: 70, height: 70, borderRadius: 35, overflow: 'hidden', borderWidth: 2, borderColor: '#F26522', backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  logoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  logoPlaceholder: { padding: 5, alignItems: 'center' },
  logoPlaceholderText: { fontSize: 10, color: '#718096', fontFamily: 'Cairo', textAlign: 'center' },
  profileInfo: { flex: 1, marginRight: 15, alignItems: 'flex-reverse' },
  profileInput: { borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8, padding: 10, fontSize: 13, backgroundColor: '#F8FAFC', fontFamily: 'Tajawal', marginTop: 5, width: '100%' },

  // تصفيف كارت المنشورات
  card: { backgroundColor: '#FFFFFF', width: '100%', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#111A44', fontFamily: 'Cairo', textAlign: 'right', marginBottom: 5 },
  infoText: { fontSize: 11, color: '#718096', fontFamily: 'Tajawal', textAlign: 'right', marginBottom: 20, lineHeight: 18 },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#4A5568', fontFamily: 'Cairo', textAlign: 'right', marginTop: 10, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8, padding: 12, textAlign: 'right', fontSize: 13, fontFamily: 'Tajawal', backgroundColor: '#F8FAFC' },
  textArea: { minHeight: 50, textAlignVertical: 'top' },
  
  // تصفيف التعهد الخاص بالفيديو
  checkboxRow: { flexDirection: 'row-reverse', alignItems: 'center', padding: 10, backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FED7D7', borderRadius: 8, marginTop: 8 },
  checkboxActive: { backgroundColor: '#F0FFF4', borderColor: '#C6F6D5' },
  checkboxText: { fontSize: 10, color: '#2D3748', fontFamily: 'Tajawal', flex: 1, textAlign: 'right' },

  // الفاصل البصري
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { marginHorizontal: 10, color: '#A0AEC0', fontSize: 12, fontFamily: 'Tajawal' },

  // أزرار رفع الصور ومعاينتها
  photoUploadBtn: { backgroundColor: '#111A44', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', width: '100%' },
  photoUploadBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', fontFamily: 'Cairo' },
  previewContainer: { width: '100%', alignItems: 'center', marginTop: 12, borderRadius: 10, backgroundColor: '#F8FAFC', padding: 8, borderWidth: 1, borderColor: '#CBD5E0' },
  previewImage: { width: '100%', height: 150, borderRadius: 8, resizeMode: 'cover' },
  removeBtn: { marginTop: 6 },
  removeBtnText: { color: '#E53E3E', fontSize: 11, fontFamily: 'Cairo', fontWeight: 'bold' },

  // العداد والارسال
  inputGroup: { marginTop: 15, width: '100%' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' },
  charCounter: { fontSize: 11, color: '#F26522', fontFamily: 'Tajawal', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#F26522', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 25 },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', fontFamily: 'Cairo' }
});
