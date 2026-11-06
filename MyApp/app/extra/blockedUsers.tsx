import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useUser } from '../../context/UserContext';
import MaxWidthContainer from '../../components/MaxWidthContainer';
import { BlockedUser, listBlockedUsers, unblockUser } from '../../services/moderationService';

export default function BlockedUsersScreen() {
  const { user } = useUser();
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      setBlocked(await listBlockedUsers(user.id));
    } catch (error) {
      console.error('Error al cargar usuarios bloqueados:', error);
      Alert.alert('Error', 'No se pudo cargar la lista de usuarios bloqueados.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const confirmUnblock = (item: BlockedUser) => {
    Alert.alert('Desbloquear usuario', `¿Quieres volver a ver el contenido de ${item.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desbloquear',
        onPress: async () => {
          if (!user?.id) return;
          try {
            await unblockUser(user.id, item.id);
            setBlocked((prev) => prev.filter((b) => b.id !== item.id));
          } catch {
            Alert.alert('Error', 'No se pudo desbloquear al usuario. Intenta de nuevo.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#bb86fc" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MaxWidthContainer>
        <FlatList
          data={blocked}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No has bloqueado a nadie.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Image
                source={item.photoUrl ? { uri: item.photoUrl } : require('../../assets/images/img7.jpg')}
                style={styles.avatar}
                cachePolicy="memory-disk"
                transition={200}
              />
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <TouchableOpacity style={styles.button} onPress={() => confirmUnblock(item)}>
                <Text style={styles.buttonText}>Desbloquear</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </MaxWidthContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40, fontSize: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: '#555' },
  name: { flex: 1, color: '#fff', fontSize: 16, fontWeight: 'bold' },
  button: { backgroundColor: '#2c1a47', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16 },
  buttonText: { color: '#bb86fc', fontWeight: '600' },
});
