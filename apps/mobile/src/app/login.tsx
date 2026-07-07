// All imports must come first — executable statements below
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, LogBox, Image, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Colors, Spacing, Radius, Shadow } from '../constants/theme';

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

const logoAsset = require('../../assets/images/logo.png');

type Mode = 'login' | 'signup';

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading]   = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode]         = useState<Mode>('login');

  /** Normalize Algerian phone numbers to E.164 (+213xxxxxxxx) */
  const normalizePhone = (raw: string) => {
    let p = raw.trim().replace(/\s+/g, '');
    if (p.startsWith('0')) p = '+213' + p.substring(1);
    else if (!p.startsWith('+')) p = '+213' + p;
    return p;
  };

  const handleLogin = async () => {
    if (!identifier || !password) return Alert.alert('تنبيه', 'الرجاء ملء الحقول');
    setLoading(true);
    try {
      let error;
      if (identifier.includes('@')) {
        // Email login — used by admin and any email-registered user
        ({ error } = await supabase.auth.signInWithPassword({
          email: identifier.trim(),
          password,
        }));
      } else {
        // Phone login — normalize to E.164 then authenticate
        const fmtPhone = normalizePhone(identifier);
        ({ error } = await supabase.auth.signInWithPassword({
          phone: fmtPhone,
          password,
        }));
      }
      if (error) throw error;
      // Auth guard in _layout.tsx handles post-login routing based on profiles.role
      router.push('/');
    } catch (err: unknown) {
      Alert.alert('خطأ', err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!identifier || !password) return Alert.alert('تنبيه', 'الرجاء ملء الحقول');
    if (password.length < 6) return Alert.alert('تنبيه', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    // Sign-up is phone-only for normal users; admin accounts are created server-side.
    const fmtPhone = normalizePhone(identifier);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ phone: fmtPhone, password });
      if (error) throw error;
      // After sign-up, auth guard routes to /register to complete the profile
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

      if (Platform.OS === 'web') {
        // On web: use a proper HTTPS redirect URL — the browser will navigate
        // away to Google then land on /callback where tokens are parsed.
        const origin     = typeof window !== 'undefined' ? window.location.origin : '';
        const redirectTo = `${origin}/callback`;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo },
          // skipBrowserRedirect defaults to false — Supabase redirects the tab automatically
        });
        if (error) throw error;
        // Page will navigate away; setLoading cleanup handled by unmount
        return;
      }

      // Native (iOS / Android): open in-app browser, intercept the exp:// deep link.
      const redirectTo = Linking.createURL('/callback');
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

  const isSignUp = mode === 'signup';

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo */}
      <Image source={logoAsset} style={styles.logo} resizeMode="contain" />

      {/* Heading */}
      <Text style={styles.title}>سوق إكسبريس</Text>
      <Text style={styles.subtitle}>
        {isSignUp ? 'أنشئ حساباً جديداً للبدء' : 'مرحباً بك — أدخل بياناتك للمتابعة'}
      </Text>

      {/* Form card */}
      <View style={styles.card}>
        <Text style={styles.fieldLabel}>رقم الهاتف أو البريد الإلكتروني</Text>
        <TextInput
          style={styles.input}
          placeholder="0668265490 أو admin@example.com"
          value={identifier}
          onChangeText={setIdentifier}
          keyboardType="default"
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.fieldLabel}>كلمة المرور</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={Colors.textMuted}
          onSubmitEditing={isSignUp ? handleSignUp : handleLogin}
          returnKeyType="done"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={isSignUp ? handleSignUp : handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.buttonText}>
                {isSignUp ? 'إنشاء حساب' : 'تسجيل الدخول'}
              </Text>}
        </TouchableOpacity>
      </View>

      {/* Mode toggle */}
      <TouchableOpacity
        style={styles.toggleRow}
        onPress={() => setMode(isSignUp ? 'login' : 'signup')}
        disabled={loading}
      >
        <Text style={styles.toggleText}>
          {isSignUp
            ? 'لديك حساب بالفعل؟ '
            : 'ليس لديك حساب؟ '}
          <Text style={styles.toggleLink}>
            {isSignUp ? 'تسجيل الدخول' : 'أنشئ حساباً'}
          </Text>
        </Text>
      </TouchableOpacity>

      {/* Google OAuth */}
      <TouchableOpacity onPress={handleGoogleLogin} style={styles.googleButton} disabled={loading}>
        {loading
          ? <ActivityIndicator color={Colors.textPrimary} />
          : <Text style={styles.googleButtonText}>الدخول السريع بواسطة Google 🚀</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
    backgroundColor: Colors.bgScreen,
  },
  logo: {
    width: 110,
    height: 110,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.navyDark,
    fontFamily: 'Cairo',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: 'Tajawal',
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    fontFamily: 'Cairo',
    textAlign: 'right',
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: Colors.bgSubtle,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    textAlign: 'right',
    fontFamily: 'Tajawal',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadow.primaryBtn,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
  toggleRow: {
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  toggleText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: 'Tajawal',
    textAlign: 'center',
  },
  toggleLink: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
  googleButton: {
    backgroundColor: Colors.bgCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    ...Shadow.card,
  },
  googleButtonText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
});
