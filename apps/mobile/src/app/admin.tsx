import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { supabase } from './supabase'; // استيراد العميل السحابي مباشرة

interface Store {
  id: string;
  name: string;
  category: string;
  zone: string;
  is_approved: boolean | null;
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
  const [refreshing, setRefreshing] = useState(false);

  // حقول إنشاء متجر ترويجي/حي جديد
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCategory, setNewStoreCategory] = useState('سوبر ماركت');
  const [newStoreZone, setNewStoreZone] = useState('');
  const [isInserting, setIsInserting] = useState(false);

  // جلب البيانات حية من سيرفر Supabase فور فتح اللوحة
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. جلب كافة المحلات وترتيبها من الأحدث للأقدم
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (storesError) throw storesError;

      // 2. جلب الموزعين والعدادات والديون المالية
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
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // 🚀 وظيفة استراتيجية: إدراج متجر حي (مثال ترويجي معتمد تلقائياً) لجذب المستخدمين في البداية
  const handleAddStoreDirectly = async () => {
    if (!newStoreName.trim() || !newStoreZone.trim()) {
      Alert.alert('تنبيه', 'الرجاء ملء اسم المحل والحي أولاً.');
      return;
    }

    setIsInserting(true);
    try {
      const { error } = await supabase
        .from('stores')
        .insert([
          { 
            name: newStoreName.trim(), 
            category: newStoreCategory, 
            zone: newStoreZone.trim(),
            is_approved: true // تفعيل واعتماد فوري ومباشر لأنه مضاف من طرف المدير كـ مثال حي
          }
        ]);

      if (error) throw error;

      Alert.alert('تم إنشاء متجر حي بنجاح 🎉', `المحل (${newStoreName}) مفعل ومتاح الآن في التغذية العامة للمنصة ليراه الجميع.`);
      setNewStoreName('');
      setNewStoreZone('');
      fetchData(); // تحديث فوري للقائمة
    } catch (error: any) {
      Alert.alert('فشلت الإضافة', error.message);
    } finally {
      setIsInserting(false);
    }
  };

  // 🔄 التحكم المطلق: تفعيل/اعتماد أو تجميد أي محل تجاري مسجل بضغطة زر واحدة
  const handleToggleStoreApproval = async (storeId: string, currentStatus: boolean | null) => {
    const nextStatus = !currentStatus;
    try {
      const { error } = await supabase
        .from('stores')
        .update({ is_approved: nextStatus })
        .eq('id', storeId);

      if (error) throw error;
      Alert.alert(nextStatus ? 'تم تفعيل واعتماد المتجر 🟢' : 'تم تجميد حساب المتجر 🔴');
      fetchData();
    } catch (error: any) {
      Alert.alert('خطأ في تحديث الحالة', error.message);
    }
  };

  // 🗑️ صلاحية الحذف المطلق: مسح المتاجر الميتة أو العينات المخالفة لتنظيف قاعدة البيانات
  const handleDeleteStore = async (storeId: string, storeName: string) => {
    Alert.alert('حذف نهائي ⚠️', `هل أنت متأكد من رغبتك في حذف محل (${storeName}) نهائياً من السيرفر؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'نعم، احذفه ديركت', style: 'destructive', onPress: async () => {
          try {
            const { error } = await supabase.from('stores').delete().eq('id', storeId);
            if (error) throw error;
            Alert.alert('نجاح الحذف', 'تمت إزالة المتجر بنجاح.');
            fetchData();
          } catch (error: any) {
            Alert.alert('فشل الحذف', error.message);
          }
        }
      }
    ]);
  };

  // 💳 تصفير عداد الموزع ورفع الحظر عنه بعد استلام مستحقات بريدي موب
  const handleResetDriverCounter = async (id: string, name: string) => {
    Alert.alert(
      'تأكيد استلام الدفع',
      `هل تأكدت من وصول مستحقات الموقع من الموزع (${name}) عبر بريدي موب لتصفير عداده وإعادة تفعيله؟`,
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
              Alert.alert('تم التفعيل', `تم فتح حساب الموزع ${name} وتصفير ديونه بنجاح في عين الصفراء.`);
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
        <Text style={{ marginTop: 10, fontFamily: 'Cairo', color: '#111A44' }}>جاري الاتصال الآمن بالسيرفر السحابي...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>لوحة التحكم العليا للمدير العام 👑</Text>
        <Text style={styles.headerSubtitle}>إدارة سيرفر سوق عين الصفراء الحي | DZ Pro Vision</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#F26522']} />}
      >
        
        {/* قسم تغذية السوق مسبقاً وبناء عينات المتاجر المفعلة فورا */}
        <View style={styles.adminFormCard}>
          <Text style={styles.sectionFormTitle}>🎯 إنشاء متجر حي (أمثلة جذب وتغذية المنصة)</Text>
          
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

          <TouchableOpacity style={styles.insertButton} onPress={handleAddStoreDirectly} disabled={isInserting}>
            {isInserting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.insertButtonText}>🚀 حقن ونشر المتجر حياً في السيرفر</Text>}
          </TouchableOpacity>
        </View>

        {/* استعراض والتحكم المطلق في كافة المحلات النشطة */}
        <Text style={styles.sectionTitle}>🛒 إدارة ومراقبة المحلات النشطة في قاعدة البيانات ({stores.length})</Text>
        {stores.length === 0 ? (
          <Text style={styles.noDataText}>لا توجد أي محلات مسجلة حالياً.</Text>
        ) : (
          stores.map(store => (
            <View key={store.id} style={styles.dataRowCard}>
              <View style={styles.storeMainMeta}>
                <Text style={styles.dataRowText}><Text style={styles.boldText}>{store.name}</Text> ({store.category})</Text>
                <Text style={styles.dataRowSubtext}>الموقع: {store.zone} | كود: {store.id.substring(0,8)}...</Text>
              </View>
              
              {/* شريط الصلاحيات المطلق للمدير لتفعيل أو إلغاء تفعيل أو حذف المتجر */}
              <View style={styles.storeAdminActions}>
                <TouchableOpacity 
                  style={[styles.actionToggleBtn, store.is_approved ? styles.suspendToggleBtn : styles.approveToggleBtn]} 
                  onPress={() => handleToggleStoreApproval(store.id, store.is_approved)}
                >
                  <Text style={styles.actionBtnText}>{store.is_approved ? 'تجميد 🔒' : 'اعتماد ✅'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionDeleteBtn} onPress={() => handleDeleteStore(store.id, store.name)}>
                  <Text style={styles.actionBtnText}>حذف 🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* الرقابة المالية لفرسان التوصيل */}
        <Text style={styles.sectionTitle}>💳 رقابة الموزعين وتأكيد دفع الـ 1000 دج عبر بريدي موب</Text>
        {drivers.length === 0 ? (
          <Text style={styles.noDataText}>لا يوجد موزعون مسجلون حالياً بالمنصة.</Text>
        ) : (
          drivers.map(driver => (
            <View key={driver.id} style={styles.driverControlCard}>
              <View style={styles.driverHeader}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <Text style={[styles.statusBadge, driver.is_suspended && styles.statusSuspended]}>
                  {driver.is_suspended ? '🔴 محظور لوجوب الدفع' : '🟢 نشط ماليّاً'}
                </Text>
              </View>
              <Text style={styles.driverTripsCount}>العداد الميداني: {driver.delivery_counter} / 50 توصيلة</Text>
              <Text style={styles.driverDebt}>حق الموقع المتراكم: {driver.total_owed_to_site} دج</Text>
              
              {driver.is_suspended && (
                <TouchableOpacity style={styles.resetCounterButton} onPress={() => handleResetDriverCounter(driver.id, driver.name)}>
                  <Text style={styles.resetCounterButtonText}>✅ تأكيد استلام الدفع المالي وإعادة التفعيل</Text>
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
  header: { backgroundColor: '#111A44', padding: 20, alignItems: 'flex-end', borderBottomWidth: 3, borderColor: '#F26522', paddingTop: 45 },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#FFFFFF', fontFamily: 'Cairo' },
  headerSubtitle: { fontSize: 10, color: '#A0AEC0', fontFamily: 'Tajawal', marginTop: 4 },
  scrollContent: { paddingBottom: 40 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#111A44', marginHorizontal: 15, marginTop: 25, marginBottom: 10, textAlign: 'right', fontFamily: 'Cairo' },
  adminFormCard: { backgroundColor: '#FFFFFF', marginHorizontal: 15, marginTop: 15, borderRadius: 14, padding: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionFormTitle: { fontSize: 13, fontWeight: 'bold', color: '#1B2A6B', textAlign: 'right', fontFamily: 'Cairo', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#EDF2F7', paddingBottom: 8 },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#4A5568', textAlign: 'right', marginBottom: 6, fontFamily: 'Cairo' },
  input: { borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8, padding: 12, textAlign: 'right', fontSize: 13, fontFamily: 'Tajawal', backgroundColor: '#F8FAFC', marginBottom: 15 },
  categoryPickerRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 15, gap: 5 },
  pickerButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E0', backgroundColor: '#FFF' },
  activePickerButton: { borderColor: '#F26522', backgroundColor: 'rgba(242, 101, 34, 0.08)' },
  pickerButtonText: { fontSize: 11, color: '#4A5568', fontFamily: 'Tajawal' },
  activePickerButtonText: { color: '#F26522', fontWeight: 'bold' },
  insertButton: { backgroundColor: '#F26522', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  insertButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', fontFamily: 'Cairo' },
  
  // تنسيقات أسطر إدارة وصلاحيات المحلات
  dataRowCard: { backgroundColor: '#FFFFFF', marginHorizontal: 15, marginBottom: 10, borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'column', alignItems: 'stretch' },
  storeMainMeta: { alignItems: 'flex-end', width: '100%' },
  dataRowText: { fontSize: 14, color: '#2D3748', fontFamily: 'Tajawal' },
  dataRowSubtext: { fontSize: 11, color: '#718096', fontFamily: 'Tajawal', marginTop: 2 },
  boldText: { fontWeight: 'bold', color: '#111A44' },
  storeAdminActions: { flexDirection: 'row', justifyContent: 'flex-start', marginTop: 12, borderTopWidth: 1, borderTopColor: '#EDF2F7', paddingTop: 10 },
  actionToggleBtn: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 6, marginRight: 8 },
  approveToggleBtn: { backgroundColor: '#E6FFFA', borderWidth: 1, borderColor: '#319795' },
  suspendToggleBtn: { backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#E53E3E' },
  actionDeleteBtn: { backgroundColor: '#EDF2F7', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E0' },
  actionBtnText: { fontSize: 11, fontWeight: 'bold', fontFamily: 'Tajawal', color: '#4A5568' },

  // كروت الرقابة المالية لفرسان التوصيل
  driverControlCard: { backgroundColor: '#FFFFFF', marginHorizontal: 15, marginBottom: 12, borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  driverHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EDF2F7', paddingBottom: 8 },
  driverName: { fontSize: 14, fontWeight: 'bold', color: '#111A44', fontFamily: 'Cairo' },
  statusBadge: { backgroundColor: '#E6F4EA', color: '#137333', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, fontSize: 11, fontWeight: 'bold', fontFamily: 'Cairo', overflow: 'hidden' },
  statusSuspended: { backgroundColor: '#FCE8E6', color: '#C5221F' },
  driverTripsCount: { fontSize: 13, color: '#4A5568', textAlign: 'right', marginTop: 8, fontFamily: 'Tajawal' },
  driverDebt: { fontSize: 13, color: '#F26522', fontWeight: 'bold', textAlign: 'right', marginTop: 2, fontFamily: 'Tajawal' },
  resetCounterButton: { backgroundColor: '#137333', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  resetCounterButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold', fontFamily: 'Cairo' },
  noDataText: { textAlign: 'center', color: '#718096', marginVertical: 15, fontFamily: 'Tajawal', fontSize: 12 }
});
