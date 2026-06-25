import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from './supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('تنبيه', 'الرجاء إدخال رقم الهاتف وكلمة المرور أولاً');
      return;
    }

    // 🌟 تحويل رقم الهاتف تلقائياً وصارماً إلى الصيغة الدولية E.164 المطابقة لقاعدة البيانات
    let formattedPhone = phone.trim().replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+213' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+213' + formattedPhone;
    }

    setLoading(true);
    try {
      // تسجيل الدخول باستخدام المعرّف الدولي المهيأ
      const { data, error } = await supabase.auth.signInWithPassword({
        phone: formattedPhone,
        password: password,
      });

      if (error) throw error;

      // عند النجاح، يتم توجيهه مباشرة للوحة الرئيسية للتطبيق
      Alert.alert('مرحباً بك مجدداً 🎉', 'تم تسجيل الدخول بنجاح آمن!');
      router.push('/');
      
    } catch (error: any) {
      Alert.alert('فشل تسجيل الدخول', 'بيانات الدخول غير صحيحة، يرجى التأكد من الرقم والرمز السري.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>سوق إكسبريس ⚡</Text>
      <Text style={styles.subtitle}>بوابتك الآمنة للتسوق والتوصيل في عين الصفراء</Text>

      <View style={styles.formCard}>
        <Text style={styles.cardHeader}>🔐 تسجيل دخول المستخدمين</Text>

        <Text style={styles.inputLabel}>رقم هاتف الحساب:</Text>
        <TextInput 
          style={styles.input} 
          placeholder="06xxxxxxxx أو 05xxxxxxxx" 
          keyboardType="phone-pad" 
          value={phone} 
          onChangeText={setPhone} 
        />

        <Text style={styles.inputLabel}>كلمة المرور السرية:</Text>
        <TextInput 
          style={styles.input} 
          placeholder="إدخال رمز المرور الخاص بك" 
          secureTextEntry={true} 
          value={password} 
          onChangeText={setPassword} 
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>🚀 تسجيل الدخول الآمن</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.adminLinkBtn} onPress={() => Alert.alert('قسم الإدارة', 'هذا القسم مخصص لطاقم التطوير والمراجعة الإدارية فقط.')}>
          <Text style={styles.adminLinkText}>🛠️ الدخول الخاص بطاقم الإدارة</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.registerLinkBtn} onPress={() => router.push('/register')}>
        <Text style={styles.registerLinkText}>سجل حسابك الآن من هنا؟</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#FAFBFD', alignItems: 'center', paddingBottom: 40, justifyContent: 'center', flexGrow: 1 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111A44', fontFamily: 'Cairo', marginTop: 10 },
  subtitle: { fontSize: 12, color: '#718096', fontFamily: 'Tajawal', marginTop: 4, marginBottom: 30, textAlign: 'center' },
  formCard: { backgroundColor: '#FFFFFF', width: '100%', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { fontSize: 16, fontWeight: 'bold', color: '#111A44', fontFamily: 'Cairo', textAlign: 'center', marginBottom: 15 },
  inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#4A5568', textAlign: 'right', marginBottom: 6, fontFamily: 'Cairo', marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8, padding: 12, textAlign: 'right', fontSize: 14, fontFamily: 'Tajawal', backgroundColor: '#F8FAFC', marginBottom: 10 },
  submitBtn: { backgroundColor: '#F26522', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', fontFamily: 'Cairo' },
  adminLinkBtn: { marginTop: 15, alignItems: 'center' },
  adminLinkText: { color: '#718096', fontSize: 12, fontFamily: 'Tajawal', textDecorationLine: 'underline' },
  registerLinkBtn: { marginTop: 25 },
  registerLinkText: { color: '#F26522', fontSize: 13, fontWeight: 'bold', fontFamily: 'Cairo', textDecorationLine: 'underline' }
});
