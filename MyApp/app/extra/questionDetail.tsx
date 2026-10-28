import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import { ForumAnswer, ForumQuestion, createAnswer, getAnswers, getQuestionDetail } from '../../services/forumService';
import { formatTimeAgo } from '../../utils/formatters';

export default function QuestionDetailScreen() {
  const router = useRouter();
  const { questionId, scrollToAnswerId } = useLocalSearchParams();
  const [question, setQuestion] = useState<ForumQuestion | null>(null);
  const [answers, setAnswers] = useState<ForumAnswer[]>([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [questionLoading, setQuestionLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useUser();

  const loadAnswers = useCallback(async () => {
    if (!questionId) return;
    try {
      setAnswers(await getAnswers(questionId as string, user?.id));
    } catch (error) {
      console.error('Error al obtener respuestas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [questionId, user?.id]);

  // Obtener la pregunta
  useEffect(() => {
    if (!questionId) return;

    setQuestionLoading(true);
    getQuestionDetail(questionId as string)
      .then(setQuestion)
      .catch((error) => console.error('Error al obtener pregunta:', error))
      .finally(() => setQuestionLoading(false));
  }, [questionId]);

  // Obtener las respuestas (también al volver del detalle de una respuesta)
  useFocusEffect(
    useCallback(() => {
      loadAnswers();
    }, [loadAnswers])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAnswers();
  };

  // La notificación al autor de la pregunta la crea un trigger en la base de datos.
  const sendAnswer = async () => {
    if (!newAnswer.trim() || !user || !questionId) return;

    try {
      await createAnswer(questionId as string, newAnswer, user.id);
      setNewAnswer('');
      await loadAnswers();
    } catch (error) {
      console.error('Error al enviar respuesta:', error);
    }
  };

  const goToAnswerDetail = (answer: ForumAnswer) => {
    router.push({
      pathname: '/extra/answerDetail',
      params: { 
        questionId: questionId as string,
        answerId: answer.id
      }
    });
  };

  // Si necesitas navegar a perfil desde un item:
  const goToUserProfile = (userId: string) => {
    if (userId) {
      router.push(`/extra/friendProfile?uid=${userId}`);
    }
  };

  const renderAvatar = (source: string) => {
    if (source && (source.startsWith('http') || source.startsWith('data:'))) {
      return { uri: source };
    }
    return require('../../assets/images/img7.jpg');
  };

  if (questionLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#bb86fc" />
        <Text style={styles.loadingText}>Cargando pregunta...</Text>
      </View>
    );
  }

  if (!question) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={64} color="#e91e63" />
        <Text style={styles.errorText}>No se encontró la pregunta</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver al foro</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.questionCard}>
        <View style={styles.cardHeader}>
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={() => router.push(`/extra/friendProfile?uid=${question.user?.id}`)}
          >
            <Image 
              source={renderAvatar(question.user?.photo)} 
              style={styles.avatar} 
            />
            <View style={styles.questionUser}>
              <Text style={styles.userName}>{question.user?.name}</Text>
              <Text style={styles.timestamp}>{formatTimeAgo(question.timestamp)}</Text>
            </View>
          </TouchableOpacity>
        </View>
        <Text style={styles.questionTitle}>{question.title}</Text>
      </View>

      <View style={styles.answersHeader}>
        <Text style={styles.answersTitle}>
          Respuestas ({answers.length})
        </Text>
      </View>

      <FlatList
        data={answers}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loader} color="#bb86fc" size="small" />
          ) : (
            <View style={styles.emptyAnswers}>
              <Text style={styles.emptyText}>Aún no hay respuestas</Text>
              <Text style={styles.emptySuggestion}>¡Sé el primero en responder!</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity key={item.id} style={styles.answerCard} onPress={() => goToAnswerDetail(item)}>
            <View style={styles.answerHeader}>
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation(); // Evitar que se active la navegación a la respuesta
                  router.push(`/extra/friendProfile?uid=${item.user?.id}`);
                }}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Image source={renderAvatar(item.user?.photo)} style={styles.avatar} />
                <View>
                  <Text style={styles.userName}>{item.user?.name}</Text>
                  <Text style={styles.timestamp}>{formatTimeAgo(item.timestamp)}</Text>
                </View>
              </TouchableOpacity>
            </View>
            <Text style={styles.answerText}>{item.content}</Text>
            <View style={styles.answerFooter}>
              <View style={styles.statContainer}>
                <Ionicons name="heart-outline" size={18} color="#888" />
                <Text style={styles.statText}>{item.likes || 0}</Text>
              </View>
              <View style={styles.statContainer}>
                <Ionicons name="chatbubble-outline" size={18} color="#888" />
                <Text style={styles.statText}>{item.commentCount || 0}</Text>
                <Text style={styles.commentAction}>Ver comentarios</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe una respuesta..."
          placeholderTextColor="#888"
          value={newAnswer}
          onChangeText={setNewAnswer}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, !newAnswer.trim() && styles.sendButtonDisabled]} 
          onPress={sendAnswer}
          disabled={!newAnswer.trim()}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={newAnswer.trim() ? '#fff' : '#888'} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212' 
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#e91e63',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  questionCard: {
    backgroundColor: '#1e1e1e',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#bb86fc',
  },
  questionUser: {
    justifyContent: 'center',
  },
  questionTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#fff', 
    lineHeight: 28,
  },
  answersHeader: {
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  answersTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  answerCard: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    elevation: 2,
  },
  answerHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  answerMeta: {
    justifyContent: 'center',
  },
  userName: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 15,
  },
  timestamp: { 
    fontSize: 12, 
    color: '#888', 
    marginTop: 2,
  },
  answerText: { 
    color: '#fff', 
    fontSize: 16,
    lineHeight: 24,
  },
  answerFooter: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    color: '#888',
    marginLeft: 6,
    fontSize: 14,
  },
  commentAction: {
    color: '#bb86fc',
    marginLeft: 8,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#bb86fc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
  loader: {
    marginVertical: 20,
  },
  emptyAnswers: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  emptySuggestion: {
    color: '#888',
    fontSize: 14,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
