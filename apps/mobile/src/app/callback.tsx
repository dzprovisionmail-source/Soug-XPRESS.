import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../supabase';
import { Colors } from '../constants/theme';

/**
 * OAuth callback screen.
 *
 * On native (iOS / Android) this screen is never meaningfully shown — the
 * WebBrowser session returns tokens directly to handleGoogleLogin in login.tsx.
 *
 * On web the browser is redirected here by Supabase after Google authenticates.
 * Supabase appends the session tokens in the URL hash fragment:
 *   /callback#access_token=...&refresh_token=...&type=signup
 * We parse those, call setSession so the Supabase client becomes authenticated,
 * then forward to '/' and let the auth guard in _layout.tsx do the routing.
 */
export default function CallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      if (Platform.OS === 'web') {
        // Tokens can arrive in the hash fragment or (less common) query string.
        const hash  = typeof window !== 'undefined' ? window.location.hash.slice(1)   : '';
        const query = typeof window !== 'undefined' ? window.location.search.slice(1) : '';
        const raw   = hash || query;

        if (raw) {
          const params       = new URLSearchParams(raw);
          const accessToken  = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token:  accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              console.error('[Callback] setSession error:', error.message);
            }
            // onAuthStateChange in AuthContext fires automatically after setSession,
            // so _layout.tsx will re-evaluate routing once the session is stored.
          }
        }
      }

      // Always forward to root — auth guard handles where to go next.
      router.replace('/');
    };

    handleCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgScreen,
  },
});
