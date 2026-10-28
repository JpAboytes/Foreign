import { supabase } from './supabase/client';
import { uploadImageToSupabase } from './imageService';

// Interfaces
export interface Post {
  id: string;
  image: string;
  content: string;
  caption?: string;
  createdAt: any;
  userId: string;
  user?: {
    id: string;
    name: string;
    image: any;
    university?: string;
  };
  likes?: { [userId: string]: boolean };
  likeCount?: number;
  comments?: any[];
}

export interface PostInput {
  image: string;
  caption: string;
  userId: string;
}

const FEED_LIMIT = 100;

// Post con su autor y sus likes en una sola consulta.
const POST_SELECT =
  'id, user_id, image_url, caption, created_at, author:profiles!posts_user_id_fkey!inner(id, name, photo_url, university), post_likes(user_id)';

type PostRow = {
  id: string;
  user_id: string;
  image_url: string | null;
  caption: string;
  created_at: string;
  author: { id: string; name: string; photo_url: string | null; university: string | null };
  post_likes: { user_id: string }[];
};

const toPost = (row: PostRow): Post => {
  const likes = Object.fromEntries(row.post_likes.map((like) => [like.user_id, true]));
  return {
    id: row.id,
    image: row.image_url ?? '',
    content: row.caption,
    caption: row.caption,
    createdAt: row.created_at,
    userId: row.user_id,
    user: {
      id: row.author.id,
      name: row.author.name || 'Usuario sin nombre',
      image: row.author.photo_url ? { uri: row.author.photo_url } : require('../assets/images/img7.jpg'),
      university: row.author.university ?? undefined,
    },
    likes,
    likeCount: row.post_likes.length,
  };
};

const runPostQuery = async (
  build: (q: ReturnType<typeof basePostQuery>) => ReturnType<typeof basePostQuery>
): Promise<Post[]> => {
  const { data, error } = await build(basePostQuery());
  if (error) throw error;
  return (data as unknown as PostRow[]).map(toPost);
};

const basePostQuery = () =>
  supabase.from('posts').select(POST_SELECT).order('created_at', { ascending: false }).limit(FEED_LIMIT);

// Obtener publicaciones con datos de usuario (las más recientes)
export const getPostsWithUserData = async (): Promise<Post[]> => {
  try {
    return await runPostQuery((q) => q);
  } catch (error) {
    console.error('Error getting posts with user data:', error);
    throw error;
  }
};

export const getAllPosts = getPostsWithUserData;

// Publicaciones de autores de una universidad
export const getPostsByUniversity = async (university: string): Promise<Post[]> => {
  try {
    return await runPostQuery((q) => q.eq('author.university', university));
  } catch (error) {
    console.error(`Error getting posts for university ${university}:`, error);
    throw error;
  }
};

// Publicaciones de una lista de usuarios (amigos)
export const getPostsByFriends = async (friendIds: string[]): Promise<Post[]> => {
  if (!friendIds.length) return [];
  try {
    return await runPostQuery((q) => q.in('user_id', friendIds));
  } catch (error) {
    console.error('Error getting friends posts:', error);
    throw error;
  }
};

// Publicaciones de un usuario
export const getPostsByUser = async (userId: string): Promise<Post[]> => {
  try {
    return await runPostQuery((q) => q.eq('user_id', userId));
  } catch (error) {
    console.error(`Error getting posts for user ${userId}:`, error);
    throw error;
  }
};

// Subir la imagen de una publicación a la carpeta del usuario
export const uploadPostImage = async (imageUri: string, userId: string): Promise<string> => {
  const path = `${userId}/${Date.now()}.jpg`;
  return await uploadImageToSupabase(imageUri, 'post-images', path, { width: 1200, quality: 0.8 });
};

// Guardar una publicación con una imagen ya subida
export const createPostRecord = async (
  userId: string,
  caption: string,
  imageUrl: string
): Promise<string> => {
  const { data, error } = await supabase
    .from('posts')
    .insert({ user_id: userId, caption, image_url: imageUrl })
    .select('id')
    .single();
  if (error) {
    console.error('Error creating post:', error);
    throw error;
  }
  return data.id;
};

// Crear una nueva publicación (sube la imagen y guarda el post)
export const createPost = async (postData: PostInput, imageUri: string): Promise<string> => {
  const imageUrl = await uploadPostImage(imageUri, postData.userId);
  return await createPostRecord(postData.userId, postData.caption, imageUrl);
};

// Dar o quitar like. La notificación al autor la crea un trigger en la base de datos.
export const togglePostLike = async (
  postId: string,
  userId: string,
  isLiked: boolean
): Promise<void> => {
  const { error } = isLiked
    ? await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
    : await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
  if (error) {
    console.error(`Error toggling like for post ${postId}:`, error);
    throw error;
  }
};

// Eliminar una publicación (RLS: solo el autor o un admin)
export const deletePost = async (postId: string): Promise<void> => {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) {
    console.error(`Error deleting post ${postId}:`, error);
    throw error;
  }
};
