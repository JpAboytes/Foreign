import { supabase } from './supabase/client';
import type { Mentor } from './mentorService';

// Interfaces
export interface ChatSession {
  id: string;
  mentorId: string;
  studentId: string;
  lastMessage: string;
  lastMessageTimestamp: any;
  unreadCount: number;
  mentor?: Mentor;
  student?: {
    id: string;
    name: string;
    photo: string;
  };
}

export interface ChatMessage {
  id?: string;
  senderId: string;
  text: string;
  timestamp: any;
  isRead: boolean;
}

// Mensaje del chat entre amigos (forma que usa app/extra/chat.tsx).
export interface RealtimeChatMessage {
  id: string;
  from: string;
  text: string;
  timestamp: number; // milisegundos
}

// Conversación con un amigo (forma que usa app/extra/messages.tsx).
export interface DirectConversation {
  id: string; // id del amigo
  name: string;
  photoURL: string;
  sessionId?: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
}

const MESSAGES_LIMIT = 50;

type ProfileLite = { id: string; name: string; photo_url: string | null };

type SessionRow = {
  id: string;
  mentor_id: string;
  student_id: string;
  last_message: string;
  last_message_at: string;
  mentor?: (ProfileLite & { university: string | null; interests: string[]; origin: string | null; created_at: string }) | null;
  student?: ProfileLite | null;
  unread?: { count: number }[];
};

type MessageRow = {
  id: string;
  session_id: string;
  sender_id: string;
  text: string;
  is_read: boolean;
  created_at: string;
};

const toChatMessage = (row: MessageRow): ChatMessage => ({
  id: row.id,
  senderId: row.sender_id,
  text: row.text,
  timestamp: row.created_at,
  isRead: row.is_read,
});

const toChatSession = (row: SessionRow): ChatSession => {
  const session: ChatSession = {
    id: row.id,
    mentorId: row.mentor_id,
    studentId: row.student_id,
    lastMessage: row.last_message,
    lastMessageTimestamp: row.last_message_at,
    unreadCount: row.unread?.[0]?.count ?? 0,
  };
  if (row.student) {
    session.student = {
      id: row.student.id,
      name: row.student.name || 'Estudiante',
      photo: row.student.photo_url ?? '',
    };
  }
  if (row.mentor) {
    session.mentor = {
      uid: row.mentor.id,
      email: null,
      name: row.mentor.name || 'Mentor',
      university: row.mentor.university ?? '',
      photo: row.mentor.photo_url ?? '',
      interests: row.mentor.interests ?? [],
      origin: row.mentor.origin ?? '',
      createdAt: row.mentor.created_at,
      isAdmin: false,
      isMentor: true,
    };
  }
  return session;
};

// Sesiones del usuario con el conteo de mensajes recibidos sin leer.
const SESSION_SELECT =
  'id, mentor_id, student_id, last_message, last_message_at, ' +
  'mentor:profiles!chat_sessions_mentor_id_fkey(id, name, photo_url, university, interests, origin, created_at), ' +
  'student:profiles!chat_sessions_student_id_fkey(id, name, photo_url), ' +
  'unread:messages(count)';

const fetchSessions = async (userId: string, column: 'mentor_id' | 'student_id'): Promise<ChatSession[]> => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select(SESSION_SELECT)
    .eq(column, userId)
    .eq('unread.is_read', false)
    .neq('unread.sender_id', userId)
    .order('last_message_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as SessionRow[]).map(toChatSession);
};

// Suscribe a cambios de `messages` (RLS limita los eventos a mis chats) y devuelve
// la función que cierra el canal. Úsala en el cleanup del useEffect.
const subscribeToMessages = (name: string, onChange: () => void, filter?: string): (() => void) => {
  const channel = supabase
    .channel(`${name}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages', ...(filter ? { filter } : {}) },
      onChange
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
};

// Carga inicial + recarga ante cada cambio; ignora respuestas tardías tras cancelar.
const liveQuery = <T>(
  name: string,
  load: () => Promise<T>,
  callback: (value: T) => void,
  filter?: string
): (() => void) => {
  let active = true;
  const run = async () => {
    try {
      const value = await load();
      if (active) callback(value);
    } catch (error) {
      console.error(`Error cargando ${name}:`, error);
    }
  };
  const unsubscribe = subscribeToMessages(name, run, filter);
  run();
  return () => {
    active = false;
    unsubscribe();
  };
};

// Iniciar sesión de chat con un mentor (reutiliza la sesión si ya existe).
// La notificación al mentor se crea en el dominio de notificaciones (ver docs).
export const startChatSession = async (
  studentId: string,
  mentorId: string,
  initialMessage: string
): Promise<string> => {
  try {
    const { data: existing, error: findError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('student_id', studentId)
      .eq('mentor_id', mentorId)
      .maybeSingle();
    if (findError) throw findError;

    let sessionId = existing?.id;
    if (!sessionId) {
      const { data: created, error: createError } = await supabase
        .from('chat_sessions')
        .insert({ student_id: studentId, mentor_id: mentorId, last_message: initialMessage })
        .select('id')
        .single();
      if (createError) throw createError;
      sessionId = created.id;
    }

    await sendChatMessage(sessionId, studentId, initialMessage);
    return sessionId;
  } catch (error) {
    console.error('Error iniciando sesión de chat:', error);
    throw error;
  }
};

// Sesiones recibidas (mentor). Devuelve la función para cancelar la suscripción.
export const getReceivedChatSessions = (mentorId: string, callback: (sessions: ChatSession[]) => void) =>
  liveQuery('chat-recibidos', () => fetchSessions(mentorId, 'mentor_id'), callback);

// Sesiones enviadas (estudiante). Devuelve la función para cancelar la suscripción.
export const getSentChatSessions = (studentId: string, callback: (sessions: ChatSession[]) => void) =>
  liveQuery('chat-enviados', () => fetchSessions(studentId, 'student_id'), callback);

const fetchMessages = async (sessionId: string): Promise<MessageRow[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('id, session_id, sender_id, text, is_read, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(MESSAGES_LIMIT);
  if (error) throw error;
  return data as MessageRow[];
};

// Mensajes de una sesión (más recientes primero) en tiempo real.
export const getChatMessages = (sessionId: string, callback: (messages: ChatMessage[]) => void) =>
  liveQuery(
    'mensajes',
    async () => (await fetchMessages(sessionId)).map(toChatMessage),
    callback,
    `session_id=eq.${sessionId}`
  );

// Enviar mensaje y actualizar la última actividad de la sesión.
export const sendChatMessage = async (sessionId: string, senderId: string, text: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({ session_id: sessionId, sender_id: senderId, text })
      .select('id')
      .single();
    if (error) throw error;

    const { error: updateError } = await supabase
      .from('chat_sessions')
      .update({ last_message: text, last_message_at: new Date().toISOString() })
      .eq('id', sessionId);
    if (updateError) throw updateError;

    return data.id;
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    throw error;
  }
};

// Marcar como leídos los mensajes que envió la otra persona.
export const markMessagesAsRead = async (sessionId: string, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('session_id', sessionId)
      .neq('sender_id', userId)
      .eq('is_read', false);
    if (error) throw error;
  } catch (error) {
    console.error('Error marcando mensajes como leídos:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Chat entre amigos. Reutiliza chat_sessions (el que abre el chat es "student").
// ---------------------------------------------------------------------------

// Sesión entre dos usuarios en cualquier dirección, o null si no existe.
export const findDirectSession = async (userId: string, friendId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id')
    .or(
      `and(student_id.eq.${userId},mentor_id.eq.${friendId}),and(student_id.eq.${friendId},mentor_id.eq.${userId})`
    )
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
};

export const getOrCreateDirectSession = async (userId: string, friendId: string): Promise<string> => {
  const existing = await findDirectSession(userId, friendId);
  if (existing) return existing;
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ student_id: userId, mentor_id: friendId })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
};

// Enviar un mensaje en una sesión (id de sesión en lugar del antiguo chatId).
export const sendMessage = async (sessionId: string, senderId: string, text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return;
  return sendChatMessage(sessionId, senderId, trimmed);
};

// Mensajes en orden cronológico para la pantalla de chat, en tiempo real.
export const subscribeToChatMessages = (
  sessionId: string,
  callback: (messages: RealtimeChatMessage[]) => void
): (() => void) =>
  getChatMessages(sessionId, (messages) =>
    callback(
      messages
        .map((m) => ({ id: m.id as string, from: m.senderId, text: m.text, timestamp: Date.parse(m.timestamp) }))
        .reverse()
    )
  );

// Conversaciones con los amigos aceptados, con último mensaje y no leídos.
const fetchDirectConversations = async (userId: string): Promise<DirectConversation[]> => {
  const { data: friendships, error: friendsError } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  if (friendsError) throw friendsError;

  const friendIds = friendships.map((f) => (f.requester_id === userId ? f.addressee_id : f.requester_id));
  if (!friendIds.length) return [];

  const [{ data: profiles, error: profilesError }, { data: sessions, error: sessionsError }] = await Promise.all([
    supabase.from('profiles').select('id, name, photo_url').in('id', friendIds),
    supabase
      .from('chat_sessions')
      .select('id, mentor_id, student_id, last_message, last_message_at, unread:messages(count)')
      .or(`mentor_id.eq.${userId},student_id.eq.${userId}`)
      .eq('unread.is_read', false)
      .neq('unread.sender_id', userId),
  ]);
  if (profilesError) throw profilesError;
  if (sessionsError) throw sessionsError;

  const sessionRows = sessions as unknown as SessionRow[];
  return (profiles as ProfileLite[]).map((profile) => {
    const session = sessionRows.find((s) => s.mentor_id === profile.id || s.student_id === profile.id);
    return {
      id: profile.id,
      name: profile.name || 'Sin nombre',
      photoURL: profile.photo_url ?? '',
      sessionId: session?.id,
      lastMessage: session?.last_message ?? '',
      timestamp: session && session.last_message ? Date.parse(session.last_message_at) : 0,
      unreadCount: session?.unread?.[0]?.count ?? 0,
    };
  });
};

export const subscribeToDirectConversations = (
  userId: string,
  callback: (conversations: DirectConversation[]) => void
): (() => void) => liveQuery('conversaciones', () => fetchDirectConversations(userId), callback);
