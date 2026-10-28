import { supabase } from './supabase/client';

// Interfaces
export interface Comment {
  id?: string;
  text: string;
  created_at: any;
  user: {
    id: string;
    name: string;
    image: any;
  };
}

type CommentRow = {
  id: string;
  text: string;
  created_at: string;
  author: { id: string; name: string; photo_url: string | null };
};

const toComment = (row: CommentRow): Comment => ({
  id: row.id,
  text: row.text,
  created_at: row.created_at,
  user: {
    id: row.author.id,
    name: row.author.name || 'Usuario',
    image: row.author.photo_url ? { uri: row.author.photo_url } : require('../assets/images/img7.jpg'),
  },
});

const COMMENT_SELECT = 'id, text, created_at, author:profiles!comments_user_id_fkey!inner(id, name, photo_url)';

// Obtener comentarios de una publicación
export const getPostComments = async (postId: string): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select(COMMENT_SELECT)
    .eq('post_id', postId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error(`Error getting comments for post ${postId}:`, error);
    throw error;
  }
  return (data as unknown as CommentRow[]).map(toComment);
};

// Añadir un comentario. La notificación al autor del post la crea un trigger.
export const addComment = async (
  postId: string,
  comment: Omit<Comment, 'id' | 'created_at'>
): Promise<string> => {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: comment.user.id, text: comment.text })
    .select('id')
    .single();
  if (error) {
    console.error(`Error adding comment to post ${postId}:`, error);
    throw error;
  }
  return data.id;
};

// Eliminar un comentario (RLS: solo el autor o un admin)
export const deleteComment = async (_postId: string, commentId: string): Promise<void> => {
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) {
    console.error(`Error deleting comment ${commentId}:`, error);
    throw error;
  }
};
