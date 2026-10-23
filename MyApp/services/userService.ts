import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase/client';
import type { Tables, TablesUpdate } from '../types/supabase';

// Interfaces
export interface UserProfile {
  uid: string;
  email: string | null;
  friends?: string[];
  name: string;
  university?: string;
  photo?: string;
  interests?: string[];
  origin?: string;
  createdAt?: any;
  isAdmin?: boolean;
  isMentor?: boolean;
}

type ProfileRow = Tables<'profiles'>;

export const profileFromRow = (row: ProfileRow, extra: Partial<UserProfile> = {}): UserProfile => ({
  uid: row.id,
  email: null,
  name: row.name,
  university: row.university ?? undefined,
  photo: row.photo_url ?? undefined,
  interests: row.interests,
  origin: row.origin ?? undefined,
  createdAt: row.created_at,
  ...extra,
});

// Solo los campos que el usuario puede editar de su propio perfil.
export const profileToUpdate = (data: Partial<UserProfile>): TablesUpdate<'profiles'> => {
  const update: TablesUpdate<'profiles'> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.university !== undefined) update.university = data.university || null;
  if (data.photo !== undefined) update.photo_url = data.photo || null;
  if (data.interests !== undefined) update.interests = data.interests;
  if (data.origin !== undefined) update.origin = data.origin || null;
  return update;
};

// Actualizar el perfil del usuario autenticado. El perfil lo crea el trigger
// handle_new_user al registrarse, así que aquí solo se actualiza.
export const createOrUpdateUserProfile = async (
  userId: string,
  profileData?: Partial<UserProfile>
): Promise<void> => {
  if (!profileData) return;
  const update = profileToUpdate(profileData);
  if (Object.keys(update).length === 0) return;

  const { error } = await supabase.from('profiles').update(update).eq('id', userId);
  if (error) {
    console.error('Error actualizando perfil de usuario:', error);
    throw error;
  }
};

// Obtener perfil de usuario. isAdmin solo se puede saber del usuario autenticado
// (RLS de user_roles); para los demás queda en false.
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const [profileResult, roleResult, mentorResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle(),
    supabase.from('mentors').select('user_id').eq('user_id', userId).maybeSingle(),
  ]);

  if (profileResult.error) {
    console.error('Error obteniendo perfil de usuario:', profileResult.error);
    throw profileResult.error;
  }
  if (!profileResult.data) return null;

  return profileFromRow(profileResult.data, {
    isAdmin: !!roleResult.data,
    isMentor: !!mentorResult.data,
  });
};

// Guardar perfil en AsyncStorage para uso offline
export const saveProfileToStorage = async (profile: Partial<UserProfile>): Promise<void> => {
  try {
    await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
  } catch (error) {
    console.error('Error guardando perfil en AsyncStorage:', error);
    throw error;
  }
};

// Obtener perfil desde AsyncStorage
export const getProfileFromStorage = async (): Promise<Partial<UserProfile> | null> => {
  try {
    const profile = await AsyncStorage.getItem('userProfile');
    return profile ? JSON.parse(profile) : null;
  } catch (error) {
    console.error('Error obteniendo perfil desde AsyncStorage:', error);
    return null;
  }
};

// Verificar si el usuario autenticado es administrador
export const isUserAdmin = async (): Promise<boolean> => {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) {
    console.error('Error verificando si el usuario es administrador:', error);
    return false;
  }
  return data;
};
