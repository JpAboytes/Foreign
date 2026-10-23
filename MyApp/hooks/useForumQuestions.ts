import { useState, useEffect, useCallback } from 'react';
import { getQuestions, createQuestion, ForumQuestion } from '../services/forumService';

export function useForumQuestions() {
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadQuestions = useCallback(async () => {
    try {
      setQuestions(await getQuestions());
    } catch (error) {
      console.error('Error al cargar preguntas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

  const refreshQuestions = () => {
    setRefreshing(true);
    loadQuestions();
  };

  return {
    questions,
    loading,
    refreshing,
    addQuestion,
    refreshQuestions
  };
}
