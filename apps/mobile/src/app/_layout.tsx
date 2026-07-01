import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View, LogBox } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';

LogBox.ignoreLogs(['Unable to activate keep awake']);

function RootLayoutNav() {
const { session, userProfile, isLoading } = useAuth();
const segments = useSegments();
const router = useRouter();

useEffect(() => {
if (isLoading) return;
const inAuthGroup = segments[0] === 'login';
const inRegisterPage = segments[0] === 'register';

if (!session) {
if (!inAuthGroup) router.replace('/login');
return;
}

const hasNoRole = !userProfile?.role;
const isProfileIncomplete = !userProfile?.full_name || !userProfile?.phone || !userProfile?.zone;

if (hasNoRole || isProfileIncomplete) {
if (!inRegisterPage) router.replace('/register');
return;
}

if (userProfile.role === 'merchant') {
if (segments[0] !== '(tabs)' || segments[1] !== 'merchant') router.replace('/(tabs)/merchant');
} else if (userProfile.role === 'delivery') {
if (segments[0] !== '(tabs)' || segments[1] !== 'delivery') router.replace('/(tabs)/delivery');
} else {
if (segments[0] !== '(tabs)' || segments[1] !== 'home') router.replace('/(tabs)/home');
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
<Stack.Screen name="login" />
<Stack.Screen name="register" />
<Stack.Screen name="(tabs)" />
</Stack>
);
}

export default function RootLayout() {
return (
<AuthProvider>
<RootLayoutNav />
</AuthProvider>
);
}
