import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// بيانات الربط الرسمية والآمنة الخاصة بمشروعك Soug-Xpress
const supabaseUrl = 'https://vztpzxigxmgbpakkbyrs.supabase.co';
const supabaseAnonKey = 'sb_publishable_XDS7enJj9dl0efvKhgAz8A_dFjm0RGj';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
