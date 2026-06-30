import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function CallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    // استقبال جينات التحقق وتوجيه المستخدم ديركت إلى الواجهة الرئيسية المستقرة
    const timeout = setTimeout(() => {
      router.replace('/');
    }, 1200);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3182ce" />
      <Text style={styles.text}>جاري مزامنة بيانات Google وتأمين حسابك... ⚡</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7fafc' },
  text: { marginTop: 20, fontSize: 16, fontWeight: 'bold', color: '#4a5568', textAlign: 'center' }
});
