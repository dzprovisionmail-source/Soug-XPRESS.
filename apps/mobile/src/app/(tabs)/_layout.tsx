import React from 'react';
import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors, Shadow } from '../../constants/theme';

export default function TabsLayout() {
  // Single source of truth: profiles.role from Supabase DB via AuthContext.
  // Do NOT read from user.user_metadata.role — that field is never written by this app.
  const { userProfile } = useAuth();
  const role = userProfile?.role ?? null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.white,
          // Shadow replaces the flat border for a more elevated look
          borderTopWidth: 0,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
          ...Shadow.tabBar,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'الرئيسية',
          tabBarLabel: ({ color }) => <Text style={[styles.labelText, { color }]}>السوق</Text>,
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.iconText, focused && styles.iconActive]}>🏠</Text>
          ),
        }}
      />

      <Tabs.Screen
        name="merchant"
        options={{
          // Only visible to merchants (profiles.role = 'merchant')
          href: role === 'merchant' ? undefined : null,
          title: 'التاجر',
          tabBarLabel: ({ color }) => <Text style={[styles.labelText, { color }]}>متجري</Text>,
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.iconText, focused && styles.iconActive]}>🏪</Text>
          ),
        }}
      />

      <Tabs.Screen
        name="delivery"
        options={{
          // Only visible to delivery drivers (profiles.role = 'delivery')
          href: role === 'delivery' ? undefined : null,
          title: 'الموصل',
          tabBarLabel: ({ color }) => <Text style={[styles.labelText, { color }]}>التوصيل</Text>,
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.iconText, focused && styles.iconActive]}>🛵</Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  labelText: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
    marginTop: 1,
  },
  iconText: {
    fontSize: 22,
    opacity: 0.7,
  },
  iconActive: {
    opacity: 1,
    transform: [{ scale: 1.08 }],
  },
});
