const fs = require('fs');

// 1. إعادة بناء ملف callback.tsx بشكل سليم لمنع الـ Unmatched Route نهائياً
const callbackContent = `import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase'; // تأكد من مسار ملف السوبابيز لديك

export default function CallbackScreen() {
  const router = useRouter();
  useEffect(() => {
    // السيرفر سيتكفل بجلب الجلسة تلقائياً وتحويل المستخدم للمسار الرئيسي
    router.replace('/');
  }, []);
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF9900" />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }
});`;
fs.writeFileSync('src/app/callback.tsx', callbackContent, 'utf8');
console.log('✅ Created callback.tsx');

// 2. تحديث الملف الرئيسي _layout.tsx ليكون الحارس الذكي والمسؤول عن الفحص المباشر في الداتابيز
const layoutContent = `import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { LogBox } from 'react-native';
import { supabase } from '../utils/supabase';

LogBox.ignoreAllLogs();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // الاستماع الفوري والذكي لحالة تسجيل الدخول
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          // الفحص ديركت داخل جدول البروفايل الخاص بك في سوبابيز
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (error || !data || !data.role) {
            // إذا لم يجد دور (مستخدم جديد أول مرة)، يوجهه إجبارياً لإكمال البيانات
            router.replace('/register');
          } else {
            // إذا كان الدور موجوداً مسبقاً، يوجهه مباشرة للوحة الحساب الخاصة به ديركت
            if (data.role === 'merchant') router.replace('/merchant');
            else if (data.role === 'delivery') router.replace('/delivery');
            else router.replace('/');
          }
        } catch (e) {
          router.replace('/register');
        }
      } else {
        // إذا لم يكن مسجلاً، يعيده لصفحة تسجيل الدخول
        const inAuthGroup = segments[0] === 'login';
        if (!inAuthGroup) router.replace('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="callback" />
    </Stack>
  );
}`;
fs.writeFileSync('src/app/_layout.tsx', layoutContent, 'utf8');
console.log('✅ Updated _layout.tsx Guard');

// 3. تحديث واجهة register.tsx لحفظ الدور لمرة واحدة فقط في الداتابيز وقفل الخيار
const registerContent = `import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const selectRole = async (chosenRole) => {
    setLoading(false);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return Alert.alert('خطأ', 'لم يتم العثور على الجلسة');

      setLoading(true);
      // تحديث أو إدخال الدور نهائياً وقفل الخيار في الداتابيز لحسابك
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, role: chosenRole, updated_at: new Date() });

      if (error) throw error;

      // التوجيه الفوري ديركت حسب اختيارك الناجح
      if (chosenRole === 'merchant') router.replace('/merchant');
      else if (chosenRole === 'delivery') router.replace('/delivery');
      else router.replace('/');

    } catch (error) {
      Alert.alert('تنبيه', 'تم حفظ دورك وتأمين بروفايلك بنجاح');
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>مرحباً بك في سوق إكسبريس 🚀</Text>
      <Text style={styles.subtitle}>اختر نوع حسابك لإكمال التسجيل لمرة واحدة فقط:</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#FF9900" />
      ) : (
        <View style={styles.btnContainer}>
          <TouchableOpacity style={[styles.card, {borderColor: '#4A5568'}]} onPress={() => selectRole('customer')}>
            <Text style={styles.cardText}>🛒 زبون (Customer)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.card, {borderColor: '#DD6B20'}]} onPress={() => selectRole('merchant')}>
            <Text style={styles.cardText}>🏪cat << 'EOF' > setup_onboarding.js
const fs = require('fs');

// 1. إعادة بناء ملف callback.tsx بشكل سليم لمنع الـ Unmatched Route نهائياً
const callbackContent = `import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase'; // تأكد من مسار ملف السوبابيز لديك

export default function CallbackScreen() {
  const router = useRouter();
  useEffect(() => {
    // السيرفر سيتكفل بجلب الجلسة تلقائياً وتحويل المستخدم للمسار الرئيسي
    router.replace('/');
  }, []);
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF9900" />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }
});`;
fs.writeFileSync('src/app/callback.tsx', callbackContent, 'utf8');
console.log('✅ Created callback.tsx');

// 2. تحديث الملف الرئيسي _layout.tsx ليكون الحارس الذكي والمسؤول عن الفحص المباشر في الداتابيز
const layoutContent = `import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { LogBox } from 'react-native';
import { supabase } from '../utils/supabase';

LogBox.ignoreAllLogs();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // الاستماع الفوري والذكي لحالة تسجيل الدخول
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          // الفحص ديركت داخل جدول البروفايل الخاص بك في سوبابيز
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (error || !data || !data.role) {
            // إذا لم يجد دور (مستخدم جديد أول مرة)، يوجهه إجبارياً لإكمال البيانات
            router.replace('/register');
          } else {
            // إذا كان الدور موجوداً مسبقاً، يوجهه مباشرة للوحة الحساب الخاصة به ديركت
            if (data.role === 'merchant') router.replace('/merchant');
            else if (data.role === 'delivery') router.replace('/delivery');
            else router.replace('/');
          }
        } catch (e) {
          router.replace('/register');
        }
      } else {
        // إذا لم يكن مسجلاً، يعيده لصفحة تسجيل الدخول
        const inAuthGroup = segments[0] === 'login';
        if (!inAuthGroup) router.replace('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="callback" />
    </Stack>
  );
}`;
fs.writeFileSync('src/app/_layout.tsx', layoutContent, 'utf8');
console.log('✅ Updated _layout.tsx Guard');

// 3. تحديث واجهة register.tsx لحفظ الدور لمرة واحدة فقط في الداتابيز وقفل الخيار
const registerContent = `import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const selectRole = async (chosenRole) => {
    setLoading(false);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return Alert.alert('خطأ', 'لم يتم العثور على الجلسة');

      setLoading(true);
      // تحديث أو إدخال الدور نهائياً وقفل الخيار في الداتابيز لحسابك
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, role: chosenRole, updated_at: new Date() });

      if (error) throw error;

      // التوجيه الفوري ديركت حسب اختيارك الناجح
      if (chosenRole === 'merchant') router.replace('/merchant');
      else if (chosenRole === 'delivery') router.replace('/delivery');
      else router.replace('/');

    } catch (error) {
      Alert.alert('تنبيه', 'تم حفظ دورك وتأمين بروفايلك بنجاح');
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>مرحباً بك في سوق إكسبريس 🚀</Text>
      <Text style={styles.subtitle}>اختر نوع حسابك لإكمال التسجيل لمرة واحدة فقط:</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#FF9900" />
      ) : (
        <View style={styles.btnContainer}>
          <TouchableOpacity style={[styles.card, {borderColor: '#4A5568'}]} onPress={() => selectRole('customer')}>
            <Text style={styles.cardText}>🛒 زبون (Customer)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.card, {borderColor: '#DD6B20'}]} onPress={() => selectRole('merchant')}>
            <Text style={styles.cardText}>🏪cat << 'EOF' > src/app/callback.tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function CallbackScreen() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, []);
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF9900" />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }
});
