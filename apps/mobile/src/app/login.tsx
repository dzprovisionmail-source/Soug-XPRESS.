import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { supabase } from './supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // حقول الدخول
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false); // التبديل بين دخول الطاقم والزبائن

  const handleLogin = async () => {
    if (!phoneOrEmail || !password) {
      Alert.alert('تنبيه', 'الرجاء إدخال بيانات الاعتماد أولاً');
      return;
    }

    setLoading(true);
    try {
      let authResult;

      if (isAdminMode) {
        // 👑 دخول المدير العام الآمن عبر الإيميل المشفر
        authResult = await supabase.auth.signInWithPassword({
          email: phoneOrEmail,
          password: password,
        });
      } else {
        // 👤 دخول الزبائن، التجار، والفرسان عبر رقم الهاتف
        authResult = await supabase.auth.signInWithPassword({
          phone: phoneOrEmail,
          password: password,
        });
      }

      if (authResult.error) throw authResult.error;

      const userId = authResult.data.user?.id;

      // إذا كان الدخول للمدير، نوجهه فوراً للوحة التحكم الإدارية
      if (isAdminMode) {
        Alert.alert('مرحباً بالقائد 👑', 'تم التحقق من الهوية الرقمية للمدير العام بنجاح.');
        router.push('/admin');
        return;
      }

      // 🔍 فحص رتبة وحالة الحساب من الجداول السحابية بالتوافق مع إعدادات الأمان
      // 1. فحص هل هو موصل؟
      const { data: driverData } = await supabase.from('drivers').select('is_suspended, name').eq('id', userId).single();
      if (driverData) {
        if (driverData.is_suspended) {
          Alert.alert('حساب معلق ⏳', `مرحباً يا ${driverData.name}. حساب الموزع الخاص بك قيد المراجعة حالياً، ستتصل بك الإدارة لتفعيل حسابك ميدانياً.`);
          await supabase.auth.signOut(); // طرده أمنياً حتى توافق عليه الإدارة
          return;
        }
        router.push('/delivery'); // دخول لوحة الموصل النشط
        return;
      }

      // 2. فحص هل هو تاجر؟ (تم تصحيح وتأمين منطق الفحص هنا ليتوافق مع آلية الاعتماد الإداري الجديد)
      const { data: storeData } = await supabase.from('stores').select('id, name, is_approved').eq('id', userId).single();
      if (storeData) {
        // فحص حالة الاعتماد (إذا لم يكن معتمداً بعد من طرفك يطرد أمنياً لمنع الاختراق)
        if (storeData.is_approved === false || storeData.is_approved === null) {
          Alert.alert('مراجعة إدارية 🏪', `محل (${storeData.name}) مسجل لدينا بنجاح. يرجى انتظار تفعيل الحساب وتدقيقه من طرف المدير العام للبدء في استقبال الطلبات.`);
          await supabase.auth.signOut();
          return;
        }
        router.push('/merchant'); // دخول لوحة التاجر المعتمد
        return;
      }

      // 3. إذا لم يكن موصل أو تاجر فهو زبون عادي يوجه للشاشة الرئيسية فوراً
      router.push('/');

    } catch (error: any) {
      Alert.alert('فشل تسجيل الدخول', 'تأكد من صحة البيانات المسجلة وحاول مجدداً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>سوق إكسبريس ⚡</Text>
      <Text style={styles.subtitle}>بوابتك الآمنة للتسوق والتوصيل في عين الصفراء</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {isAdminMode ? '👑 تسجيل دخول الإدارة العامة' : '🔐 تسجيل دخول المستخدمين'}
        </Text>

        <Text style={styles.inputLabel}>
          {isAdminMode ? 'البريد الإلكتروني الإداري:' : 'رقم هاتف الحساب:'}
        </Text>
        <TextInput 
          style={styles.input} 
          placeholder={isAdminMode ? 'admin@sougxpress.com' : '06xxxxxxxx / 05xxxxxxxx'} 
          keyboardType={isAdminMode ? 'email-address' : 'phone-pad'}
          autoCapitalize="none"
          value={phoneOrEmail} 
          onChangeText={setPhoneOrEmail} 
        />

        <Text style={styles.inputLabel}>كلمة المرور السرية:</Text>
        <TextInput 
          style={styles.input} 
          placeholder="••••••••••••" 
          secureTextEntry={true} 
          value={password} 
          onChangeText={setPassword} 
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>تسجيل الدخول الآمن 🚀</Text>}
        </TouchableOpacity>

        {/* زر سري ذكي للتبديل بين وضع المدير والمستخدم العادي */}
        <TouchableOpacity style={styles.toggleModeBtn} onPress={() => { setIsAdminMode(!isAdminMode); setPhoneOrEmail(''); }}>
          <Text style={styles.toggleModeText}>
            {isAdminMode ? '👤 الدخول كزبون / تاجر / موصل' : '🛠️ الدخول الخاص بطاقم الإدارة'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footerRow}>
        <Link href="/register" asChild>
          <TouchableOpacity><Text style={styles.registerLink}>سجل حسابك الآن من هنا</Text></TouchableOpacity>
        </Link>
        <Text style={styles.footerText}>ليس لديك حساب بعد؟ </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFD', justifyContent: 'center', alignItems: 'center', padding: 20 },
  logoText: { fontSize: 26, fontWeight: 'bold', color: '#111A44', fontFamily: 'Cairo' },
  subtitle: { fontSize: 11, color: '#718096', fontFamily: 'Tajawal', marginTop: 4, marginBottom: 30, textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', width: '100%', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#111A44', fontFamily: 'Cairo', marginBottom: 15, textAlign: 'center' },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#4A5568', textAlign: 'right', marginBottom: 6, fontFamily: 'Cairo', marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8, padding: 12, textAlign: 'right', fontSize: 14, fontFamily: 'Tajawal', backgroundColor: '#F8FAFC', marginBottom: 10 },
  primaryBtn: { backgroundColor: '#F26522', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  btnText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', fontFamily: 'Cairo' },
  toggleModeBtn: { marginTop: 15, paddingVertical: 8, alignItems: 'center' },
  toggleModeText: { color: '#111A44', fontSize: 11, fontWeight: 'bold', fontFamily: 'Tajawal', textDecorationLine: 'underline' },
  footerRow: { flexDirection: 'row-reverse', marginTop: 25, alignItems: 'center' },
  footerText: { fontSize: 12, color: '#4A5568', fontFamily: 'Tajawal' },
  registerLink: { fontSize: 12, color: '#F26522', fontWeight: 'bold', fontFamily: 'Cairo', textDecorationLine: 'underline' }
});
        
