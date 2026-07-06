// All imports must come first — executable statements below
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, LogBox,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Suppress expo-keep-awake warning on web (package not included in this project)
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const KA = require('expo-keep-awake');
  if (KA) {
    KA.activateKeepAwakeAsync = () => Promise.resolve();
    KA.deactivateKeepAwakeAsync = () => Promise.resolve();
  }
} catch (_e) {}

LogBox.ignoreLogs(['Unable to activate keep awake']);

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!phone || !password) return Alert.alert('تنبيه', 'الرجاء ملء الحقول');
    let fmtPhone = phone.trim().replace(/\s+/g, '');
    if (fmtPhone.startsWith('0')) fmtPhone = '+213' + fmtPhone.substring(1);
    else if (!fmtPhone.startsWith('+')) fmtPhone = '+213' + fmtPhone;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ phone: fmtPhone, password });
      if (error) throw error;
      // Auth guard in _layout.tsx handles post-login routing based on profiles.role
      router.push('/');
    } catch (err: unknown) {
      Alert.alert('خطأ', err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const redirectTo = Linking.createURL('/callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success' && result.url) {
          // Extract tokens from the redirect URL
          const getParam = (url: string, param: string) => {
            const match = url.match(new RegExp(`[#?&]${param}=([^&#]*)`));
            return match ? match[1] : null;
          };
          const acc = getParam(result.url, 'access_token');
          const ref = getParam(result.url, 'refresh_token');

          if (acc && ref) {
            const { error: se } = await supabase.auth.setSession({ access_token: acc, refresh_token: ref });
            if (se) throw se;
            router.push('/');
          }
        }
      }
    } catch (err: unknown) {
      Alert.alert('خطأ غوغل', err instanceof Error ? err.message : 'حدث خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>سوق إكسبريس ⚡</Text>
      <Text style={styles.subtitle}>مرحباً بك في تطبيق سوق إكسبريس</Text>
      <TextInput
        style={styles.input}
        placeholder="رقم الهاتف"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="كلمة المرور"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>تسجيل الدخول</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={handleGoogleLogin} style={styles.googleButton} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#1A202C" />
          : <Text style={styles.googleButtonText}>الدخول السريع بواسطة Google 🚀</Text>}
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
});
