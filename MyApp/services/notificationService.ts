import { supabase } from './supabase/client';

export type NotificationType =
  | 'message'
  | 'chat_message'
  | 'post_like'
  | 'post_comment'
  | 'forum_question_like'
  | 'forum_question_comment'
  | 'forum_answer_like'
  | 'forum_answer_comment'
  | 'friend_request'
  | 'friend_accepted'
  | 'raite_request'
  | 'raite_accepted'
  | 'raite_cancelled';

export interface Notification {
  id: string;
  type: NotificationType;
  fromUserId: string;
  fromUserName: string;
  fromUserPhoto?: string;
  toUserId: string;
  contentId: string; // ID del post, pregunta, respuesta o sesión de chat
  contentText?: string; // Texto breve del contenido
  timestamp: number;
  read: boolean;
  relatedContentId?: string; // Para respuestas dentro de preguntas
  count?: number; // Para notificaciones agrupadas
  senders?: { id: string; name: string; photo?: string }[];
}

const NOTIFICATION_SELECT =
  'id, user_id, from_user_id, type, content_id, content_text, related_content_id, read, created_at, sender:profiles!notifications_from_user_id_fkey(name, photo_url)';

type NotificationRow = {
  id: string;
  user_id: string;
  from_user_id: string;
  type: string;
  content_id: string | null;
  content_text: string | null;
  related_content_id: string | null;
  read: boolean;
  created_at: string;
  sender: { name: string; photo_url: string | null } | null;
};

const toNotification = (row: NotificationRow): Notification => ({
  id: row.id,
  type: row.type as NotificationType,
  fromUserId: row.from_user_id,
  fromUserName: row.sender?.name || 'Usuario',
  fromUserPhoto: row.sender?.photo_url ?? undefined,
  toUserId: row.user_id,
  contentId: row.content_id ?? '',
  contentText: row.content_text ?? undefined,
  timestamp: new Date(row.created_at).getTime(),
  read: row.read,
  relatedContentId: row.related_content_id ?? undefined,
});

// Crear una notificación para otro usuario. fromUserId debe ser el usuario autenticado (RLS).
// fromUserName y fromUserPhoto se aceptan por compatibilidad: ahora se leen del perfil.
export const createNotification = async (data: {
  type: string;
  fromUserId: string;
  fromUserName?: string;
  fromUserPhoto?: string;
  toUserId: string;
  contentId: string;
  contentText?: string;
  relatedContentId?: string;
}): Promise<boolean> => {
  if (!data.type || !data.fromUserId || !data.toUserId || !data.contentId) {
    console.error('Datos de notificación incompletos:', data);
    return false;
  }
  // No se notifica a uno mismo.
  if (data.fromUserId === data.toUserId) return false;

  const { error } = await supabase.from('notifications').insert({
    user_id: data.toUserId,
    from_user_id: data.fromUserId,
    type: data.type,
    content_id: data.contentId,
    content_text: data.contentText ?? '',
    related_content_id: data.relatedContentId ?? null,
  });
  if (error) {
    console.error('Error al crear notificación:', error);
    return false;
  }
  return true;
};

// Notificaciones del usuario, las más recientes primero.
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select(NOTIFICATION_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    console.error('Error al obtener notificaciones:', error);
    throw error;
  }
  return (data as unknown as NotificationRow[]).map(toNotification);
};

// Escucha cambios en las notificaciones del usuario. Devuelve la función de limpieza,
// que debe llamarse en el cleanup del useEffect para cerrar el canal.
export const subscribeToNotifications = (userId: string, onChange: () => void): (() => void) => {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      () => onChange()
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
  if (error) {
    console.error('Error al marcar notificación como leída:', error);
    throw error;
  }
};

export const markAllNotificationsRead = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) {
    console.error('Error al marcar notificaciones como leídas:', error);
    throw error;
  }
};

// Marca como leídas las notificaciones de mensajes de una sesión de chat
// (para llamarla al abrir el chat).
export const markChatNotificationsRead = async (userId: string, sessionId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('type', 'chat_message')
    .eq('content_id', sessionId)
    .eq('read', false);
  if (error) {
    console.error('Error al marcar mensajes como leídos:', error);
    throw error;
  }
};
