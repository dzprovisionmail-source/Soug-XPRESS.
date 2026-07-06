import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View, LogBox } from 'react-native';
import { useFonts, Cairo_400Regular } from '@expo-google-fonts/cairo';
import { Tajawal_400Regular } from '@expo-google-fonts/tajawal';
import { AuthProvider, useAuth } from '../context/AuthContext';

LogBox.ignoreLogs(['Unable to activate keep awake']);

function RootLayoutNav() {
  const { session, userProfile, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Cast to string[] — Expo Router's tuple type is overly strict at compile time
    // but at runtime segments is always a plain string array (may be empty at root '/').
    const segs = segments as string[];

    const inAuthGroup = segs[0] === 'login';
    const inRegisterPage = segs[0] === 'register';
    // '/' (index.tsx) is the public onboarding + commercial feed.
    // Unauthenticated users are allowed there without being redirected to login.
    const atPublicRoot = segs.length === 0;

    if (!session) {
      if (!inAuthGroup && !atPublicRoot) router.replace('/login');
      return;
    }

    // Authenticated user — check profile completeness
    const hasNoRole = !userProfile?.role;
    const isProfileIncomplete =
      !userProfile?.full_name || !userProfile?.phone || !userProfile?.zone;

    if (hasNoRole || isProfileIncomplete) {
      if (!inRegisterPage) router.replace('/register');
      return;
    }

    // Role-based routing — single source of truth: profiles.role
    if (userProfile.role === 'merchant') {
      if (segs[0] !== '(tabs)' || segs[1] !== 'merchant')
        router.replace('/(tabs)/merchant');
    } else if (userProfile.role === 'delivery') {
      if (segs[0] !== '(tabs)' || segs[1] !== 'delivery')
        router.replace('/(tabs)/delivery');
    } else if (userProfile.role === 'admin') {
      // Admins navigate freely — no forced redirect
    } else {
      // Default: customer
      if (segs[0] !== '(tabs)' || segs[1] !== 'home')
        router.replace('/(tabs)/home');
    }
  }, [session, userProfile, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC' }}>
        <ActivityIndicator size="large" color="#F26522" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="callback" />
      {/* admin — only visible to profiles.role = 'admin' (guarded inside admin.tsx) */}
      <Stack.Screen name="admin" />
      {/* Orphaned full screens kept for Phase 2 decision (not yet wired into tabs) */}
      <Stack.Screen name="merchant" />
      <Stack.Screen name="delivery" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  // Load Cairo and Tajawal via @expo-google-fonts so fontFamily references work everywhere
  const [fontsLoaded] = useFonts({
    Cairo: Cairo_400Regular,
    Tajawal: Tajawal_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC' }}>
        <ActivityIndicator size="large" color="#F26522" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
