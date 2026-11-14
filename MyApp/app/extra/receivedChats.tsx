import React from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Text 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useChats } from '../../hooks/useChats';
import { useAuth } from '../../hooks/useAuth';
import ChatSessionCard from '../../components/mentor/ChatSessionCard';
import { excludeBlocked } from '../../services/moderationService';
import { useBlockedIds } from '../../hooks/useBlockedIds';
import { ChatSession } from '../../services/mentorService';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

export default function ReceivedChatsScreen() {
  const router = useRouter();
  const [{ user }] = useAuth();
  const userId = user?.id ?? '';
  const { blockedIds } = useBlockedIds(userId);
  
  const { 
    chatSessions, 
    loading, 
    error,
    reload,
    setActiveSession 
  } = useChats(userId, true);
  
  const handleSelectSession = (session: ChatSession) => {
    setActiveSession(session);
    router.push({
      pathname: '/extra/chatDetail',
      params: { sessionId: session.id }
    });
  };
  
  const visibleSessions = excludeBlocked(chatSessions, blockedIds, (s) => s.studentId);

  if (loading.sessions) {
    return (
      <View style={[styles.container, styles.centerContent]} testID="receivedChats-loading">
        <ActivityIndicator size="large" color="#bb86fc" />
        <Text style={styles.loadingText}>Cargando conversaciones...</Text>
      </View>
    );
  }
  
  if (error && chatSessions.length === 0) {
    return (
      <View style={styles.container} testID="receivedChats-error">
        <ErrorState message={error} onRetry={reload} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={visibleSessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatSessionCard
            session={item}
            isMentor={true}
            onPress={handleSelectSession}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            testID="receivedChats-empty"
            icon="chatbubbles-outline"
            message="Aún no tienes chats recibidos."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
});
