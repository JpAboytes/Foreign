import { supabase } from './supabase/client';

// El chat vive en chatService; se reexporta para conservar los imports existentes.
export {
  startChatSession,
  getReceivedChatSessions,
  getSentChatSessions,
  getChatMessages,
  sendChatMessage,
  markMessagesAsRead,
} from './chatService';
export type { ChatSession, ChatMessage } from './chatService';

// Interfaces
export interface Mentor {
  uid: string;
  email: string | null;
  name: string;
  university?: string;
  photo?: string;
  interests?: string[];
  origin?: string;
  createdAt?: any;
  isAdmin?: boolean;
  isMentor?: boolean;
  rating?: number; // Calificación del mentor
  topics?: string[];
  isAvailable?: boolean;
  bio?: string;
}

const MENTOR_SELECT =
  'user_id, bio, topics, is_available, rating, created_at, profile:profiles!mentors_user_id_fkey!inner(id, name, photo_url, university, interests, origin, created_at)';

type MentorRow = {
  user_id: string;
  bio: string;
  topics: string[];
  is_available: boolean;
  rating: number | null;
  created_at: string;
  profile: {
    id: string;
    name: string;
    photo_url: string | null;
    university: string | null;
    interests: string[];
    origin: string | null;
    created_at: string;
  };
};

const toMentor = (row: MentorRow): Mentor => ({
  uid: row.user_id,
  email: null, // el correo ya no se expone en perfiles públicos
  name: row.profile.name || 'Mentor sin nombre',
  university: row.profile.university || 'Universidad no especificada',
  photo: row.profile.photo_url ?? '',
  interests: row.profile.interests ?? [],
  origin: row.profile.origin ?? '',
  createdAt: row.created_at,
  isAdmin: false,
  isMentor: true,
  rating: row.rating ?? undefined,
  topics: row.topics ?? [],
  isAvailable: row.is_available,
  bio: row.bio,
});

// Obtener todos los mentores
export const getMentors = async (): Promise<Mentor[]> => {
  try {
    const { data, error } = await supabase.from('mentors').select(MENTOR_SELECT);
    if (error) throw error;
    return (data as unknown as MentorRow[]).map(toMentor);
  } catch (error) {
    console.error('Error obteniendo mentores:', error);
    throw error;
  }
};

// Filtrar mentores por universidad
export const getMentorsByUniversity = async (university: string): Promise<Mentor[]> => {
  try {
    const { data, error } = await supabase
      .from('mentors')
      .select(MENTOR_SELECT)
      .eq('profile.university', university);
    if (error) throw error;
    return (data as unknown as MentorRow[]).map(toMentor);
  } catch (error) {
    console.error('Error filtrando mentores:', error);
    throw error;
  }
};
