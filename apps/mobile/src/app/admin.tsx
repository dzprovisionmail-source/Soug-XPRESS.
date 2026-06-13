import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';

interface Store {
  id: string;
  name: string;
  category: string;
  zone: string;
}

interface Driver {
  id: string;
  name: string;
  trips: number;
  status: string;
}

export default function AdminDashboard() {
  // بيانات افتراضية للمحلات التي ستضيفها بنفسك لتغذية المنصة مسبقاً
  const [stores, setStores] = useState<Store[]>([
    { id: '1', name: 'سوبرماركت الهناء', category: 'سوبر ماركت', zone: 'حي الضلعة' },
    { id: '2', name: 'مطعم ومشاوي القصر', category: 'مطاعم', zone: 'قصر البلاد' },
  ]);

  // مراقبة عدادات فرسان التوصيل وتصفيرها يدوياً بعد استلام 1000 دج عبر بريدي موب
  const [drivers, setDrivers] = useState<Driver[]>([
    { id: 'M-01', name: 'خالد دراجي', trips: 50, status: '🔴 معطل لوجوب الدفع' },
    { id: 'M-02', name: 'ياسين بلحاج', trips: 12, status: '🟢 نشط' },
  ]);

  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCategory, setNewStoreCategory] = useState('سوبر ماركت');
  const [newStoreZone, setNewStoreZone] = useState('');

  // تابع الإضافة الفورية للمحلات التجارية داخل عين الصفراء
  const handleAddStoreDirectly = () => {
    if (!newStoreName || !newStoreZone) {
      Alert.alert('تنبيه', 'الرجاء ملء اسم المحل والحي أولاً');
      return;
    }
    const newStore: Store = {
      id: Math.random().toString(),
      name: newStoreName,
      category: newStoreCategory,
      zone: newStoreZone,
    };
    setStores([newStore, ...stores]);
    setNewStoreName('');
    setNewStoreZone('');
    Alert.alert('نجاح', `تم إدراج ${newStoreName} في التطبيق بنجاح وهو متاح للزبائن الآن!`);
  };

  // تصفير عداد الموصل وتفعيل حسابه فور تأكدك من وصول الأموال لحسابك بريدي موب
  const handleResetDriverCounter = (id: string, name: string) => {
    Alert.alert(
      'تأكيد استلام الدفع',
      `هل تأكدت من وصول مبلغ 1000 د.ج من الموزع (${name}) إلى حساب بريدي موب الخاص بك لتصفير عداده؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'نعم، تم استلام الأموال', 
          onPress: () => {
            setDrivers(drivers.map(d => d.id === id ? { ...d, trips: 0, status: '🟢 نشط (دورة جديدة)' } : d));
            Alert.alert('تم التفعيل', `تم تصفير عداد الموزع ${name} وفتح حسابه فوراً.`);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>لوحة التحكم العليا للمدير العام 👑</Text>
        <Text style={styles.headerSubtitle}>إدارة منصة سوق عين الصفراء | DZ Pro Vision</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* قسم تغذية السوق مسبقاً */}
        <Text style={styles.sectionTitle}>⚡ إضافة محل فوراً (تغذية السوق مسبقاً)</Text>
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
            <Text style={styles.insertButtonText}>🚀 إدراج المحل وتفعيله حيّاً في التطبيق</Text>
          </TouchableOpacity>
        </View>

        {/* استعراض المحلات المضافة للرقابة */}
        <Text style={styles.sectionTitle}>🛒 المحلات النشطة حالياً بالتطبيق ({stores.length})</Text>
        {stores.map(store => (
          <View key={store.id} style={styles.dataRowCard}>
            <Text style={styles.dataRowText}><Text style={styles.boldText}>{store.name}</Text> ({store.category})</Text>
            <Text style={styles.dataRowSubtext}>الموقع: {store.zone} | حالة العرض: 🟢 معروض للزبائن</Text>
          </View>
        ))}

        {/* التحكم بالموزعين وإدارة ديون بريدي موب */}
        <Text style={styles.sectionTitle}>💳 رقابة الموزعين وتأكيد دفع الـ 1000 د.ج</Text>
        {drivers.map(driver => (
          <View key={driver.id} style={styles.driverControlCard}>
            <View style={styles.driverHeader}>
              <Text style={styles.driverName}>{driver.name} ({driver.id})</Text>
              <Text style={styles.driverStatusText}>{driver.status}</Text>
            </View>
            <Text style={styles.driverTripsCount}>العداد الحالي: {driver.trips} / 50 توصيلة</Text>
            {driver.trips >= 50 && (
              <TouchableOpacity style={styles.resetCounterButton} onPress={() => handleResetDriverCounter(driver.id, driver.name)}>
                <Text style={styles.resetCounterButtonText}>✅ تأكيد استلام 1000 د.ج وتصفير العداد</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFD' },
  header: { backgroundColor: '#111A44', padding: 20, alignItems: 'flex-end', borderBottomWidth: 3, borderColor: '#F26522' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', fontFamily: 'Cairo' },
  headerSubtitle: { fontSize: 12, color: '#A0AEC0', fontFamily: 'Tajawal', marginTop: 4 },
  scrollContent: { paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111A44', marginHorizontal: 15, marginTop: 22, marginBottom: 10, textAlign: 'right', fontFamily: 'Cairo' },
  adminFormCard: { backgroundColor: '#FFFFFF', marginHorizontal: 15, borderRadius: 14, padding: 15, borderWidth: 1, borderColor: '#E2E8F0' },
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
  driverStatusText: { fontSize: 12, fontWeight: 'bold', fontFamily: 'Tajawal' },
  driverTripsCount: { fontSize: 13, color: '#4A5568', textAlign: 'right', marginTop: 8, fontFamily: 'Tajawal' },
  resetCounterButton: { backgroundColor: '#137333', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  resetCounterButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold', fontFamily: 'Cairo' }
});
