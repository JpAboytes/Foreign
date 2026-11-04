import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useModeration } from '../../hooks/useModeration';
import { ReportTarget } from '../../services/moderationService';

interface ModerationActionsProps {
  currentUserId: string | null | undefined;
  // Autor del contenido (o usuario reportado); no se muestra si es el propio usuario.
  authorId: string | undefined;
  authorName?: string;
  targetType: ReportTarget;
  targetId: string;
  reportTitle: string;
  // Se llama tras bloquear al autor (para ocultar su contenido).
  onBlocked?: (blockedId: string) => void;
  size?: number;
  style?: object;
}

// Iconos de reportar y bloquear, reutilizados en publicaciones, comentarios, foro y perfiles.
export default function ModerationActions({
  currentUserId,
  authorId,
  authorName,
  targetType,
  targetId,
  reportTitle,
  onBlocked,
  size = 22,
  style,
}: ModerationActionsProps) {
  const { openReportMenu, confirmBlock } = useModeration(currentUserId);
  if (!currentUserId || !authorId || authorId === currentUserId) return null;

  return (
    <View style={[styles.row, style]}>
      <TouchableOpacity
        onPress={() => openReportMenu(targetType, targetId, reportTitle)}
        accessibilityLabel={reportTitle}
        hitSlop={8}
      >
        <Ionicons name="flag-outline" size={size} color="#ffb74d" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => confirmBlock(authorId, authorName, onBlocked)}
        accessibilityLabel="Bloquear usuario"
        hitSlop={8}
      >
        <Ionicons name="ban-outline" size={size} color="red" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
});
