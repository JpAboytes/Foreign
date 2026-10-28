import { supabase } from './supabase/client';

export type RaitePoint = { latitude: number; longitude: number };

export interface RaiteRequest {
  requesterId: string;
  requesterName: string;
  from: RaitePoint | null;
  to: RaitePoint;
  status: 'pending' | 'accepted';
  acceptedBy: string | null;
}

const RAITE_SELECT =
  'requester_id, from_lat, from_lng, to_lat, to_lng, status, accepted_by, requester:profiles!raite_requests_requester_id_fkey(name)';

type RaiteRow = {
  requester_id: string;
  from_lat: number | null;
  from_lng: number | null;
  to_lat: number;
  to_lng: number;
  status: 'pending' | 'accepted';
  accepted_by: string | null;
  requester: { name: string } | null;
};

const toRaite = (row: RaiteRow): RaiteRequest => ({
  requesterId: row.requester_id,
  requesterName: row.requester?.name || 'Usuario',
  from: row.from_lat != null && row.from_lng != null ? { latitude: row.from_lat, longitude: row.from_lng } : null,
  to: { latitude: row.to_lat, longitude: row.to_lng },
  status: row.status,
  acceptedBy: row.accepted_by,
});

// Pedir raite a una lista de amigos. Reemplaza la solicitud activa anterior.
// Las notificaciones a cada amigo las crea un trigger en la base de datos.
export const sendRaiteRequest = async (
  userId: string,
  from: RaitePoint | null,
  to: RaitePoint,
  recipientIds: string[]
): Promise<void> => {
  await cancelRaiteRequest(userId);
  const { error } = await supabase.from('raite_requests').insert({
    requester_id: userId,
    from_lat: from?.latitude ?? null,
    from_lng: from?.longitude ?? null,
    to_lat: to.latitude,
    to_lng: to.longitude,
    recipients: recipientIds,
  });
  if (error) throw error;
};

// Cancelar la solicitud propia
export const cancelRaiteRequest = async (userId: string): Promise<void> => {
  const { error } = await supabase.from('raite_requests').delete().eq('requester_id', userId);
  if (error) throw error;
};

// Solicitud de un usuario (RLS: solo si me involucra)
export const getRaiteRequest = async (requesterId: string): Promise<RaiteRequest | null> => {
  const { data, error } = await supabase
    .from('raite_requests')
    .select(RAITE_SELECT)
    .eq('requester_id', requesterId)
    .maybeSingle();
  if (error) throw error;
  return data ? toRaite(data as unknown as RaiteRow) : null;
};

// Aceptar la solicitud de un amigo
export const acceptRaiteRequest = async (requesterId: string): Promise<void> => {
  const { error } = await supabase.rpc('accept_raite', { p_requester_id: requesterId });
  if (error) throw error;
};

// Solicitudes pendientes que me mandaron mis amigos
export const getPendingRaitesForMe = async (userId: string): Promise<RaiteRequest[]> => {
  const { data, error } = await supabase
    .from('raite_requests')
    .select(RAITE_SELECT)
    .eq('status', 'pending')
    .contains('recipients', [userId]);
  if (error) throw error;
  return (data as unknown as RaiteRow[]).map(toRaite);
};

// Escuchar en tiempo real las solicitudes que me mandan. Llama al callback con la lista
// completa cada vez que cambia algo (Realtime respeta RLS: solo llegan las que me involucran).
export const subscribeToRaitesForMe = (
  userId: string,
  callback: (requests: RaiteRequest[]) => void
): (() => void) => {
  const refresh = () => {
    getPendingRaitesForMe(userId)
      .then(callback)
      .catch((error) => console.error('Error obteniendo solicitudes de raite:', error));
  };

  refresh();
  const channel = supabase
    .channel(`raites-for-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'raite_requests' }, refresh)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
