import { supabase } from './supabase/client';

// Tipos de contenido que se pueden reportar (coincide con el check de public.reports).
export type ReportTarget =
  | 'post'
  | 'comment'
  | 'forum_question'
  | 'forum_answer'
  | 'message'
  | 'user'
  | 'map_location'
  | 'raite';

export const REPORT_REASONS = [
  'Spam o publicidad',
  'Acoso o discurso de odio',
  'Contenido sexual o violento',
  'Información falsa',
  'Otro',
] as const;

// Reportar contenido o a un usuario; el admin lo revisa en la cola de moderación.
export const reportContent = async (
  reporterId: string,
  targetType: ReportTarget,
  targetId: string,
  reason: string
): Promise<void> => {
  const text = reason.trim().slice(0, 1000);
  if (!text) throw new Error('Indica el motivo del reporte');
  const { error } = await supabase
    .from('reports')
    .insert({ reporter_id: reporterId, target_type: targetType, target_id: targetId, reason: text });
  if (error) throw error;
};

export const blockUser = async (blockerId: string, blockedId: string): Promise<void> => {
  if (blockerId === blockedId) throw new Error('No puedes bloquearte a ti mismo');
  const { error } = await supabase.from('blocks').insert({ blocker_id: blockerId, blocked_id: blockedId });
  // 23505: ya estaba bloqueado
  if (error && error.code !== '23505') throw error;
};

export const unblockUser = async (blockerId: string, blockedId: string): Promise<void> => {
  const { error } = await supabase.from('blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId);
  if (error) throw error;
};

// Ids de usuarios que `userId` bloqueó (para ocultar su contenido).
export const getBlockedIds = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.blocked_id);
};
