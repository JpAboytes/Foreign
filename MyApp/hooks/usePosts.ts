import { useState, useCallback, useEffect } from 'react';
import {
  getPostsByUniversity,
  getPostsByFriends,
  togglePostLike,
  deletePost
} from '../services/postService';
import { getFriendIds } from '../services/profileService';
import { Post } from '../services/postService';
import { UserProfile } from '../services/userService';

// currentUser es siempre el usuario de la sesión (no el perfil que se está viendo).
export function usePosts(currentUser: UserProfile | null) {
  const [universityPosts, setUniversityPosts] = useState<Post[]>([]);
  const [friendPosts, setFriendPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  // Actualizar estado de "isLiked" cuando cambia el post seleccionado
  useEffect(() => {
    if (selectedPost && currentUser?.uid) {
      setIsLiked(!!selectedPost.likes?.[currentUser.uid]);
    }
  }, [selectedPost, currentUser]);

  // Cargar publicaciones de la universidad y de los amigos
  const fetchPosts = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      const [byUniversity, friendIds] = await Promise.all([
        currentUser.university ? getPostsByUniversity(currentUser.university) : Promise.resolve([]),
        getFriendIds(currentUser.uid),
      ]);
      setUniversityPosts(byUniversity);
      setFriendPosts(await getPostsByFriends(friendIds));
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }, [currentUser?.uid, currentUser?.university]);

  // Refrescar publicaciones
  const refreshPosts = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  // Manejar like
  const handleToggleLike = async () => {
    if (!selectedPost || !currentUser?.uid) return;
    const userId = currentUser.uid;

    try {
      await togglePostLike(selectedPost.id, userId, isLiked);

      // Actualizar UI localmente
      setIsLiked(!isLiked);
      setSelectedPost(prev => {
        if (!prev) return prev;

        const updatedLikes = { ...prev.likes };
        if (isLiked) {
          delete updatedLikes[userId];
        } else {
          updatedLikes[userId] = true;
        }

        return {
          ...prev,
          likes: updatedLikes,
          likeCount: Object.keys(updatedLikes).length
        };
      });
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Eliminar publicación
  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      setSelectedPost(null);
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  return {
    universityPosts,
    friendPosts,
    refreshing,
    selectedPost,
    isLiked,
    setSelectedPost,
    fetchPosts,
    refreshPosts,
    handleToggleLike,
    handleDeletePost
  };
}
