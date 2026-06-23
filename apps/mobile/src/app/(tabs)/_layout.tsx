import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';

export default function TabsLayout() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const userRole = user.user_metadata?.role || 'client';
          setRole(userRole);
        } else {
          setRole('client');
        }
      } catch (err) {
        setRole('client');
      }
    }
    fetchUserRole();
  }, []);
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
        href: role === 'merchant' ? undefined : null,
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
