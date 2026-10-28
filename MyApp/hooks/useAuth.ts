import { useState, useEffect, useCallback } from 'react';
import * as AuthService from '../services/auth';
import * as UserService from '../services/userService';
import { uploadProfileImage } from '../services/imageService';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export interface AuthState {
  user: AuthService.AuthUser | null;
  userProfile: UserService.UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, profileData: Partial<UserService.UserProfile>) => Promise<void>;
  loginWithGoogle: (idToken: string, nonce?: string) => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserService.UserProfile>) => Promise<void>;
}

export function useAuth(): [AuthState, AuthActions] {
  const [state, setState] = useState<AuthState>({
    user: null,
    userProfile: null,
    isLoading: true,
    isAdmin: false,
  });

  const router = useRouter();

  // Función para actualizar el estado con datos del usuario
  const refreshUserState = useCallback(async (user: AuthService.AuthUser | null) => {
    if (!user) {
      setState({
        user: null,
        userProfile: null,
        isLoading: false,
        isAdmin: false,
      });
      return null;
    }

    try {
      const userProfile = await UserService.getUserProfile(user.id);
      const profile = userProfile ? { ...userProfile, email: user.email ?? null } : null;

      setState({
        user,
        userProfile: profile,
        isLoading: false,
        isAdmin: !!profile?.isAdmin,
      });
      return profile;
    } catch (error) {
      console.error('Error refreshing user state:', error);
      setState(prev => ({ ...prev, user, isLoading: false }));
      return null;
    }
  }, []);

  // Suscribirse a cambios de autenticación
  useEffect(() => {
    const unsubscribe = AuthService.subscribeToAuthChanges(async (user) => {
      const profile = await refreshUserState(user);
      if (!user) return;

      // Redirigir basado en el tipo de usuario
      if (profile?.isAdmin) {
        router.replace('/(drawer)/(adminTabs)');
      } else {
        router.replace('/(drawer)/(tabs)/feed');
      }
    });

    return () => unsubscribe();
  }, [refreshUserState, router]);

  // Acciones de autenticación
  const actions: AuthActions = {
    login: async (email: string, password: string) => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        await AuthService.loginWithEmail(email, password);
        // El listener de auth carga el perfil y redirige.
      } catch (error: any) {
        Alert.alert('Error en Login', error.message);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },

    signup: async (email: string, password: string, profileData: Partial<UserService.UserProfile>) => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        const { user, needsEmailConfirmation } = await AuthService.registerWithEmail(email, password, {
          name: profileData.name,
          university: profileData.university,
          origin: profileData.origin,
          interests: profileData.interests,
        });

        if (needsEmailConfirmation) {
          setState(prev => ({ ...prev, isLoading: false }));
          Alert.alert(
            'Confirma tu correo',
            'Te enviamos un enlace de confirmación. Ábrelo y después inicia sesión. Podrás agregar tu foto desde tu perfil.'
          );
          return;
        }

        // Con sesión activa ya se puede subir la foto a la carpeta del usuario.
        if (user && profileData.photo) {
          const photoURL = await uploadProfileImage(profileData.photo, user.id);
          await UserService.createOrUpdateUserProfile(user.id, { photo: photoURL });
          await refreshUserState(user);
        }
      } catch (error: any) {
        Alert.alert('Error en Registro', error.message);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },

    loginWithGoogle: async (idToken: string, nonce?: string) => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        await AuthService.signInWithGoogle(idToken, nonce);
      } catch (error: any) {
        Alert.alert('Error en Login con Google', error.message);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },

    loginWithApple: async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        const user = await AuthService.signInWithApple();
        if (!user) setState(prev => ({ ...prev, isLoading: false }));
      } catch (error: any) {
        Alert.alert('Error en Login con Apple', error.message);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },

    logout: async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        await AuthService.logout();
        router.replace('/login');
      } catch (error: any) {
        Alert.alert('Error al cerrar sesión', error.message);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },

    updateProfile: async (data: Partial<UserService.UserProfile>) => {
      try {
        if (!state.user) throw new Error('No hay usuario autenticado');

        setState(prev => ({ ...prev, isLoading: true }));
        await UserService.createOrUpdateUserProfile(state.user.id, data);
        await refreshUserState(state.user);
      } catch (error: any) {
        Alert.alert('Error al actualizar perfil', error.message);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
  };

  return [state, actions];
}
