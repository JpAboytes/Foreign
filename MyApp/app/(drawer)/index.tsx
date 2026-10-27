import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { subscribeToAuthChanges } from '../../services/auth';
import { isUserAdmin } from '../../services/userService';

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          setIsAdmin(await isUserAdmin());
        } catch (error) {
          console.error("Error fetching user role:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
      setCheckingRole(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading || checkingRole) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4f0b2e" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (isAdmin !== null) {
    return isAdmin
      ? <Redirect href="./(adminTabs)" />
      : <Redirect href="./(tabs)/dashboard" />
  }

  // Fallback por seguridad
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#4f0b2e" />
    </View>
  );
}
