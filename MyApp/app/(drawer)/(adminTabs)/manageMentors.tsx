import React, { useState, useEffect } from 'react';
import {
  SafeAreaView, View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listAdminItems, type AdminMentor } from '../../../services/adminService';
import { useRouter } from 'expo-router';

type User = AdminMentor;

export default function GestionMentores() {
  const [mentors, setMentors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMentors = async () => {
    setLoading(true);
    try {
      setMentors((await listAdminItems('mentors')) as AdminMentor[]);
    } catch (error) {
      console.error('Error al cargar mentores:', error);
      Alert.alert('Error', 'No se pudieron cargar los mentores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMentors(); }, []);

  const onAdd = () => {
    router.push({ pathname: './addMentor' });
  };

  const renderMentor = ({ item }: { item: User }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.subtitle}>
        {item.areas?.join(', ') || 'Sin áreas asignadas'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading
        ? <ActivityIndicator style={styles.loader} color="#b388ff" size="large"/>
        : <FlatList
            data={mentors}
            keyExtractor={u => u.id}
            renderItem={renderMentor}
            ListEmptyComponent={() => (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No hay mentores aún.</Text>
              </View>
            )}
          />
      }
      <TouchableOpacity style={styles.fab} onPress={onAdd}>
        <Ionicons name="add" size={28} color="#000"/>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    padding: 16, margin: 8, borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  name: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  subtitle: { color: '#ccc', marginTop: 4 },
  empty: { flex:1, justifyContent:'center', alignItems:'center' },
  emptyText: { color: '#666' },
  fab: {
    position: 'absolute', right: 20, bottom: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#b388ff', justifyContent:'center', alignItems:'center'
  },
});