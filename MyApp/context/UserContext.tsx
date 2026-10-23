import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthUser, subscribeToAuthChanges } from '../services/auth';
import { getUserProfile, UserProfile } from '../services/userService';

type UserContextType = {
  user: AuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  user: null,
  userProfile: null,
  loading: true,
  refreshProfile: async () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Función para recuperar datos del perfil
  const fetchUserProfile = useCallback(async (authUser: AuthUser) => {
    try {
      const profile = await getUserProfile(authUser.id);
      setUserProfile(profile ? { ...profile, email: authUser.email ?? null } : null);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }, []);

  // Función para refrescar el perfil (útil después de actualizaciones)
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchUserProfile(user);
    }
  }, [user, fetchUserProfile]);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (authUser) => {
      setLoading(true);
      setUser(authUser);

      if (authUser) {
        await fetchUserProfile(authUser);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  return (
    <UserContext.Provider value={{ user, userProfile, loading, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
