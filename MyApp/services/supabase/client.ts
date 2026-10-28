import 'expo-sqlite/localStorage/install';
import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copia MyApp/.env.example a MyApp/.env.'
  );
}

// Cliente único de Supabase. Solo los servicios en services/ lo importan.
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    // En web el render estático no tiene localStorage; ahí supabase-js usa memoria.
    storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresca el token solo mientras la app está en primer plano.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
