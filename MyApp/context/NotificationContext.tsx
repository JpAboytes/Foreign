import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { subscribeToAuthChanges } from '../services/auth';
import {
  Notification,
  NotificationType,
  createNotification as createNotificationRecord,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from '../services/notificationService';

export type { Notification, NotificationType };

// Para mensajes
export interface MessageNotification {
  chatId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  lastMessage: string;
  unreadCount: number;
  timestamp: number;
}

// Agrupar notificaciones similares
const groupNotifications = (notifs: Notification[]): Notification[] => {
  const grouped = new Map<string, Notification>();
  
  notifs.forEach(notif => {
    // CAMBIO AQUÍ: Modificar la clave para incluir el contentId 
    // Esto asegura que notificaciones de distintas publicaciones 
    // no se agrupen juntas, aun siendo del mismo tipo
    const groupKey = `${notif.type}_${notif.contentId}`;
    
    if (grouped.has(groupKey)) {
      // Si ya existe una notificación para este tipo y contentId
      const existing = grouped.get(groupKey)!;
      
      // Asegurarnos de que 'senders' exista y sea un array
      const currentSenders = existing.senders || [];
      
      // Añadir nuevo remitente si no está ya en la lista
      const newSender = { id: notif.fromUserId, name: notif.fromUserName, photo: notif.fromUserPhoto };
      const senderExists = currentSenders.some(sender => sender.id === newSender.id);
      
      grouped.set(groupKey, {
        ...existing,
        count: (existing.count || 1) + 1,
        timestamp: Math.max(existing.timestamp, notif.timestamp), // Usar el timestamp más reciente
        read: existing.read && notif.read, // Marcar como leído solo si todas en el grupo lo están
        senders: senderExists ? currentSenders : [...currentSenders, newSender] // Actualizar lista de remitentes
      });
    } else {
      // Si no existe, añadirla con contador 1 y lista de remitentes inicial
      grouped.set(groupKey, {
        ...notif,
        count: 1,
        senders: [{ id: notif.fromUserId, name: notif.fromUserName, photo: notif.fromUserPhoto }]
      });
    }
  });
  
  return Array.from(grouped.values()).sort((a, b) => b.timestamp - a.timestamp);
};


interface NotificationContextType {
  notifications: Notification[];
  messageNotifications: MessageNotification[];
  hasUnread: boolean;
  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  createNotification: (data: Omit<Notification, 'id' | 'read' | 'timestamp'>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  messageNotifications: [],
  hasUnread: false,
  fetchNotifications: async () => {},
  markAllAsRead: async () => {},
  markAsRead: async () => {},
  createNotification: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

// Mensajes de chat sin leer, agrupados por sesión (vienen como notificaciones chat_message
// que crea el trigger de la tabla messages).
const buildMessageNotifications = (all: Notification[]): MessageNotification[] => {
  const bySession = new Map<string, MessageNotification>();
  // all viene ordenado de más reciente a más antigua
  for (const n of all) {
    if (n.type !== 'chat_message' || n.read) continue;
    const existing = bySession.get(n.contentId);
    if (existing) {
      existing.unreadCount += 1;
    } else {
      bySession.set(n.contentId, {
        chatId: n.contentId,
        userId: n.fromUserId,
        userName: n.fromUserName || 'Usuario',
        userPhoto: n.fromUserPhoto,
        lastMessage: n.contentText || 'Nuevo mensaje',
        unreadCount: 1,
        timestamp: n.timestamp,
      });
    }
  }
  return Array.from(bySession.values()).sort((a, b) => b.timestamp - a.timestamp);
};

export const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = userId;

  const systemNotifications = allNotifications.filter(n => n.type !== 'chat_message');
  const notifications = groupNotifications(systemNotifications);
  const messageNotifications = buildMessageNotifications(allNotifications);
  const hasUnread = systemNotifications.some(n => !n.read) || messageNotifications.length > 0;

  // Crear una notificación (la tabla exige que el emisor sea el usuario autenticado)
  const createNotification = async (data: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
    try {
      await createNotificationRecord(data);
    } catch (error) {
      console.error('Error al crear notificación:', error);
    }
  };

  // Recarga las notificaciones del usuario actual
  const fetchNotifications = useCallback(async () => {
    const currentId = userIdRef.current;
    if (!currentId) return;
    try {
      const list = await getNotifications(currentId);
      if (userIdRef.current === currentId) setAllNotifications(list);
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
    }
  }, []);

  // Marcar todas las notificaciones (y mensajes) como leídas
  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      await markAllNotificationsRead(userId);
      // Actualizar estado local sin esperar a Realtime
      setAllNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error al marcar notificaciones como leídas:', error);
    }
  };

  // Marcar una notificación específica como leída
  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationRead(notificationId);
      setAllNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, read: true } : n)));
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };

  // Sesión: sigue al usuario autenticado
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(user => {
      setUserId(user?.id ?? null);
      if (!user) setAllNotifications([]);
    });
    return () => unsubscribe();
  }, []);

  // Carga inicial + Realtime; el canal se cierra en el cleanup
  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
    const unsubscribe = subscribeToNotifications(userId, () => {
      fetchNotifications();
    });
    return () => unsubscribe();
  }, [userId, fetchNotifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      messageNotifications,
      hasUnread,
      fetchNotifications,
      markAllAsRead,
      markAsRead,
      createNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
