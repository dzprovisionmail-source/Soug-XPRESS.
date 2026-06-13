import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from './supabase'; // استيراد العميل السحابي مباشرة

interface Store {
  id: string;
  name: string;
  category: string;
  zone: string;
}

interface Driver {
  id: string;
  name: string;
  delivery_counter: number;
  total_owed_to_site: number;
  is_suspended: boolean;
}

export default function AdminDashboard() {
  const [stores, setStores] = useState<Store[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCategory, setNewStoreCategory] = useState('سوبر ماركت');
  const [newStoreZone, setNewStoreZone] = useState('');

  // جلب البيانات حية من سيرفر Supabase فور فتح اللوحة
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. جلب المحلات
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .order('signup_date', { ascending: false });
        
      if (storesError) throw storesError;

      // 2. جلب الموزعين والعدادات
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });

      if (driversError) throw driversError;

      setStores(storesData || []);
      setDrivers(driversData || []);
    } catch (error: any) {
      Alert.alert('خطأ في جلب البيانات', error.message);
    } finally {
      setLoading(false);
    }
  };

  // إدراج محل تجاري حقيقي في قاعدة البيانات السحابية
  const handleAddStoreDirectly = async () => {
    if (!newStoreName || !newStoreZone) {
      Alert.alert('تنبيه', 'الرجاء ملء اسم المحل والحي أولاً');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('stores')
        .insert([
          { name: newStoreName, category: newStoreCategory, zone: newStoreZone }
        ])
        .select();

      if (error) throw error;

      Alert.alert('نجاح', `تم تسجيل ${newStoreName} سحابياً وهو متاح الآن لكل الزبائن!`);
      setNewStoreName('');
      setNewStoreZone('');
      fetchData(); // تحديث القائمة فوراً
    } catch (error: any) {
      Alert.alert('فشلت الإضافة', error.message);
    }
  };

  // تصفير عداد الموزع ورفع الحظر عنه بعد استلام 1000 دج بريدي موب
  const handleResetDriverCounter = async (id: string, name: string) => {
    Alert.alert(
      'تأكيد استلام الدفع',
      `هل تأكدت من وصول مستحقات الموقع من الموزع (${name}) عبر بريدي موب لتصفير عداده؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'نعم، تم الاستلام', 
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('drivers')
                .update({ delivery_counter: 0, is_suspended: false, total_owed_to_site: 0 })
                .eq('id', id);

              if (error) throw error;
              Alert.alert('تم التفعيل', `تم فتح حساب الموزع ${name} وتصفير ديونه بنجاح.`);
              fetchData();
            } catch (error: any) {
              Alert.alert('خطأ في التحديث', error.message);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#F26522" />
        <Text style={{ marginTop: 10, fontFamily: 'Cairo', color: '#111A44' }}>جاري الاتصال بالسيرفر السحابي...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>لوحة التحكم العليا للمدير العام 👑</Text>
        <Text style={styles.headerSubtitle}>إدارة سيرفر سوق عين الصفراء الحي | DZ Pro Vision</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* قسم تغذية السوق مسبقاً */}
        <View style={styles.adminFormCard}>
          <Text style={styles.inputLabel}>اسم المحل التجاري:</Text>
          <TextInput style={styles.input} placeholder="مثال: مخبزة الفتح، ملبنة الشفاء..." value={newStoreName} onChangeText={setNewStoreName} />

          <Text style={styles.inputLabel}>التصنيف الرئيسي للنشاط:</Text>
          <View style={styles.categoryPickerRow}>
            {['سوبر ماركت', 'مطاعم', 'صيدليات', 'خضار وفواكه'].map((cat) => (
              <TouchableOpacity key={cat} style={[styles.pickerButton, newStoreCategory === cat && styles.activePickerButton]} onPress={() => setNewStoreCategory(cat)}>
                <Text style={[styles.pickerButtonText, newStoreCategory === cat && styles.activePickerButtonText]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>الحي أو المنطقة داخل عين الصفراء:</Text>
          <TextInput style={styles.input} placeholder="مثال: حي الضلعة، وسط المدينة..." value={newStoreZone} onChangeText={setNewStoreZone} />

          <TouchableOpacity style={styles.insertButton} onPress={handleAddStoreDirectly}>
            <Text style={styles.insertButtonText}>🚀 إدراج وتفعيل حيّ في السيرفر</Text>
          </TouchableOpacity>
        </View>

        {/* استعراض المحلات المضافة من السيرفر */}
        <Text style={styles.sectionTitle}>🛒 المحلات النشطة في قاعدة البيانات ({stores.length})</Text>
        {stores.map(store => (
          <View key={store.id} style={styles.dataRowCard}>
            <Text style={styles.dataRowText}><Text style={styles.boldText}>{store.name}</Text> ({store.category})</Text>
            <Text style={styles.dataRowSubtext}>الموقع: {store.zone} | كود السيرفر: {store.id.substring(0,8)}...</Text>
          </View>
        ))}

        {/* الرقابة المالية للموزعين */}
        <Text style={styles.sectionTitle}>💳 رقابة الموزعين وتأكيد دفع الـ 1000 د.ج</Text>
        {drivers.length === 0 ? (
          <Text style={styles.noDataText}>لا يوجد موزعون مسجلون حالياً.</Text>
        ) : (
          drivers.map(driver => (
            <View key={driver.id} style={styles.driverControlCard}>
              <View style={styles.driverHeader}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <Text style={[styles.statusBadge, driver.is_suspended && styles.statusSuspended]}>
                  {driver.is_suspended ? '🔴 محظور لوجوب الدفع' : '🟢 نشط'}
                </Text>
              </View>
              <Text style={styles.driverTripsCount}>العداد الحالي: {driver.delivery_counter} / 50 توصيلة</Text>
              <Text style={styles.driverDebt}>مستحقات الموقع الحالية: {driver.total_owed_to_site} د.ج</Text>
              
              {driver.is_suspended && (
                <TouchableOpacity style={styles.resetCounterButton} onPress={() => handleResetDriverCounter(driver.id, driver.name)}>
                  <Text style={styles.resetCounterButtonText}>✅ تأكيد استلام الدفع وتفعيل الحساب</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFD' },
  header: { backgroundColor: '#111A44', padding: 20, alignItems: 'flex-end', borderBottomWidth: 3, borderColor: '#F26522' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', fontFamily: 'Cairo' },
  headerSubtitle: { fontSize: 11, color: '#A0AEC0', fontFamily: 'Tajawal', marginTop: 4 },
  scrollContent: { paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#111A44', marginHorizontal: 15, marginTop: 22, marginBottom: 10, textAlign: 'right', fontFamily: 'Cairo' },
  adminFormCard: { backgroundColor: '#FFFFFF', marginHorizontal: 15, marginTop: 15, borderRadius: 14, padding: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#4A5568', textAlign: 'right', marginBottom: 6, fontFamily: 'Cairo' },
  input: { borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8, padding: 12, textAlign: 'right', fontSize: 14, fontFamily: 'Tajawal', backgroundColor: '#F8FAFC', marginBottom: 15 },
  categoryPickerRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 15, gap: 5 },
  pickerButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E0', backgroundColor: '#FFF' },
  activePickerButton: { borderColor: '#F26522', backgroundColor: 'rgba(242, 101, 34, 0.08)' },
  pickerButtonText: { fontSize: 12, color: '#4A5568', fontFamily: 'Tajawal' },
  activePickerButtonText: { color: '#F26522', fontWeight: 'bold' },
  insertButton: { backgroundColor: '#F26522', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  insertButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', fontFamily: 'Cairo' },
  dataRowCard: { backgroundColor: '#FFFFFF', marginHorizontal: 15, marginBottom: 8, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'flex-end' },
  dataRowText: { fontSize: 14, color: '#2D3748', fontFamily: 'Tajawal' },
  dataRowSubtext: { fontSize: 11, color: '#718096', fontFamily: 'Tajawal', marginTop: 2 },
  boldText: { fontWeight: 'bold', color: '#111A44' },
  driverControlCard: { backgroundColor: '#FFFFFF', marginHorizontal: 15, marginBottom: 12, borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  driverHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EDF2F7', paddingBottom: 8 },
  driverName: { fontSize: 14, fontWeight: 'bold', color: '#111A44', fontFamily: 'Cairo' },
  statusBadge: { backgroundColor: '#E6F4EA', color: '#137333', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, fontSize: 12, fontWeight: 'bold', fontFamily: 'Cairo' },
  statusSuspended: { backgroundColor: '#FCE8E6', color: '#C5221F' },
  driverTripsCount: { fontSize: 13, color: '#4A5568', textAlign: 'right', marginTop: 8, fontFamily: 'Tajawal' },
  driverDebt: { fontSize: 13, color: '#F26522', fontWeight: 'bold', textAlign: 'right', marginTop: 2, fontFamily: 'Tajawal' },
  resetCounterButton: { backgroundColor: '#137333', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  resetCounterButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold', fontFamily: 'Cairo' },
  noDataText: { textAlign: 'center', color: '#718096', marginVertical: 15, fontFamily: 'Tajawal' }
});
