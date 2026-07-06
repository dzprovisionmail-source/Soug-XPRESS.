import React from 'react';
import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function TabsLayout() {
  // Single source of truth: profiles.role from Supabase DB via AuthContext.
  // Do NOT read from user.user_metadata.role — that field is never written by this app.
  const { userProfile } = useAuth();
  const role = userProfile?.role ?? null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#F26522',
        tabBarInactiveTintColor: '#888888',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
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
          // Only visible to merchants (profiles.role = 'merchant')
          href: role === 'merchant' ? undefined : null,
          title: 'التاجر',
          tabBarLabel: ({ color }) => <Text style={[styles.labelText, { color }]}>متجري</Text>,
          tabBarIcon: () => <Text style={styles.iconText}>🏪</Text>,
        }}
      />

      <Tabs.Screen
        name="delivery"
        options={{
          // Only visible to delivery drivers (profiles.role = 'delivery')
          href: role === 'delivery' ? undefined : null,
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
