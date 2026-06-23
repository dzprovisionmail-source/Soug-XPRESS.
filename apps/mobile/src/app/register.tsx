import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from './supabase';

// قائمة الأحياء الرسمية والدقيقة لعين الصفراء بناءً على تسميات أهل المدينة
const AIN_SEFRA_NEIGHBORHOODS = [
  'وسط المدينة فيلاج',
  'بني الجديد',
  'بومريفق',
  'شارع بوعرفة عبد الرحمن',
  'بني وهراني',
  'بني بالڤرع',
  'سيتي آمال',
  'كاسطور',
  'برج الحمام',
  'عمارات مقابل المستشفى',
  'الڤرابة',
  'عين الرشاڤ',
  'المويلح',
  'المناكيب',
  'الحرارة',
  'الحمار (17 اكتوبر)',
  'شناوا',
  'عين الصفراء الجديدة',
  'الظلعة 1',
  'الظلعة 2',
  'الظلعة 3',
  'الظلعة 4',
  '19 مارس',
  '52 لوجمو',
  'القصر',
  'حيدرة',
  'حي الرمال (غزة)',
  'شارع بوشارب (دبي)',
  'طريق المدرسة القرانية'
];

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<'customer' | 'merchant' | 'driver'>('customer');

  // الحقول الأمنية الموحدة
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // إدارة القائمة المنسدلة للأحياء
  const [selectedZone, setSelectedZone] = useState('اختر الحي من القائمة...');
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);

  // حقول الزبون
  const [customerName, setCustomerName] = useState('');
  const [customerAddressDetails, setCustomerAddressDetails] = useState('');

  // حقول التاجر
  const [storeName, setStoreName] = useState('');
  const [merchantName, setMerchantName] = useState('');

  // حقول الموصل
  const [driverName, setDriverName] = useState('');
  const [vehicleType, setVehicleType] = useState<'دراجة نارية' | 'سيارة'>('دراجة نارية');

  const handleRegister = async () => {
    if (!phone || !password) {
      Alert.alert('تنبيه', 'الرجاء ملء رقم الهاتف وكلمة المرور أولاً');
      return;
    }

    if ((userType === 'customer' || userType === 'merchant') && selectedZone === 'اختر الحي من القائمة...') {
      Alert.alert('تنبيه', 'الرجاء تحديد الحي لإتمام عملية التسجيل بنجاح');
      return;
    }

    setLoading(true);
    try {
      // 1. إنشاء الحساب في عميل الأمان السحابي Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
          phone: phone,
          password: password,
          options: {
            data: {
              role: userType === 'customer' ? 'client' : userType
            }
          }
        });

      if (authError) throw authError;

      // 2. توزيع البيانات بدقة على الجداول مع إدراج الحي المختار
      if (userType === 'customer') {
        Alert.alert('تم التسجيل بنجاح 🎉', `مرحباً بك يا ${customerName}، حسابك كزبون نشط الآن في حي (${selectedZone})!`);
      } 
      else if (userType === 'merchant') {
        const { error: storeError } = await supabase.from('stores').insert([
          { 
            id: authData.user?.id,
    name: storeName, 
            category: 'سوبر ماركت', 
            zone: selectedZone, // الحي الميداني المختار من القائمة
            is_first_month: true 
          }
        ]);
        if (storeError) throw storeError;
        Alert.alert('طلب التاجر مسجل ⏳', `تم تسجيل ${storeName} بنجاح. حسابك معلق حالياً للمراجعة والأمان، وسيتصل بك المدير العام شخصياً لتفعيله على السيرفر.`);
      } 
      else if (userType === 'driver') {
        const { error: driverError } = await supabase.from('drivers').insert([
          { 
            id: authData.user?.id,
    name: driverName, 
            vehicle_type: vehicleType,
            delivery_counter: 0,
            is_suspended: true, // الحظر الافتراضي لسلامة ورقابة المنصة
            total_owed_to_site: 0
          }
        ]);
        if (driverError) throw driverError;
        Alert.alert('تم إرسال طلب الانضمام 🛵', `شكراً لك يا ${driverName}. تم تسجيل حسابك، يرجى التنسيق مع الإدارة لتسليم الوثائق وتفعيل حساب الموزع الخاص بك.`);
      }

      router.push('/');
    } catch (error: any) {
      Alert.alert('فشل التسجيل', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>إنشاء حساب جديد 📝</Text>
      <Text style={styles.subtitle}>سوق إكسبريس - بوابة عين الصفراء الرقمية</Text>

      {/* أزرار التبديل لفرز نوع الحساب والبيانات تلقائياً */}
      <View style={styles.typeSelectorRow}>
        <TouchableOpacity style={[styles.typeBtn, userType === 'driver' && styles.activeTypeBtn]} onPress={() => { setUserType('driver'); setShowZoneDropdown(false); }}>
          <Text style={[styles.typeBtnText, userType === 'driver' && styles.activeTypeBtnText]}>موصل 🛵</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.typeBtn, userType === 'merchant' && styles.activeTypeBtn]} onPress={() => { setUserType('merchant'); setShowZoneDropdown(false); }}>
          <Text style={[styles.typeBtnText, userType === 'merchant' && styles.activeTypeBtnText]}>تاجر 🛒</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.typeBtn, userType === 'customer' && styles.activeTypeBtn]} onPress={() => { setUserType('customer'); setShowZoneDropdown(false); }}>
          <Text style={[styles.typeBtnText, userType === 'customer' && styles.activeTypeBtnText]}>زبون 👤</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formCard}>
        
        {/* واجهة الزبون */}
        {userType === 'customer' && (
          <View>
            <Text style={styles.inputLabel}>الاسم الكامل للزبون:</Text>
            <TextInput style={styles.input} placeholder="مثال: أحمد عبد الجليل" value={customerName} onChangeText={setCustomerName} />
            
            <Text style={styles.inputLabel}>اختر الحي السكني (العنوان الرئيسي):</Text>
            <TouchableOpacity style={styles.dropdownSelector} onPress={() => setShowZoneDropdown(!showZoneDropdown)}>
              <Text style={styles.dropdownSelectorText}>{selectedZone}</Text>
              <Text style={{ color: '#F26522' }}>▼</Text>
            </TouchableOpacity>

            {/* القائمة المنسدلة الذكية المرتبة ومحقونة بعناوينك */}
            {showZoneDropdown && (
              <View style={styles.dropdownContainer}>
                <ScrollView nestedScrollEnabled={true}>
                  {AIN_SEFRA_NEIGHBORHOODS.map((neighborhood) => (
                    <TouchableOpacity key={neighborhood} style={styles.dropdownItem} onPress={() => { setSelectedZone(neighborhood); setShowZoneDropdown(false); }}>
                      <Text style={styles.dropdownItemText}>{neighborhood}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={styles.inputLabel}>إرشادات وتفاصيل إضافية للعنوان (بدون رقم الباب):</Text>
            <TextInput style={styles.input} placeholder="مثال: بجانب المدرسة، أو مقابل المحل الفلاني..." value={customerAddressDetails} onChangeText={setCustomerAddressDetails} />
          </View>
        )}

        {/* واجهة التاجر */}
        {userType === 'merchant' && (
          <View>
            <Text style={styles.inputLabel}>اسم المحل التجاري (يظهر في التطبيق):</Text>
            <TextInput style={styles.input} placeholder="مثال: سوبرماركت الفتح، صيدلية الشفاء..." value={storeName} onChangeText={setStoreName} />
            
            <Text style={styles.inputLabel}>اسم صاحب المحل أو المسؤول:</Text>
            <TextInput style={styles.input} placeholder="الاسم واللقب الحقيقي للتواصل الإداري" value={merchantName} onChangeText={setMerchantName} />
            
            <Text style={styles.inputLabel}>موقع المحل (اختر الحي التجاري):</Text>
            <TouchableOpacity style={styles.dropdownSelector} onPress={() => setShowZoneDropdown(!showZoneDropdown)}>
              <Text style={styles.dropdownSelectorText}>{selectedZone}</Text>
              <Text style={{ color: '#F26522' }}>▼</Text>
            </TouchableOpacity>

            {showZoneDropdown && (
              <View style={styles.dropdownContainer}>
                <ScrollView nestedScrollEnabled={true}>
                  {AIN_SEFRA_NEIGHBORHOODS.map((neighborhood) => (
                    <TouchableOpacity key={neighborhood} style={styles.dropdownItem} onPress={() => { setSelectedZone(neighborhood); setShowZoneDropdown(false); }}>
                      <Text style={styles.dropdownItemText}>{neighborhood}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* واجهة الموصل */}
        {userType === 'driver' && (
          <View>
            <Text style={styles.inputLabel}>اسم فارس التوصيل الكامل:</Text>
            <TextInput style={styles.input} placeholder="اكتب اسمك الثلاثي الحقيقي كما في الوثائق" value={driverName} onChangeText={setDriverName} />
            
            <Text style={styles.inputLabel}>نوع مركبة التوصيل الحالية:</Text>
            <View style={styles.vehicleRow}>
              <TouchableOpacity style={[styles.vehicleBtn, vehicleType === 'سيارة' && styles.activeVehicleBtn]} onPress={() => setVehicleType('سيارة')}>
                <Text style={[styles.vehicleBtnText, vehicleType === 'سيارة' && styles.activeVehicleBtnText]}>سيارة 🚗</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.vehicleBtn, vehicleType === 'دراجة نارية' && styles.activeVehicleBtn]} onPress={() => setVehicleType('دراجة نارية')}>
                <Text style={[styles.vehicleBtnText, vehicleType === 'دراجة نارية' && styles.activeVehicleBtnText]}>دراجة نارية 🏍️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* حقول الأمان الموحدة لجميع فئات المستخدمين */}
        <Text style={styles.inputLabel}>رقم الهاتف الشخصي (اسم المستخدم للدخول):</Text>
        <TextInput style={styles.input} placeholder="06xxxxxxxx أو 05xxxxxxxx" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

        <Text style={styles.inputLabel}>كلمة المرور السرية الخاصة بالحساب:</Text>
        <TextInput style={styles.input} placeholder="اكتب رمزاً سرياً قوياً ومحفوظاً" secureTextEntry={true} value={password} onChangeText={setPassword} />

        <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>🚀 إرسال طلب التسجيل للمراجعة والتشغيل</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#FAFBFD', alignItems: 'center', paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111A44', fontFamily: 'Cairo', marginTop: 15 },
  subtitle: { fontSize: 12, color: '#718096', fontFamily: 'Tajawal', marginTop: 4, marginBottom: 25 },
  typeSelectorRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 20, gap: 8 },
  typeBtn: { flex: 1, backgroundColor: '#FFF', paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  activeTypeBtn: { backgroundColor: '#111A44', borderColor: '#111A44' },
  typeBtnText: { fontSize: 13, color: '#4A5568', fontFamily: 'Cairo' },
  activeTypeBtnText: { color: '#FFF', fontWeight: 'bold' },
  formCard: { backgroundColor: '#FFFFFF', width: '100%', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#4A5568', textAlign: 'right', marginBottom: 6, fontFamily: 'Cairo', marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8, padding: 12, textAlign: 'right', fontSize: 14, fontFamily: 'Tajawal', backgroundColor: '#F8FAFC', marginBottom: 10 },
  
  // ستايل القائمة المنسدلة الاحترافية المتوافقة مع الموبايل
  dropdownSelector: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8, padding: 12, backgroundColor: '#F8FAFC', marginBottom: 12 },
  dropdownSelectorText: { fontSize: 14, fontFamily: 'Tajawal', color: '#4A5568' },
  dropdownContainer: { borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8, backgroundColor: '#FFFFFF', maxHeight: 220, overflow: 'hidden', marginBottom: 15, padding: 5 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#EDF2F7', alignItems: 'flex-end' },
  dropdownItemText: { fontSize: 13, fontFamily: 'Tajawal', color: '#2D3748' },

  vehicleRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  vehicleBtn: { flex: 1, backgroundColor: '#F8FAFC', paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E0' },
  activeVehicleBtn: { borderColor: '#F26522', backgroundColor: 'rgba(242, 101, 34, 0.05)' },
  vehicleBtnText: { fontSize: 13, color: '#4A5568', fontFamily: 'Tajawal' },
  activeVehicleBtnText: { color: '#F26522', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#F26522', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', fontFamily: 'Cairo' }
});
