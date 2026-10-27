import { uploadProfileImage } from './imageService';
import { UserProfile, getUserProfile, createOrUpdateUserProfile } from './userService';
import { Post, getPostsByUser } from './postService';
import { supabase } from './supabase/client';

// Interfaces
export interface FollowStatus {
  isFriend: boolean;
  isPending: boolean;
  isRequested: boolean;
}

// Obtener perfil completo de usuario
export const getUserProfileById = async (userId: string): Promise<UserProfile | null> => {
  return await getUserProfile(userId);
};

// Actualizar perfil de usuario
export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  await createOrUpdateUserProfile(userId, updates);
};

// Actualizar foto de perfil
export const updateProfilePhoto = async (
  userId: string,
  imageUri: string
): Promise<string> => {
  try {
    const photoURL = await uploadProfileImage(imageUri, userId);
    await createOrUpdateUserProfile(userId, { photo: photoURL });
    return photoURL;
  } catch (error) {
    console.error('Error actualizando foto de perfil:', error);
    throw error;
  }
};

// Obtener publicaciones del usuario
export const getUserPosts = async (userId: string): Promise<Post[]> => {
  return await getPostsByUser(userId);
};

// IDs de los amigos (solicitudes aceptadas en cualquier dirección)
export const getFriendIds = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  if (error) {
    console.error('Error obteniendo amigos:', error);
    throw error;
  }
  return data.map((f) => (f.requester_id === userId ? f.addressee_id : f.requester_id));
};

// Verificar estado de amistad.
// isPending: yo envié la solicitud y sigue pendiente. isRequested: el otro me envió una solicitud.
export const checkFriendshipStatus = async (
  currentUserId: string,
  targetUserId: string
): Promise<FollowStatus> => {
  const { data, error } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id, status')
    .or(
      `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),` +
        `and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`
    );
  if (error) {
    console.error('Error verificando estado de amistad:', error);
    throw error;
  }
  const rows = data ?? [];
  return {
    isFriend: rows.some((f) => f.status === 'accepted'),
    isPending: rows.some((f) => f.status === 'pending' && f.requester_id === currentUserId),
    isRequested: rows.some((f) => f.status === 'pending' && f.requester_id === targetUserId),
  };
};

// Enviar solicitud de amistad. La notificación al destinatario la crea el trigger
// notify_friend_request en la base de datos.
export const sendFriendRequest = async (
  currentUserId: string,
  targetUserId: string
): Promise<void> => {
  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: currentUserId, addressee_id: targetUserId, status: 'pending' });
  if (error) {
    console.error('Error enviando solicitud de amistad:', error);
    throw error;
  }
};

// Aceptar solicitud de amistad (la notificación al solicitante la crea el trigger).
export const acceptFriendRequest = async (
  currentUserId: string,
  requesterId: string
): Promise<void> => {
  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('requester_id', requesterId)
    .eq('addressee_id', currentUserId)
    .eq('status', 'pending')
    .select('id');
  if (error) {
    console.error('Error aceptando solicitud de amistad:', error);
    throw error;
  }
  if (!data || data.length === 0) {
    throw new Error('No hay una solicitud pendiente de este usuario.');
  }
};

// Rechazar solicitud de amistad
export const rejectFriendRequest = async (
  currentUserId: string,
  requesterId: string
): Promise<void> => {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('requester_id', requesterId)
    .eq('addressee_id', currentUserId)
    .eq('status', 'pending');
  if (error) {
    console.error('Error rechazando solicitud de amistad:', error);
    throw error;
  }
};

// Eliminar amigo (la amistad puede haberse creado en cualquier dirección)
export const removeFriend = async (
  currentUserId: string,
  friendId: string
): Promise<void> => {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(
      `and(requester_id.eq.${currentUserId},addressee_id.eq.${friendId}),` +
        `and(requester_id.eq.${friendId},addressee_id.eq.${currentUserId})`
    );
  if (error) {
    console.error('Error eliminando amigo:', error);
    throw error;
  }
};

export interface FriendSearchUser {
  id: string;
  name?: string;
  photo?: string;
}

export interface FriendSearchOverview {
  users: FriendSearchUser[];
  friends: string[];
  // Usuarios que me enviaron solicitud y espero aceptar o rechazar.
  pendingRequests: string[];
  // Usuarios a los que ya les envié solicitud.
  sentRequests: string[];
}

// Datos de la pantalla "Buscar amigos": todos los perfiles menos el propio y el estado de amistad.
export const getFriendSearchOverview = async (userId: string): Promise<FriendSearchOverview> => {
  const [profilesResult, friendshipsResult] = await Promise.all([
    supabase.from('profiles').select('id, name, photo_url').neq('id', userId).order('name'),
    supabase
      .from('friendships')
      .select('requester_id, addressee_id, status')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
  ]);
  if (profilesResult.error) {
    console.error('Error obteniendo usuarios:', profilesResult.error);
    throw profilesResult.error;
  }
  if (friendshipsResult.error) {
    console.error('Error obteniendo amistades:', friendshipsResult.error);
    throw friendshipsResult.error;
  }

  const friends: string[] = [];
  const pendingRequests: string[] = [];
  const sentRequests: string[] = [];
  for (const f of friendshipsResult.data ?? []) {
    const otherId = f.requester_id === userId ? f.addressee_id : f.requester_id;
    if (f.status === 'accepted') friends.push(otherId);
    else if (f.requester_id === userId) sentRequests.push(otherId);
    else pendingRequests.push(otherId);
  }

  return {
    users: (profilesResult.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      photo: p.photo_url ?? undefined,
    })),
    friends,
    pendingRequests,
    sentRequests,
  };
};
