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

// ---------------------------------------------------------------------------
// Cola de moderación (panel admin). RLS solo deja leer/actualizar todos los reportes a un admin.
// ---------------------------------------------------------------------------

export type ReportStatus = 'open' | 'reviewed' | 'dismissed';

export interface AdminReport {
  id: string;
  reporterId: string;
  reporterName?: string;
  targetType: ReportTarget;
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  // Resumen del contenido reportado, si es posible obtenerlo (mensajes y raites no se resumen).
  targetSummary?: string;
}

// tabla y columna de texto a mostrar por tipo de objetivo
const SUMMARY_SOURCES: Partial<
  Record<ReportTarget, { table: 'posts' | 'comments' | 'forum_questions' | 'forum_answers' | 'profiles'; column: string }>
> = {
  post: { table: 'posts', column: 'caption' },
  comment: { table: 'comments', column: 'text' },
  forum_question: { table: 'forum_questions', column: 'title' },
  forum_answer: { table: 'forum_answers', column: 'content' },
  user: { table: 'profiles', column: 'name' },
};

const SUMMARY_MAX = 140;

const truncate = (text: string): string => (text.length > SUMMARY_MAX ? `${text.slice(0, SUMMARY_MAX)}…` : text);

// Resúmenes por tipo; si una consulta falla o el contenido ya no existe, simplemente no hay resumen.
const fetchSummaries = async (rows: { target_type: ReportTarget; target_id: string }[]) => {
  const summaries = new Map<string, string>();
  await Promise.all(
    (Object.keys(SUMMARY_SOURCES) as ReportTarget[]).map(async (type) => {
      const source = SUMMARY_SOURCES[type];
      const ids = [...new Set(rows.filter((r) => r.target_type === type).map((r) => r.target_id))];
      if (!source || ids.length === 0) return;
      const { data, error } = await supabase.from(source.table).select(`id, ${source.column}`).in('id', ids);
      if (error || !data) return;
      for (const row of data as any[]) {
        const value = row[source.column];
        if (typeof value === 'string' && value.trim()) summaries.set(`${type}:${row.id}`, truncate(value.trim()));
      }
    })
  );
  return summaries;
};

// Reportes abiertos, los más antiguos primero (SLA de 24 h).
export const listOpenReports = async (limit = 100): Promise<AdminReport[]> => {
  const { data, error } = await supabase
    .from('reports')
    .select('id, reporter_id, target_type, target_id, reason, status, created_at')
    .eq('status', 'open')
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  const rows = (data ?? []) as any[];
  if (rows.length === 0) return [];

  const reporterIds = [...new Set(rows.map((r) => r.reporter_id as string))];
  const [summaries, reporters] = await Promise.all([
    fetchSummaries(rows),
    supabase.from('profiles').select('id, name').in('id', reporterIds),
  ]);
  const names = new Map<string, string>(((reporters.data ?? []) as any[]).map((p) => [p.id, p.name]));

  return rows.map((r) => ({
    id: r.id,
    reporterId: r.reporter_id,
    reporterName: names.get(r.reporter_id) || undefined,
    targetType: r.target_type,
    targetId: r.target_id,
    reason: r.reason,
    status: r.status,
    createdAt: r.created_at,
    targetSummary: summaries.get(`${r.target_type}:${r.target_id}`),
  }));
};

// Marca un reporte como revisado o descartado (solo el admin puede, por RLS).
export const resolveReport = async (
  reportId: string,
  reviewerId: string,
  status: Exclude<ReportStatus, 'open'>
): Promise<void> => {
  const { error } = await supabase
    .from('reports')
    .update({ status, reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
    .eq('id', reportId)
    .eq('status', 'open');
  if (error) throw error;
};
