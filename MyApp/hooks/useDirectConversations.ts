import { useState, useEffect, useCallback } from 'react';
import { subscribeToDirectConversations, DirectConversation } from '../services/chatService';

/**
 * Conversaciones directas en tiempo real. `userId` null/undefined = sin sesión (no carga).
 * `reload` vuelve a suscribirse y muestra el estado de carga.
 */
export function useDirectConversations(userId?: string | null, authLoading = false) {
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) {
      if (!authLoading) setLoading(false);
      return;
    }
    return subscribeToDirectConversations(
      userId,
      (list) => {
        setConversations(list);
        setError(null);
        setLoading(false);
      },
      () => {
        setError('No pudimos cargar tus conversaciones.');
        setLoading(false);
      }
    );
  }, [userId, authLoading, attempt]);

  const reload = useCallback(() => {
    setError(null);
    setLoading(true);
    setAttempt((n) => n + 1);
  }, []);

  return { conversations, loading, error, reload };
}
