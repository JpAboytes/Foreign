import { useCallback, useEffect, useState } from 'react';
import { getBlockedIds } from '../services/moderationService';

// Ids de usuarios bloqueados por `userId`; `addBlocked` actualiza la lista al bloquear a alguien.
export function useBlockedIds(userId: string | null | undefined) {
  const [blockedIds, setBlockedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) {
      setBlockedIds([]);
      return;
    }
    let active = true;
    getBlockedIds(userId)
      .then((ids) => active && setBlockedIds(ids))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [userId]);

  const addBlocked = useCallback((id: string) => setBlockedIds((prev) => (prev.includes(id) ? prev : [...prev, id])), []);
  return { blockedIds, addBlocked };
}
