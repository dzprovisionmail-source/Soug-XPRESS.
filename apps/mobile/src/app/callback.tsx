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
