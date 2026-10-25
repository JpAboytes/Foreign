import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { subscribeToAuthChanges } from '../../../services/auth';
import { Text, TouchableOpacity, View, Platform, StyleSheet } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { DrawerActions } from 'expo-router/react-navigation';
import { RaiteProvider, useRaite } from '../../../context/RaiteContext'; 
import { useNotifications } from '../../../context/NotificationContext';

export default function TabLayout() {
  const [isAnonymous, setIsAnonymous] = useState<boolean | null>(null);
  const navigation = useNavigation();
  const router = useRouter();
  const { hasActiveRaiteRequest } = useRaite();
  // hasUnread cubre notificaciones y mensajes de chat sin leer (Realtime en NotificationContext)
  const { notifications, hasUnread: hasUnreadNotifications } = useNotifications();
  
  // Verificar si hay solicitudes de raite no leídas
  const hasUnreadRaiteRequests = notifications.some(
    notif => notif.type === 'raite_request' && !notif.read
  );

  const openDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.dispatch(DrawerActions.openDrawer());
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      if (user) {
        setIsAnonymous(!!user.is_anonymous);
      }
    });
    return () => unsubscribe();
  }, []);

  if (isAnonymous === null) return null;

  const navigateToNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/extra/notifications');
  };

  const ForeignHeader = () => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', width: '100%' }}>
      <Text style={{ fontSize: 22, fontStyle: 'italic', color: 'white', fontWeight: 'bold' }}>
        Foreign
      </Text>
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#1e1e1e', shadowColor: '#000', shadowOpacity: 0.3 },
        headerTintColor: '#fff',
        tabBarStyle: { backgroundColor: '#1e1e1e', borderTopColor: '#333' },
        tabBarActiveTintColor: '#bb86fc',
        tabBarInactiveTintColor: '#888',
        headerLeft: () => (
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }} onPress={openDrawer} >
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity 
            style={{ position: 'relative', marginRight: 15 }} 
            onPress={navigateToNotifications}
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            {hasUnreadNotifications && (
              <View style={{
                position: 'absolute',
                top: -5,
                right: -5,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: '#FF3B30',
                borderWidth: 1,
                borderColor: '#1e1e1e'
              }} />
            )}
          </TouchableOpacity>
        ),
        ...(Platform.OS === 'web' ? {
          contentStyle: {
            alignItems: 'center',
          }
        } : {})
      }}
    >
      <Tabs.Screen 
        name="feed" 
        options={{
          headerTitle: ForeignHeader,
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color as string} size={size} />
          ),
        }}
      />

      <Tabs.Screen 
        name="map" 
        options={{
          headerTitle: ForeignHeader,
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" color={color as string} size={size} />
          ),
          tabBarBadge: hasUnreadRaiteRequests ? "!" : undefined,
          tabBarBadgeStyle: { backgroundColor: '#FF6B6B' }
        }}
      />


      <Tabs.Screen 
        name="mentor" 
        options={{
          headerTitle: ForeignHeader,
          title: 'Mentor',
          href: isAnonymous ? null : undefined,
          tabBarIcon: isAnonymous
            ? () => null
            : ({ color, size }) => (
                <Ionicons name="people" color={color as string} size={size} />
              ),
        }}
      />

      <Tabs.Screen 
        name="forum" 
        options={{
          headerTitle: ForeignHeader,
          title: 'Forum',
          href: isAnonymous ? null : undefined,
          tabBarIcon: isAnonymous
            ? () => null
            : ({ color, size }) => (
                <Ionicons name="chatbubble" color={color as string} size={size} />
              ),
        }}
      />

      <Tabs.Screen 
        name="profile" 
        options={{
          headerTitle: ForeignHeader,
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color as string} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

// Add these styles if you're using Option 2
const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    maxWidth: 768,
    width: '100%',
  }
});
