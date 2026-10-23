import { 
  doc,
  addDoc,
  writeBatch,
  getDoc, 
  updateDoc, 
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { firestore } from './firebase/config';
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

// Verificar estado de amistad
export const checkFriendshipStatus = async (
  currentUserId: string, 
  targetUserId: string
): Promise<FollowStatus> => {
  try {
    // Obtener usuario actual
    const currentUserDoc = await getDoc(doc(firestore, 'users', currentUserId));
    
    // Obtener usuario objetivo
    const targetUserDoc = await getDoc(doc(firestore, 'users', targetUserId));
    
    if (!currentUserDoc.exists() || !targetUserDoc.exists()) {
      throw new Error('Usuario no encontrado');
    }
    
    const currentUserData = currentUserDoc.data();
    const targetUserData = targetUserDoc.data();
    
    const friends = currentUserData.friends || [];
    const pendingRequests = currentUserData.pendingRequests || [];
    const friendRequests = targetUserData.friendRequests || [];
    
    return {
      isFriend: friends.includes(targetUserId),
      isPending: pendingRequests.includes(targetUserId),
      isRequested: friendRequests.includes(currentUserId)
    };
  } catch (error) {
    console.error('Error verificando estado de amistad:', error);
    throw error;
  }
};

// Enviar solicitud de amistad
export const sendFriendRequest = async (
  currentUserId: string, 
  targetUserId: string
): Promise<void> => {
  try {
    // Actualizar pendingRequests del usuario actual
    await updateDoc(doc(firestore, 'users', currentUserId), {
      pendingRequests: arrayUnion(targetUserId)
    });
    
    // Actualizar friendRequests del usuario objetivo
    await updateDoc(doc(firestore, 'users', targetUserId), {
      friendRequests: arrayUnion(currentUserId)
    });
    
    // Crear notificación
    await addDoc(collection(firestore, 'notifications'), {
      type: 'friend_request',
      fromUserId: currentUserId,
      toUserId: targetUserId,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error enviando solicitud de amistad:', error);
    throw error;
  }
};

// Aceptar solicitud de amistad
export const acceptFriendRequest = async (
  currentUserId: string, 
  requesterId: string
): Promise<void> => {
  try {
    // Batch update
    const batch = writeBatch(firestore);
    
    // Actualizar amigos del usuario actual
    const currentUserRef = doc(firestore, 'users', currentUserId);
    batch.update(currentUserRef, {
      friends: arrayUnion(requesterId),
      friendRequests: arrayRemove(requesterId)
    });
    
    // Actualizar amigos del solicitante
    const requesterRef = doc(firestore, 'users', requesterId);
    batch.update(requesterRef, {
      friends: arrayUnion(currentUserId),
      pendingRequests: arrayRemove(currentUserId)
    });
    
    await batch.commit();
    
    // Crear notificación
    await addDoc(collection(firestore, 'notifications'), {
      type: 'friend_accepted',
      fromUserId: currentUserId,
      toUserId: requesterId,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error aceptando solicitud de amistad:', error);
    throw error;
  }
};

// Rechazar solicitud de amistad
export const rejectFriendRequest = async (
  currentUserId: string, 
  requesterId: string
): Promise<void> => {
  try {
    // Actualizar usuario actual
    await updateDoc(doc(firestore, 'users', currentUserId), {
      friendRequests: arrayRemove(requesterId)
    });
    
    // Actualizar solicitante
    await updateDoc(doc(firestore, 'users', requesterId), {
      pendingRequests: arrayRemove(currentUserId)
    });
  } catch (error) {
    console.error('Error rechazando solicitud de amistad:', error);
    throw error;
  }
};

// Eliminar amigo
export const removeFriend = async (
  currentUserId: string, 
  friendId: string
): Promise<void> => {
  try {
    // Batch update
    const batch = writeBatch(firestore);
    
    // Actualizar usuario actual
    const currentUserRef = doc(firestore, 'users', currentUserId);
    batch.update(currentUserRef, {
      friends: arrayRemove(friendId)
    });
    
    // Actualizar amigo
    const friendRef = doc(firestore, 'users', friendId);
    batch.update(friendRef, {
      friends: arrayRemove(currentUserId)
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error eliminando amigo:', error);
    throw error;
  }
};