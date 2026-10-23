import { supabase } from './supabase/client';

export interface ForumUser {
  id: string;
  name: string;
  photo: string;
}

export interface ForumQuestion {
  id: string;
  title: string;
  timestamp: any;
  user: ForumUser;
  answerCount?: number;
}

export interface ForumAnswer {
  id: string;
  questionId: string;
  userId: string;
  content: string;
  timestamp: any;
  user: ForumUser;
  likes: number;
  likedByMe: boolean;
  commentCount: number;
}

export interface ForumComment {
  id: string;
  content: string;
  timestamp: any;
  user: ForumUser;
  likes: number;
}

type AuthorRow = { id: string; name: string; photo_url: string | null };

const toForumUser = (author: AuthorRow): ForumUser => ({
  id: author.id,
  name: author.name || 'Usuario sin nombre',
  photo: author.photo_url ?? '',
});

const QUESTION_SELECT =
  'id, title, created_at, author:profiles!forum_questions_user_id_fkey!inner(id, name, photo_url), forum_answers(count)';

type QuestionRow = {
  id: string;
  title: string;
  created_at: string;
  author: AuthorRow;
  forum_answers: { count: number }[];
};

const toQuestion = (row: QuestionRow): ForumQuestion => ({
  id: row.id,
  title: row.title,
  timestamp: row.created_at,
  user: toForumUser(row.author),
  answerCount: row.forum_answers[0]?.count ?? 0,
});

const ANSWER_SELECT =
  'id, question_id, user_id, content, created_at, author:profiles!forum_answers_user_id_fkey!inner(id, name, photo_url), forum_answer_likes(user_id), forum_answer_comments(count)';

type AnswerRow = {
  id: string;
  question_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author: AuthorRow;
  forum_answer_likes: { user_id: string }[];
  forum_answer_comments: { count: number }[];
};

const toAnswer = (row: AnswerRow, currentUserId?: string): ForumAnswer => ({
  id: row.id,
  questionId: row.question_id,
  userId: row.user_id,
  content: row.content,
  timestamp: row.created_at,
  user: toForumUser(row.author),
  likes: row.forum_answer_likes.length,
  likedByMe: !!currentUserId && row.forum_answer_likes.some((like) => like.user_id === currentUserId),
  commentCount: row.forum_answer_comments[0]?.count ?? 0,
});

// Preguntas más recientes con su conteo de respuestas
export const getQuestions = async (): Promise<ForumQuestion[]> => {
  const { data, error } = await supabase
    .from('forum_questions')
    .select(QUESTION_SELECT)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as unknown as QuestionRow[]).map(toQuestion);
};

// Crear una nueva pregunta
export const createQuestion = async (questionText: string, userId: string): Promise<string> => {
  const { data, error } = await supabase
    .from('forum_questions')
    .insert({ title: questionText.trim(), user_id: userId })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
};

// Obtener detalle de pregunta
export const getQuestionDetail = async (questionId: string): Promise<ForumQuestion | null> => {
  const { data, error } = await supabase
    .from('forum_questions')
    .select(QUESTION_SELECT)
    .eq('id', questionId)
    .maybeSingle();
  if (error) throw error;
  return data ? toQuestion(data as unknown as QuestionRow) : null;
};

// Respuestas de una pregunta (más recientes primero)
export const getAnswers = async (questionId: string, currentUserId?: string): Promise<ForumAnswer[]> => {
  const { data, error } = await supabase
    .from('forum_answers')
    .select(ANSWER_SELECT)
    .eq('question_id', questionId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as AnswerRow[]).map((row) => toAnswer(row, currentUserId));
};

// Una respuesta
export const getAnswer = async (answerId: string, currentUserId?: string): Promise<ForumAnswer | null> => {
  const { data, error } = await supabase
    .from('forum_answers')
    .select(ANSWER_SELECT)
    .eq('id', answerId)
    .maybeSingle();
  if (error) throw error;
  return data ? toAnswer(data as unknown as AnswerRow, currentUserId) : null;
};

// Crear una respuesta. La notificación al autor de la pregunta la crea un trigger.
export const createAnswer = async (questionId: string, answerText: string, userId: string): Promise<string> => {
  const { data, error } = await supabase
    .from('forum_answers')
    .insert({ question_id: questionId, content: answerText.trim(), user_id: userId })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
};

// Dar o quitar like a una respuesta. La notificación la crea un trigger.
export const toggleAnswerLike = async (answerId: string, userId: string, isLiked: boolean): Promise<void> => {
  const { error } = isLiked
    ? await supabase.from('forum_answer_likes').delete().eq('answer_id', answerId).eq('user_id', userId)
    : await supabase.from('forum_answer_likes').insert({ answer_id: answerId, user_id: userId });
  if (error) throw error;
};

// Comentarios de una respuesta (más recientes primero)
export const getAnswerComments = async (answerId: string): Promise<ForumComment[]> => {
  const { data, error } = await supabase
    .from('forum_answer_comments')
    .select('id, content, created_at, author:profiles!forum_answer_comments_user_id_fkey!inner(id, name, photo_url)')
    .eq('answer_id', answerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as (Omit<ForumComment, 'user' | 'timestamp' | 'likes'> & { created_at: string; author: AuthorRow })[])
    .map((row) => ({
      id: row.id,
      content: row.content,
      timestamp: row.created_at,
      user: toForumUser(row.author),
      likes: 0,
    }));
};

// Comentar una respuesta. La notificación al autor de la respuesta la crea un trigger.
export const addAnswerComment = async (answerId: string, content: string, userId: string): Promise<string> => {
  const { data, error } = await supabase
    .from('forum_answer_comments')
    .insert({ answer_id: answerId, content: content.trim(), user_id: userId })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
};
