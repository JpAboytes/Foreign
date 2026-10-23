import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import type { AuthError, User } from '@supabase/supabase-js';
import { supabase } from './supabase/client';

export type AuthUser = User;

// Datos de perfil que se guardan en los metadatos del registro; el trigger
// handle_new_user los copia a public.profiles.
export interface SignupProfileData {
  name?: string;
  university?: string;
  origin?: string;
  interests?: string[];
}

export interface SignupResult {
  user: AuthUser | null;
  // true cuando el proyecto exige confirmar el correo: no hay sesión hasta confirmarlo.
  needsEmailConfirmation: boolean;
}

// Client IDs de OAuth de Google; se definen en .env / variables de EAS.
export const GOOGLE_CONFIG = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
};

const authErrorMessages: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  email_not_confirmed: 'Confirma tu correo antes de iniciar sesión.',
  user_already_exists: 'Ya existe una cuenta con ese correo.',
  weak_password: 'La contraseña es demasiado débil.',
  over_email_send_rate_limit: 'Demasiados intentos. Espera unos minutos.',
};

const toError = (error: AuthError | Error, fallback: string): Error => {
  const code = 'code' in error ? error.code : undefined;
  return new Error((code && authErrorMessages[code]) || error.message || fallback);
};

// Iniciar sesión con correo electrónico y contraseña
export const loginWithEmail = async (email: string, password: string): Promise<AuthUser> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw toError(error, 'Error al iniciar sesión');
  return data.user;
};

// Crear un nuevo usuario con correo electrónico y contraseña
export const registerWithEmail = async (
  email: string,
  password: string,
  profileData: SignupProfileData = {}
): Promise<SignupResult> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { ...profileData } },
  });
  if (error) throw toError(error, 'Error al registrar usuario');
  return { user: data.user, needsEmailConfirmation: !data.session };
};

// Iniciar sesión con el id_token que devuelve expo-auth-session (Google)
export const signInWithGoogle = async (idToken: string, nonce?: string): Promise<AuthUser> => {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
    nonce,
  });
  if (error) throw toError(error, 'Error al iniciar sesión con Google');
  return data.user;
};

export const isAppleSignInAvailable = async (): Promise<boolean> =>
  Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync());

// Iniciar sesión con Apple. Devuelve null si el usuario cancela.
export const signInWithApple = async (): Promise<AuthUser | null> => {
  // Apple recibe el nonce hasheado y Supabase el original para verificar el token.
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (error: any) {
    if (error?.code === 'ERR_REQUEST_CANCELED') return null;
    throw toError(error, 'Error al iniciar sesión con Apple');
  }

  if (!credential.identityToken) {
    throw new Error('Apple no devolvió un token de identidad');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw toError(error, 'Error al iniciar sesión con Apple');

  // Apple solo manda el nombre la primera vez; el token no lo incluye.
  const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
    .filter(Boolean)
    .join(' ');
  if (fullName) {
    await supabase.auth.updateUser({ data: { full_name: fullName } });
    await supabase.from('profiles').update({ name: fullName }).eq('id', data.user.id).eq('name', '');
  }

  return data.user;
};

// Cerrar sesión
export const logout = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw toError(error, 'Error al cerrar sesión');
};

// Usuario de la sesión guardada (sin ir a la red)
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
};

// Escuchar cambios en el estado de autenticación
export const subscribeToAuthChanges = (
  callback: (user: AuthUser | null) => void
): (() => void) => {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    // El callback no debe esperar llamadas a Supabase dentro de onAuthStateChange
    // (bloquea el lock de auth); se difiere al siguiente tick.
    setTimeout(() => callback(session?.user ?? null), 0);
  });
  return () => data.subscription.unsubscribe();
};

// Restablecer contraseña
export const resetPassword = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw toError(error, 'Error al restablecer contraseña');
};
