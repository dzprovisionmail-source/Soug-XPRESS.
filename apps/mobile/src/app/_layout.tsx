import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Slot, useRouter } from 'expo-router';

export default function RootLayout() {
  const [currentView, setCurrentView] = useState<'customer' | 'merchant' | 'delivery'>('customer');
  const router = useRouter();

  const handleToggleView = (view: 'customer' | 'merchant' | 'delivery') => {
    setCurrentView(view);
    if (view === 'customer') router.push('/(tabs)/home');
    if (view === 'merchant') router.push('/(tabs)/merchant');
    if (view === 'delivery') router.push('/(tabs)/delivery');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* شريط المطور السريع - DEV BAR */}
      <View style={styles.devBar}>
        <TouchableOpacity 
          style={[styles.devButton, currentView === 'customer' && styles.activeButton]} 
          onPress={() => handleToggleView('customer')}
        >
          <Text style={styles.btnText}>🏠 زبون</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.devButton, currentView === 'merchant' && styles.activeButton]} 
          onPress={() => handleToggleView('merchant')}
        >
          <Text style={styles.btnText}>🏪 تاجر</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.devButton, currentView === 'delivery' && styles.activeButton]} 
          onPress={() => handleToggleView('delivery')}
        >
          <Text style={styles.btnText}>🛵 موصل</Text>
        </TouchableOpacity>
      </View>

      {/* عرض الشاشة الحالية */}
      <View style={styles.content}>
        <Slot />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  devBar: {
    flexDirection: 'row',
    backgroundColor: '#1B2A6B', // الأزرق الداكن الرسمي
    padding: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  devButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  activeButton: {
    backgroundColor: '#F26522', // البرتقالي الرسمي للزر النشط
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Tajawal',
  },
  content: {
    flex: 1,
  },
});
