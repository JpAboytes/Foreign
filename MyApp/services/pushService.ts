import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase/client';

// Datos que envía la cola de push (ver trigger enqueue_push_for_notification).
export interface PushData {
  notification_id?: string;
  type?: string;
  from_user_id?: string;
  content_id?: string;
  related_content_id?: string;
}

// Destino de navegación para expo-router.
export interface PushRoute {
  pathname: string;
  params?: Record<string, string>;
}

let registeredToken: string | null = null;

// Cómo se muestran las notificaciones con la app en primer plano.
export const configureForegroundHandler = (): void => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
};

const getProjectId = (): string | undefined => {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId;
};

// Pide permiso (si hace falta) y devuelve el Expo push token, o null si no es posible.
export const getExpoPushToken = async (): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      console.log('Las notificaciones push requieren un dispositivo físico.');
      return null;
    }

    const projectId = getProjectId();
    if (!projectId) {
      console.log('Falta extra.eas.projectId en la configuración; no se registra el push token.');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') {
      console.log('El usuario no concedió permiso de notificaciones.');
      return null;
    }

    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data ?? null;
  } catch (error) {
    console.error('Error al obtener el push token:', error);
    return null;
  }
};

// Obtiene el token y lo guarda (upsert) en push_tokens para el usuario. Devuelve el token o null.
export const registerForPushNotifications = async (userId: string): Promise<string | null> => {
  if (!userId) return null;
  const token = await getExpoPushToken();
  if (!token) return null;

  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      { token, user_id: userId, platform, updated_at: new Date().toISOString() },
      { onConflict: 'token' }
    );
  if (error) {
    console.error('Error al guardar el push token:', error);
    return null;
  }
  registeredToken = token;
  return token;
};

// Borra el token de este dispositivo. Debe llamarse antes de cerrar sesión (RLS: solo el dueño borra).
export const unregisterPushToken = async (): Promise<void> => {
  const token = registeredToken;
  if (!token) return;
  const { error } = await supabase.from('push_tokens').delete().eq('token', token);
  if (error) {
    console.error('Error al eliminar el push token:', error);
    return;
  }
  registeredToken = null;
};

// Traduce los datos de una notificación a una ruta de la app (misma lógica que la pantalla de notificaciones).
export const getRouteForPushData = (data: PushData | null | undefined): PushRoute | null => {
  const type = data?.type;
  if (!type) return null;
  const contentId = data?.content_id ?? '';

  if (type === 'chat_message') {
    // La pantalla de chat se abre por el id del otro usuario (el remitente).
    return data?.from_user_id
      ? { pathname: '/extra/chat', params: { friendId: data.from_user_id } }
      : null;
  }
  if (type.startsWith('post_')) {
    return contentId
      ? { pathname: '/(drawer)/(tabs)/feed', params: { showPostId: contentId } }
      : null;
  }
  if (type.startsWith('forum_question_')) {
    return contentId ? { pathname: '/extra/questionDetail', params: { questionId: contentId } } : null;
  }
  if (type.startsWith('forum_answer_')) {
    return data?.related_content_id
      ? {
          pathname: '/extra/questionDetail',
          params: { questionId: data.related_content_id, scrollToAnswerId: contentId },
        }
      : null;
  }
  if (type === 'raite_request') {
    return {
      pathname: '/(drawer)/(tabs)/map',
      params: { showRaiteRequest: contentId, fromUserId: data?.from_user_id ?? '' },
    };
  }
  // Solicitudes de amistad, raites aceptados/cancelados y demás: bandeja de notificaciones.
  return { pathname: '/extra/notifications' };
};

// Escucha notificaciones recibidas (primer plano) y tocadas. Devuelve la función de limpieza.
export const subscribeToPushEvents = (handlers: {
  onReceived?: (data: PushData) => void;
  onOpened: (route: PushRoute) => void;
}): (() => void) => {
  const received = Notifications.addNotificationReceivedListener(n => {
    handlers.onReceived?.((n.request.content.data ?? {}) as PushData);
  });
  const response = Notifications.addNotificationResponseReceivedListener(r => {
    const route = getRouteForPushData((r.notification.request.content.data ?? {}) as PushData);
    if (route) handlers.onOpened(route);
  });
  return () => {
    received.remove();
    response.remove();
  };
};

// Notificación que abrió la app desde cerrada (arranque en frío).
export const getInitialPushRoute = async (): Promise<PushRoute | null> => {
  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) return null;
  return getRouteForPushData((response.notification.request.content.data ?? {}) as PushData);
};
