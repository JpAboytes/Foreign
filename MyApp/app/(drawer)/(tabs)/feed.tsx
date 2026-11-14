import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  SafeAreaView,
  RefreshControl,
  Platform,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { useUser } from '../../../context/UserContext';
import MaxWidthContainer from '../../../components/MaxWidthContainer';
import FriendsSlider from '../../../components/feed/FriendsSlider';
import PostDetailModal from '../../../components/feed/PostDetailModal';
import ErrorState from '../../../components/common/ErrorState';
import EmptyState from '../../../components/common/EmptyState';
import { usePosts } from '../../../hooks/usePosts';
import { useComments } from '../../../hooks/useComments';
import { Post } from '../../../services/postService';

const { width } = Dimensions.get('window');
const numColumns = Platform.OS === 'web' ? 4 : 2;

export default function FeedScreen() {
  const router = useRouter();
  const { user, userProfile: currentUserData } = useUser();
  const currentUserId = user?.id ?? '';
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Custom hooks para posts y comentarios
  const {
    universityPosts,
    friendPosts,
    refreshing,
    loading,
    error,
    reload,
    selectedPost,
    isLiked,
    setSelectedPost,
    fetchPosts,
    refreshPosts,
    handleToggleLike,
    handleDeletePost,
    handleAuthorBlocked
  } = usePosts(currentUserData);

  const {
    comments,
    newComment,
    loading: loadingComments,
    setNewComment,
    handleAddComment
  } = useComments(selectedPost?.id || null, currentUserData);

  

  // Manejar teclado
  useEffect(() => {
    const Keyboard = require('react-native').Keyboard;
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Cargar posts cuando el componente obtiene foco
  useFocusEffect(
    useCallback(() => {
      if (currentUserData) {
        fetchPosts();
      }
    }, [currentUserData, fetchPosts])
  );

  // Ir al detalle del post
  const goToPostDetail = (post: Post) => {
    setSelectedPost(post);
  };

  // Cerrar modal
  const closeModal = () => {
    setSelectedPost(null);
  };

  // Ir a la pantalla de crear post
  const goToCreatePost = () => {
    router.push({ pathname: '/extra/createPost' });
  };

  // Renderizar cada post
  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity style={styles.postCard} onPress={() => goToPostDetail(item)}>
      <Image cachePolicy="memory-disk" transition={200}
        source={
          typeof item.image === 'string'
            ? { uri: item.image } 
            : item.image
        }
        style={styles.postImage}
        contentFit="cover"
      />
      <View style={styles.postOverlay}>
        <View style={styles.postUserInfo}>
          <Image cachePolicy="memory-disk" transition={200}
            source={item.user?.image || require('../../../assets/images/img7.jpg')}
            style={styles.postUserImage}
          />
          <Text style={styles.postUserName}>{item.user?.name || 'Usuario'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <MaxWidthContainer>
        {loading ? (
          <View style={styles.centered} testID="feed-loading">
            <ActivityIndicator size="large" color="#bb86fc" />
          </View>
        ) : error && universityPosts.length === 0 && friendPosts.length === 0 ? (
          <View style={styles.centered} testID="feed-error">
            <ErrorState message={error} onRetry={reload} />
          </View>
        ) : (
        <FlatList
          data={universityPosts}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          columnWrapperStyle={styles.postRow}
          renderItem={renderPost}
          ListHeaderComponent={
            <FriendsSlider 
              friendPosts={friendPosts} 
              onPressItem={goToPostDetail} 
            />
          }
          ListEmptyComponent={
            <EmptyState
              testID="feed-empty"
              icon="images-outline"
              message="Aún no hay publicaciones de tu universidad."
            />
          }
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshPosts} />
          }
        />
        )}
  
        {/* Post Detail Modal */}
        <PostDetailModal
          post={selectedPost}
          isVisible={!!selectedPost}
          onClose={closeModal}
          onToggleLike={handleToggleLike}
          onDeletePost={handleDeletePost}
          onAuthorBlocked={handleAuthorBlocked}
          isLiked={isLiked}
          comments={comments}
          newComment={newComment}
          setNewComment={setNewComment}
          onAddComment={() => handleAddComment(selectedPost?.userId)}
          loadingComments={loadingComments}
          currentUserId={currentUserId}
        />
  
        {/* FAB para crear post */}
        {!isKeyboardVisible && (
          <TouchableOpacity testID="feed-create-post" style={styles.fab} onPress={goToCreatePost}>
            <Text style={styles.fabText}>＋</Text>
          </TouchableOpacity>
        )}
      </MaxWidthContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212' 
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'web' ? 80 : 16,
  },
  postRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  postCard: {
    flex: 1,
    margin: 8,
    maxWidth: Platform.OS === 'web' ? '23%' : '48%',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  postImage: { 
    width: '100%', 
    height: 140 
  },
  postOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  postUserInfo: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  postUserImage: { 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    marginRight: 6 
  },
  postUserName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#4f0c2e',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  fabText: {
    color: 'white',
    fontSize: 32,
    lineHeight: 34,
  },
});