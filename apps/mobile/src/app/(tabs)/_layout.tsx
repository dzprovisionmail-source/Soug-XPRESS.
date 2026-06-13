import React from 'react';
import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#F26522', // البرتقالي الرسمي للتبويب النشط
        tabBarInactiveTintColor: '#888888',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false, // إخفاء الهيدر الافتراضي لأننا صممنا هيدر مخصص
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'الرئيسية',
          tabBarLabel: ({ color }) => <Text style={[styles.labelText, { color }]}>السوق</Text>,
          tabBarIcon: () => <Text style={styles.iconText}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="merchant"
        options={{
          title: 'التاجر',
          tabBarLabel: ({ color }) => <Text style={[styles.labelText, { color }]}>متجري</Text>,
          tabBarIcon: () => <Text style={styles.iconText}>🏪</Text>,
        }}
      />
      <Tabs.Screen
        name="delivery",
        options={{
          title: 'الموصل',
          tabBarLabel: ({ color }) => <Text style={[styles.labelText, { color }]}>التوصيل</Text>,
          tabBarIcon: () => <Text style={styles.iconText}>🛵</Text>,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  labelText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
  iconText: {
    fontSize: 20,
  },
});
