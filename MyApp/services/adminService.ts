import { supabase } from './supabase/client';

// Servicio del panel de administración. Todas las operaciones dependen de RLS y de las
// funciones admin_* de la base: si quien llama no es admin, Supabase las rechaza.

export type AdminCategory = 'users' | 'mentors' | 'posts' | 'locations' | 'forums';

export interface AdminUser {
  id: string;
  name?: string;
  email?: string;
  photoURL?: string;
  role?: string;
  isMentor?: boolean;
  createdAt?: string;
}

export interface AdminMentor {
  id: string;
  name?: string;
  photoURL?: string;
  areas?: string[];
  specialty?: string;
  createdAt?: string;
}

export interface AdminPost {
  id: string;
  caption?: string;
  image?: string;
  userName?: string;
  likesCount: number;
  createdAt?: string;
}

export interface AdminLocation {
  id: string;
  title?: string;
  description?: string;
  geoPoint?: { latitude: number; longitude: number };
  imageUrl?: string;
  type?: string[];
  typeLabel?: string;
  createdAt?: string;
}

export interface AdminForum {
  id: string;
  title?: string;
  authorName?: string;
  createdAt?: string;
}

export type AdminItem = AdminUser | AdminMentor | AdminPost | AdminLocation | AdminForum;

export interface AdminCounts {
  students: number;
  mentors: number;
  posts: number;
  locations: number;
  forums: number;
}

const TABLE_BY_CATEGORY = {
  posts: 'posts',
  locations: 'map_locations',
  forums: 'forum_questions',
} as const;

// Conteos para el tablero. Cada conteo falla de forma independiente (null).
export const getAdminCounts = async (): Promise<Record<keyof AdminCounts, number | null>> => {
  const count = async (table: 'profiles' | 'mentors' | 'posts' | 'map_locations' | 'forum_questions') => {
    const { count: total, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.error(`Error contando ${table}:`, error);
      return null;
    }
    return total ?? 0;
  };
  const [students, mentors, posts, locations, forums] = await Promise.all([
    count('profiles'),
    count('mentors'),
    count('posts'),
    count('map_locations'),
    count('forum_questions'),
  ]);
  return { students, mentors, posts, locations, forums };
};

const listUsers = async (): Promise<AdminUser[]> => {
  const { data, error } = await supabase.rpc('admin_list_users');
  if (error) throw error;
  return (data ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    photoURL: u.photo_url ?? undefined,
    role: u.is_admin ? 'Administrador' : u.is_mentor ? 'Mentor' : undefined,
    isMentor: u.is_mentor,
    createdAt: u.created_at,
  }));
};

type MentorJoinRow = {
  user_id: string;
  topics: string[];
  created_at: string;
  profile: { name: string; photo_url: string | null };
};

const listMentors = async (): Promise<AdminMentor[]> => {
  const { data, error } = await supabase
    .from('mentors')
    .select('user_id, topics, created_at, profile:profiles!mentors_user_id_fkey!inner(name, photo_url)');
  if (error) throw error;
  return (data as unknown as MentorJoinRow[]).map((m) => ({
    id: m.user_id,
    name: m.profile.name,
    photoURL: m.profile.photo_url ?? undefined,
    areas: m.topics,
    specialty: m.topics.join(', '),
    createdAt: m.created_at,
  }));
};

type PostJoinRow = {
  id: string;
  caption: string;
  image_url: string | null;
  created_at: string;
  author: { name: string } | null;
  post_likes: { count: number }[];
};

const listPosts = async (): Promise<AdminPost[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select('id, caption, image_url, created_at, author:profiles!posts_user_id_fkey(name), post_likes(count)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as PostJoinRow[]).map((p) => ({
    id: p.id,
    caption: p.caption,
    image: p.image_url ?? undefined,
    userName: p.author?.name,
    likesCount: p.post_likes?.[0]?.count ?? 0,
    createdAt: p.created_at,
  }));
};

const listLocations = async (): Promise<AdminLocation[]> => {
  const { data, error } = await supabase
    .from('map_locations')
    .select('id, title, description, latitude, longitude, types, image_urls, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    geoPoint: { latitude: l.latitude, longitude: l.longitude },
    imageUrl: l.image_urls[0],
    type: l.types,
    typeLabel: l.types.join(', '),
    createdAt: l.created_at,
  }));
};

type ForumJoinRow = {
  id: string;
  title: string;
  created_at: string;
  author: { name: string } | null;
};

const listForums = async (): Promise<AdminForum[]> => {
  const { data, error } = await supabase
    .from('forum_questions')
    .select('id, title, created_at, author:profiles!forum_questions_user_id_fkey(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as ForumJoinRow[]).map((f) => ({
    id: f.id,
    title: f.title,
    authorName: f.author?.name,
    createdAt: f.created_at,
  }));
};

export const listAdminItems = async (category: AdminCategory): Promise<AdminItem[]> => {
  switch (category) {
    case 'users':
      return listUsers();
    case 'mentors':
      return listMentors();
    case 'posts':
      return listPosts();
    case 'locations':
      return listLocations();
    case 'forums':
      return listForums();
  }
};

// Ordena en cliente por un campo de texto o fecha.
export const sortAdminItems = <T extends AdminItem>(items: T[], field: string, order: 'asc' | 'desc'): T[] => {
  const dir = order === 'asc' ? 1 : -1;
  const key = field === 'type' ? 'typeLabel' : field;
  return [...items].sort((a, b) => {
    const av = (a as unknown as Record<string, string | undefined>)[key] ?? '';
    const bv = (b as unknown as Record<string, string | undefined>)[key] ?? '';
    return String(av).localeCompare(String(bv), 'es', { sensitivity: 'base' }) * dir;
  });
};

// Eliminar un elemento. Usuarios: función admin_delete_user. Mentores: solo se quita el
// rol de mentor (el usuario sigue existiendo). El resto: delete bajo la política de admin.
export const deleteAdminItem = async (category: AdminCategory, id: string): Promise<void> => {
  if (category === 'users') {
    const { error } = await supabase.rpc('admin_delete_user', { p_user_id: id });
    if (error) throw error;
    return;
  }
  if (category === 'mentors') {
    const { error } = await supabase.from('mentors').delete().eq('user_id', id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from(TABLE_BY_CATEGORY[category]).delete().eq('id', id);
  if (error) throw error;
};

// Candidatos a mentor: usuarios que aún no lo son.
export const listMentorCandidates = async (): Promise<AdminUser[]> => {
  const users = await listUsers();
  return users.filter((u) => !u.isMentor);
};

export const addMentor = async (userId: string, topics: string[]): Promise<void> => {
  const { error } = await supabase.from('mentors').insert({ user_id: userId, topics });
  if (error) throw error;
};

// Datos editables de un usuario o mentor para la pantalla de edición.
export const getEditableItem = async (
  category: 'users' | 'mentors',
  id: string
): Promise<{ name: string; areas: string[] }> => {
  const { data: profile, error } = await supabase.from('profiles').select('name').eq('id', id).maybeSingle();
  if (error) throw error;
  let areas: string[] = [];
  if (category === 'mentors') {
    const { data: mentor, error: mentorError } = await supabase
      .from('mentors')
      .select('topics')
      .eq('user_id', id)
      .maybeSingle();
    if (mentorError) throw mentorError;
    areas = mentor?.topics ?? [];
  }
  return { name: profile?.name ?? '', areas };
};

export const updateEditableItem = async (
  category: 'users' | 'mentors',
  id: string,
  data: { name: string; areas?: string[] }
): Promise<void> => {
  const { error } = await supabase.from('profiles').update({ name: data.name }).eq('id', id);
  if (error) throw error;
  if (category === 'mentors' && data.areas) {
    const { error: mentorError } = await supabase.from('mentors').update({ topics: data.areas }).eq('user_id', id);
    if (mentorError) throw mentorError;
  }
};
