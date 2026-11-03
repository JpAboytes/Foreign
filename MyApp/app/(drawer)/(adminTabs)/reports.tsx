import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView, View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useUser } from '../../../context/UserContext';
import {
  listOpenReports, resolveReport, type AdminReport, type ReportTarget,
} from '../../../services/moderationService';

const TARGET_LABELS: Record<ReportTarget, string> = {
  post: 'Publicación',
  comment: 'Comentario',
  forum_question: 'Pregunta del foro',
  forum_answer: 'Respuesta del foro',
  message: 'Mensaje de chat',
  user: 'Usuario',
  map_location: 'Ubicación del mapa',
  raite: 'Raite',
};

export default function ReportesModeracion() {
  const { user } = useUser();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setReports(await listOpenReports());
    } catch (e) {
      console.error('Error al cargar reportes:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onResolve = async (report: AdminReport, status: 'reviewed' | 'dismissed') => {
    if (!user) return;
    setBusyId(report.id);
    try {
      await resolveReport(report.id, user.id, status);
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } catch (e) {
      console.error('Error al actualizar el reporte:', e);
      Alert.alert('Error', 'No se pudo actualizar el reporte. Inténtalo de nuevo.');
    } finally {
      setBusyId(null);
    }
  };

  const renderReport = ({ item }: { item: AdminReport }) => {
    const busy = busyId === item.id;
    return (
      <View style={styles.card}>
        <Text style={styles.type}>{TARGET_LABELS[item.targetType] ?? item.targetType}</Text>
        {item.targetSummary
          ? <Text style={styles.summary}>“{item.targetSummary}”</Text>
          : <Text style={styles.muted}>ID: {item.targetId}</Text>}
        <Text style={styles.reason}>Motivo: {item.reason}</Text>
        <Text style={styles.muted}>
          Reportado por {item.reporterName || 'usuario'} · {new Date(item.createdAt).toLocaleString('es-MX')}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.dismiss, busy && styles.disabled]}
            disabled={busy}
            onPress={() => onResolve(item, 'dismissed')}
          >
            <Text style={styles.dismissText}>Descartar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.review, busy && styles.disabled]}
            disabled={busy}
            onPress={() => onResolve(item, 'reviewed')}
          >
            <Text style={styles.reviewText}>Revisado</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={styles.center} color="#b388ff" size="large" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.emptyText}>No se pudieron cargar los reportes.</Text>
        <TouchableOpacity style={[styles.button, styles.review, styles.retry]} onPress={load}>
          <Text style={styles.reviewText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={reports}
        keyExtractor={(r) => r.id}
        renderItem={renderReport}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={reports.length === 0 ? styles.centerGrow : undefined}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay reportes pendientes.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centerGrow: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  card: { padding: 16, margin: 8, borderRadius: 8, backgroundColor: '#1a1a1a' },
  type: { color: '#b388ff', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  summary: { color: '#fff', fontSize: 16, marginBottom: 6 },
  reason: { color: '#ccc', marginBottom: 4 },
  muted: { color: '#888', fontSize: 12 },
  emptyText: { color: '#666', textAlign: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  button: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, marginLeft: 8 },
  dismiss: { backgroundColor: '#333' },
  dismissText: { color: '#fff' },
  review: { backgroundColor: '#b388ff' },
  reviewText: { color: '#000', fontWeight: 'bold' },
  disabled: { opacity: 0.5 },
  retry: { marginTop: 12 },
});
