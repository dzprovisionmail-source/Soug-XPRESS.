import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase';

// Single source of truth: role always comes from the `profiles` table in Supabase,
// never from user_metadata. Add 'admin' here when the profiles table supports it.
interface UserProfile {
  id: string;
  email: string;
  role: 'customer' | 'merchant' | 'delivery' | 'admin' | null;
  full_name?: string;
  phone?: string;
  zone?: string;
}

interface AuthContextType {
  session: Session | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string, userEmail: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) {
        setUserProfile(data as UserProfile);
      } else {
        // New user: no profile row yet — role will be set during /register
        setUserProfile({ id: userId, email: userEmail, role: null });
      }
    } catch (err) {
      setUserProfile({ id: userId, email: userEmail, role: null });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      } else {
        setUserProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (session?.user) await fetchProfile(session.user.id, session.user.email || '');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, userProfile, isLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
