import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Redirect } from 'expo-router';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Colors, Spacing, Radius, Shadow } from '../constants/theme';

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
  // All hooks must be declared before any conditional returns (Rules of Hooks)
  // 🔒 Single source of truth: role from profiles table via AuthContext
  const { userProfile, isLoading: authLoading } = useAuth();

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

  // 🔒 SECURITY GUARD — conditionals AFTER all hooks (Rules of Hooks compliant)
  if (authLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Only profiles.role = 'admin' may see this panel.
  // _layout.tsx also redirects non-admins away — this is a second layer of defense.
  if (userProfile?.role !== 'admin') {
    return <Redirect href="/(tabs)/home" />;
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: Spacing.sm, fontFamily: 'Cairo', color: Colors.navyDark }}>جاري الاتصال الآمن بالسيرفر السحابي...</Text>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.primary]} />}
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
            {isInserting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.insertButtonText}>🚀 حقن ونشر المتجر حياً في السيرفر</Text>}
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
  container: { flex: 1, backgroundColor: Colors.bgScreen },
  header: { backgroundColor: Colors.navyDark, padding: Spacing.lg, alignItems: 'flex-end', borderBottomWidth: 3, borderColor: Colors.primary, paddingTop: Spacing.headerTop },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: Colors.white, fontFamily: 'Cairo' },
  headerSubtitle: { fontSize: 10, color: Colors.textOnDarkMuted, fontFamily: 'Tajawal', marginTop: Spacing.xs },
  scrollContent: { paddingBottom: 40 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.navyDark, marginHorizontal: Spacing.base, marginTop: Spacing.xl, marginBottom: Spacing.md, textAlign: 'right', fontFamily: 'Cairo' },
  adminFormCard: { backgroundColor: Colors.bgCard, marginHorizontal: Spacing.base, marginTop: Spacing.base, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, ...Shadow.card },
  sectionFormTitle: { fontSize: 13, fontWeight: 'bold', color: Colors.navyMid, textAlign: 'right', fontFamily: 'Cairo', marginBottom: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: Spacing.sm },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: Colors.textSecondary, textAlign: 'right', marginBottom: 6, fontFamily: 'Cairo' },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, padding: Spacing.md, textAlign: 'right', fontSize: 13, fontFamily: 'Tajawal', backgroundColor: Colors.bgSubtle, marginBottom: Spacing.base },
  categoryPickerRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: Spacing.base, gap: 5 },
  pickerButton: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  activePickerButton: { borderColor: Colors.primary, backgroundColor: Colors.primaryMid },
  pickerButtonText: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'Tajawal' },
  activePickerButtonText: { color: Colors.primary, fontWeight: 'bold' },
  insertButton: { backgroundColor: Colors.primary, paddingVertical: Spacing.base, borderRadius: Radius.md, alignItems: 'center', ...Shadow.primaryBtn },
  insertButtonText: { color: Colors.white, fontSize: 14, fontWeight: 'bold', fontFamily: 'Cairo' },

  // تنسيقات أسطر إدارة وصلاحيات المحلات
  dataRowCard: { backgroundColor: Colors.bgCard, marginHorizontal: Spacing.base, marginBottom: Spacing.sm, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, flexDirection: 'column', alignItems: 'stretch', ...Shadow.card },
  storeMainMeta: { alignItems: 'flex-end', width: '100%' },
  dataRowText: { fontSize: 14, color: Colors.textBody, fontFamily: 'Tajawal' },
  dataRowSubtext: { fontSize: 11, color: Colors.textMuted, fontFamily: 'Tajawal', marginTop: 2 },
  boldText: { fontWeight: 'bold', color: Colors.navyDark },
  storeAdminActions: { flexDirection: 'row', justifyContent: 'flex-start', marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  actionToggleBtn: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderRadius: Radius.sm, marginRight: Spacing.sm },
  approveToggleBtn: { backgroundColor: '#E6FFFA', borderWidth: 1, borderColor: '#319795' },
  suspendToggleBtn: { backgroundColor: Colors.dangerBg, borderWidth: 1, borderColor: Colors.danger },
  actionDeleteBtn: { backgroundColor: Colors.border, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border },
  actionBtnText: { fontSize: 11, fontWeight: 'bold', fontFamily: 'Tajawal', color: Colors.textSecondary },

  // كروت الرقابة المالية لفرسان التوصيل
  driverControlCard: { backgroundColor: Colors.bgCard, marginHorizontal: Spacing.base, marginBottom: Spacing.md, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, ...Shadow.card },
  driverHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: Spacing.sm },
  driverName: { fontSize: 14, fontWeight: 'bold', color: Colors.navyDark, fontFamily: 'Cairo' },
  statusBadge: { backgroundColor: Colors.successBg, color: Colors.success, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm, borderRadius: Radius.lg, fontSize: 11, fontWeight: 'bold', fontFamily: 'Cairo', overflow: 'hidden' },
  statusSuspended: { backgroundColor: Colors.dangerBg, color: Colors.danger },
  driverTripsCount: { fontSize: 13, color: Colors.textSecondary, textAlign: 'right', marginTop: Spacing.sm, fontFamily: 'Tajawal' },
  driverDebt: { fontSize: 13, color: Colors.primary, fontWeight: 'bold', textAlign: 'right', marginTop: 2, fontFamily: 'Tajawal' },
  resetCounterButton: { backgroundColor: Colors.success, paddingVertical: Spacing.md, borderRadius: Radius.sm, alignItems: 'center', marginTop: Spacing.md, ...Shadow.medium },
  resetCounterButtonText: { color: Colors.white, fontSize: 13, fontWeight: 'bold', fontFamily: 'Cairo' },
  noDataText: { textAlign: 'center', color: Colors.textMuted, marginVertical: Spacing.base, fontFamily: 'Tajawal', fontSize: 12 },
});
