import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { AINSEFRA_ZONES } from '../constants/zones';

export default function RegisterScreen() {
const { userProfile, refreshProfile, signOut } = useAuth();
const [loading, setLoading] = useState(false);
const [fullName, setFullName] = useState('');
const [phone, setPhone] = useState('');
const [selectedZone, setSelectedZone] = useState<string | null>(null);
const [showZoneModal, setShowZoneModal] = useState(false);

const handleSelectRole = async (chosenRole: 'customer' | 'merchant' | 'delivery') => {
setLoading(true);
try {
const { error } = await supabase.from('profiles').upsert({ id: userProfile?.id, role: chosenRole, updated_at: new Date() });
if (error) throw error;
await refreshProfile();
} catch (error: any) {
Alert.alert('خطأ في حفظ نوع الحساب', error.message);
} finally {
setLoading(false);
}
};

const handleSaveProfileDetails = async () => {
if (!fullName.trim() || !phone.trim() || !selectedZone) {
return Alert.alert('تنبيه', 'الرجاء ملء جميع الحقول واختيار الحي الحقيقي.');
}
setLoading(true);
try {
const { error } = await supabase.from('profiles').update({ full_name: fullName.trim(), phone: phone.trim(), zone: selectedZone, updated_at: new Date() }).eq('id', userProfile?.id);
if (error) throw error;
Alert.alert('🎉 نجاح', 'تم إكمال ملفك وتأمين حسابك بنجاح في سوق إكسبريس!');
await refreshProfile();
} catch (error: any) {
Alert.alert('خطأ في حفظ البيانات', error.message);
} finally {
setLoading(false);
}
};

if (loading) {
return (
<View style={styles.centered}>
<ActivityIndicator size="large" color="#F26522" />
<Text style={styles.loadingText}>جاري تأمين وحفظ البيانات سحابياً...</Text>
</View>
);
}

if (!userProfile?.role) {
return (
<View style={styles.container}>
<Text style={styles.title}>مرحباً بك في سوق إكسبريس 🚀</Text>
<Text style={styles.subtitle}>عين الصفراء - اختر نوع حسابك لإكمال البيانات لمرة واحدة:</Text>
<View style={styles.btnContainer}>
<TouchableOpacity style={styles.cardBtn} onPress={() => handleSelectRole('customer')}><Text style={styles.cardBtnText}>🛒 أنا زبون (متسوق)</Text></TouchableOpacity>
<TouchableOpacity style={styles.cardBtn} onPress={() => handleSelectRole('merchant')}><Text style={styles.cardBtnText}>🏪 أنا تاجر (صاحب محل)</Text></TouchableOpacity>
<TouchableOpacity style={styles.cardBtn} onPress={() => handleSelectRole('delivery')}><Text style={styles.cardBtnText}>🛵 أنا موصل (سائق توصيل)</Text></TouchableOpacity>
</View>
<TouchableOpacity onPress={signOut} style={styles.logoutBtn}><Text style={styles.logoutBtnText}>رجوع للخلف 🔙</Text></TouchableOpacity>
</View>
);
}

return (
<ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
<Text style={styles.title}>إكمال ملف الحساب 📝</Text>
<Text style={styles.subtitle}>الرجاء ملء بياناتك لمرة واحدة فقط لربطها بطلباتك وعروضك بمدينة عين الصفراء:</Text>
<TextInput style={styles.input} placeholder="الاسم الكامل أو اسم النشاط" value={fullName} onChangeText={setFullName} textAlign="right" />
<TextInput style={styles.input} placeholder="رقم الهاتف للتواصل النشط" value={phone} onChangeText={setPhone} keyboardType="phone-pad" textAlign="right" />
<TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowZoneModal(!showZoneModal)}>
<Text style={styles.dropdownBtnText}>{selectedZone ? `📍 حيك الحالي: ${selectedZone}` : '🗺️ اختر حي إقامتك في عين الصفراء'}</Text>
</TouchableOpacity>
{showZoneModal && (
<View style={styles.modalInlineContainer}>
{AINSEFRA_ZONES.map((zone) => (
<TouchableOpacity key={zone} style={[styles.zoneItem, selectedZone === zone && styles.zoneItemActive]} onPress={() => { setSelectedZone(zone); setShowZoneModal(false); }}>
<Text style={[styles.zoneItemText, selectedZone === zone && styles.zoneItemTextActive]}>{zone}</Text>
</TouchableOpacity>
))}
</View>
)}
<TouchableOpacity style={styles.submitBtn} onPress={handleSaveProfileDetails}><Text style={styles.submitBtnText}>حفظ المخطط والدخول ديركت 🚀</Text></TouchableOpacity>
<TouchableOpacity onPress={signOut} style={styles.logoutBtn}><Text style={styles.logoutBtnText}>تسجيل الخروج ❌</Text></TouchableOpacity>
</ScrollView>
);
}

const styles = StyleSheet.create({
container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC', padding: 20 },
scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 25, backgroundColor: '#F7FAFC' },
centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC' },
loadingText: { marginTop: 15, fontFamily: 'Tajawal', color: '#1B2A6B', fontWeight: 'bold', fontSize: 13 },
title: { fontSize: 22, fontWeight: 'bold', color: '#1B2A6B', textAlign: 'center', marginBottom: 10 },
subtitle: { fontSize: 13, color: '#718096', marginBottom: 35, textAlign: 'center', lineHeight: 22 },
btnContainer: { width: '100%', gap: 15 },
cardBtn: { width: '100%', padding: 18, borderWidth: 2, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', borderColor: '#CBD5E1' },
cardBtnText: { fontSize: 16, fontWeight: 'bold', color: '#2D3748' },
input: { width: '100%', height: 50, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 15, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 15, color: '#2D3748' },
dropdownBtn: { width: '100%', height: 50, backgroundColor: '#111A44', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
dropdownBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
modalInlineContainer: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 10, marginBottom: 15, flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
zoneItem: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' },
zoneItemActive: { backgroundColor: '#F26522', borderColor: '#F26522' },
zoneItemText: { fontSize: 12, color: '#4A5568', fontWeight: '500' },
zoneItemTextActive: { color: '#FFF', fontWeight: 'bold' },
submitBtn: { width: '100%', height: 52, backgroundColor: '#F26522', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
logoutBtn: { marginTop: 25, alignSelf: 'center' },
logoutBtnText: { color: '#718096', fontWeight: 'bold', fontSize: 13 }
});
