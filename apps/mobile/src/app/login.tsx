import { LogBox } from 'react-native';
try {
  const KA = require('expo-keep-awake');
  if (KA) { KA.activateKeepAwakeAsync = () => Promise.resolve(); KA.deactivateKeepAwakeAsync = () => Promise.resolve(); }
} catch (e) {}
LogBox.ignoreLogs(['Unable to activate keep awake']);
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [userId, setUserId] = useState('');

  const handleLogin = async () => {
    if (!phone || !password) return Alert.alert('تنبيه', 'الرجاء ملء الحقول');
    let fmtPhone = phone.trim().replace(/\s+/g, '');
    if (fmtPhone.startsWith('0')) fmtPhone = '+213' + fmtPhone.substring(1);
    else if (!fmtPhone.startsWith('+')) fmtPhone = '+213' + fmtPhone;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ phone: fmtPhone, password });
      if (error) throw error;
      router.push('/');
    } catch (err: any) { Alert.alert('خطأ', err.message); }
    finally { setLoading(false); }
  };
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const redirectTo = Linking.createURL('/(auth)/callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success' && result.url) {
          const getParam = (url: string, param: string) => {
            const match = url.match(new RegExp(`[#?&]${param}=([^&#]*)`));
            return match ? match[1] : null;
          };
          const acc = getParam(result.url, 'access_token');
          const ref = getParam(result.url, 'refresh_token');

          if (acc && ref) {
            const { data: ss, error: se } = await supabase.auth.setSession({ access_token: acc, refresh_token: ref });
            if (se) throw se;
            if (ss?.user) {
              setUserId(ss.user.id);
              const { data: prof } = await supabase.from('profiles').select('role').eq('id', ss.user.id).single();
              if (prof && prof.role) router.push('/');
              else setShowRoleSelection(true);
            }
          }
        }
      }
    } catch (err: any) { Alert.alert('خطأ غوغل', err.message); }
    finally { setLoading(false); }
  };

  const handleRoleSelect = async (role: 'customer' | 'merchant' | 'delivery') => {
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').upsert({ id: userId, role, updated_at: new Date() });
      if (error) throw error;
      Alert.alert('🎉 نجاح', 'تم حفظ نوع الحساب بنجاح!');
      router.push('/');
    } catch (err: any) { Alert.alert('خطأ', err.message); }
    finally { setLoading(false); }
  };
  if (showRoleSelection) {
    return (
      <View style={styles.roleContainer}>
        <Text style={styles.roleTitle}>مرحباً بك في سوق إكسبريس ⚡</Text>
        <Text style={styles.roleSubtitle}>الرجاء تحديد نوع الحساب لإكمال التسجيل وحفظ بياناتك:</Text>
        <TouchableOpacity style={[styles.roleButton, { backgroundColor: '#FF6B6B' }]} onPress={() => handleRoleSelect('customer')}>
          <Text style={styles.roleButtonText}>🙋‍♂️ أنا زبون (متسوق)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.roleButton, { backgroundColor: '#4DABF7' }]} onPress={() => handleRoleSelect('merchant')}>
          <Text style={styles.roleButtonText}>🏪 أنا تاجر (صاحب محل)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.roleButton, { backgroundColor: '#51CF66' }]} onPress={() => handleRoleSelect('delivery')}>
          <Text style={styles.roleButtonText}>🛵 أنا موصل (سائق توصيل)</Text>
        </TouchableOpacity>
        {loading && <ActivityIndicator size="large" color="#3182ce" style={{ marginTop: 20 }} />}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>سوق إكسبريس ⚡</Text>
      <Text style={styles.subtitle}>مرحباً بك في تطبيق سوق إكسبريس</Text>
      <TextInput style={styles.input} placeholder="رقم الهاتف" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>تسجيل الدخول</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={handleGoogleLogin} style={styles.googleButton} disabled={loading}>
        {loading ? <ActivityIndicator color="#1A202C" /> : <Text style={styles.googleButtonText}>الدخول السريع بواسطة Google 🚀</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f7fafc' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a202c', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#718096', marginBottom: 30, textAlign: 'center' },
  input: { width: '100%', height: 50, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 15, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 15, textAlign: 'right' },
  button: { width: '100%', height: 50, backgroundColor: '#3182ce', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  googleButton: { backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 20, width: '100%' },
  googleButtonText: { color: '#1A202C', fontSize: 16, fontWeight: 'bold' },
  roleContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 25, backgroundColor: '#f8f9fa' },
  roleTitle: { fontSize: 26, fontWeight: 'bold', color: '#212529', marginBottom: 15, textAlign: 'center' },
  roleSubtitle: { fontSize: 16, color: '#495057', marginBottom: 35, textAlign: 'center' },
  roleButton: { width: '100%', paddingVertical: 18, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 3 },
  roleButtonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' }
});
