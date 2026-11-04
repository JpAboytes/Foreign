import { useCallback } from 'react';
import { Alert } from 'react-native';
import { blockUser, reportContent, REPORT_REASONS, ReportTarget } from '../services/moderationService';

// Flujo compartido de reportar / bloquear (Apple 1.2 y UGC de Google Play).
export function useModeration(currentUserId: string | null | undefined) {
  const openReportMenu = useCallback(
    (targetType: ReportTarget, targetId: string, title: string) => {
      if (!currentUserId) return;
      const send = async (reason: string) => {
        try {
          await reportContent(currentUserId, targetType, targetId, reason);
          Alert.alert('Reporte enviado', 'Gracias. Lo revisaremos pronto.');
        } catch {
          Alert.alert('Error', 'No se pudo enviar el reporte. Intenta de nuevo.');
        }
      };
      Alert.alert(title, 'Elige el motivo', [
        ...REPORT_REASONS.map((reason) => ({ text: reason, onPress: () => send(reason) })),
        { text: 'Cancelar', style: 'cancel' as const },
      ]);
    },
    [currentUserId]
  );

  const confirmBlock = useCallback(
    (blockedId: string, name: string | undefined, onBlocked?: (blockedId: string) => void) => {
      if (!currentUserId) return;
      Alert.alert('Bloquear usuario', `No verás más el contenido de ${name || 'este usuario'}.`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(currentUserId, blockedId);
              onBlocked?.(blockedId);
            } catch {
              Alert.alert('Error', 'No se pudo bloquear al usuario. Intenta de nuevo.');
            }
          },
        },
      ]);
    },
    [currentUserId]
  );

  return { openReportMenu, confirmBlock };
}
