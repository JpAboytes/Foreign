import { useState, useEffect, useCallback } from 'react';
import { getBlockedIds } from '../services/moderationService';
import { getQuestions, createQuestion, ForumQuestion } from '../services/forumService';

export function useForumQuestions(userId?: string | null) {
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestions = useCallback(async () => {
    setError(null);
    try {
      const blockedIds = userId ? await getBlockedIds(userId).catch(() => []) : [];
      setQuestions(await getQuestions(blockedIds));
    } catch (error) {
      console.error('Error al cargar preguntas:', error);
      setError('No pudimos cargar las preguntas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const addQuestion = async (questionText: string, userId: string) => {
    if (!questionText.trim() || !userId) return null;

    try {
      const id = await createQuestion(questionText, userId);
      await loadQuestions();
      return id;
    } catch (error) {
      console.error('Error al crear pregunta:', error);
      return null;
    }
  };

  const reload = () => {
    setLoading(true);
    loadQuestions();
  };

  const refreshQuestions = () => {
    setRefreshing(true);
    loadQuestions();
  };

  return {
    questions,
    loading,
    refreshing,
    error,
    reload,
    addQuestion,
    refreshQuestions
  };
}
