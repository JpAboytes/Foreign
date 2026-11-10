import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Platform, Alert,
  KeyboardAvoidingView, useWindowDimensions
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // <-- importar
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { getUserProfile } from '../../services/userService';
import {
  subscribeToChatMessages,
  sendMessage,
  findDirectSession,
  getOrCreateDirectSession,
  markMessagesAsRead,
  RealtimeChatMessage,
} from '../../services/chatService';
import { excludeBlocked } from '../../services/moderationService';
import { markChatNotificationsRead } from '../../services/notificationService';
import { useModeration } from '../../hooks/useModeration';
import { useBlockedIds } from '../../hooks/useBlockedIds';
import MaxWidthContainer from '../../components/MaxWidthContainer';

const defaultUserImage = require('../../assets/images/img7.jpg');

export default function ChatScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();                                // <-- hook
  const navigation = useNavigation();
  const { friendId, friendName } = useLocalSearchParams<{ friendId: string; friendName: string }>();
  const [{ user: currentUser }] = useAuth();
  const [input, setInput] = useState('');
  const [photoUri, setPhotoUri] = useState<string>();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<RealtimeChatMessage[]>([]);
  const { blockedIds, addBlocked } = useBlockedIds(currentUser?.id);
  const { openReportMenu, confirmBlock } = useModeration(currentUser?.id);

  // 1) Buscar la sesión con el amigo (se crea al enviar el primer mensaje)
  useEffect(() => {
    if (!currentUser || !friendId) return;
    let active = true;
    findDirectSession(currentUser.id, friendId)
      .then((id) => active && setSessionId(id))
      .catch((error) => console.error('Error buscando el chat:', error));
    return () => {
      active = false;
    };
  }, [currentUser?.id, friendId]);

  // 2) Mensajes en tiempo real (el servicio cierra el canal en el cleanup)
  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    return subscribeToChatMessages(sessionId, setMessages);
  }, [sessionId]);

  // 3) Foto del amigo
  useEffect(() => {
    if (!friendId) return;
    getUserProfile(friendId)
      .then((profile) => setPhotoUri(profile?.photo || undefined))
      .catch((error) => console.error('Error obteniendo la foto:', error));
  }, [friendId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!currentUser || !friendId || !text) return;
    setInput('');
    try {
      const id = sessionId ?? (await getOrCreateDirectSession(currentUser.id, friendId));
      if (!sessionId) setSessionId(id);
      await sendMessage(id, currentUser.id, text);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      setInput(text);
      // 42501: la RLS rechazó el mensaje (hay un bloqueo entre los dos usuarios).
      const blocked = (error as { code?: string })?.code === '42501';
      Alert.alert(
        'No se pudo enviar',
        blocked
          ? 'No puedes enviar mensajes a este usuario.'
          : 'Revisa tu conexión e inténtalo de nuevo.'
      );
    }
  };

  const renderItem = ({ item }: { item: RealtimeChatMessage }) => {
    const isUser = item.from === currentUser?.id;
    // Mantener presionado un mensaje ajeno: reportar o bloquear al autor (nunca en mensajes propios)
    const onLongPress = isUser
      ? undefined
      : () =>
          Alert.alert('Mensaje', '¿Qué quieres hacer?', [
            { text: 'Reportar mensaje', onPress: () => openReportMenu('message', item.id, 'Reportar mensaje') },
            { text: 'Bloquear usuario', style: 'destructive', onPress: () => confirmBlock(item.from, friendName, addBlocked) },
            { text: 'Cancelar', style: 'cancel' },
          ]);
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={onLongPress}
        disabled={isUser}
        accessibilityHint={isUser ? undefined : 'Mantén presionado para reportar o bloquear'}
        style={[
          styles.bubble,
          {
            maxWidth: width * 0.75,
            alignSelf: isUser ? 'flex-end' : 'flex-start',
            // Envíos en morado, recibidos en gris
            backgroundColor: isUser ? '#8B5CF6' : '#424242',
          },
        ]}
      >
        <Text style={[styles.text, { color: '#fff' }]}>
          {item.text}
        </Text>
      </TouchableOpacity>
    );
  };

  // Mensajes únicos (el servicio ya los entrega en orden cronológico)
  const uniqueMessages = useMemo(() => {
    const seen = new Set<string>();
    return excludeBlocked(messages, blockedIds, (m) => m.from).filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [messages, blockedIds]);

  // Marcar como leídos los mensajes del amigo (y sus notificaciones) cuando llegan
  const lastIncomingId = uniqueMessages.filter(m => m.from !== currentUser?.id).at(-1)?.id;
  useEffect(() => {
    if (!sessionId || !currentUser || !lastIncomingId) return;
    markMessagesAsRead(sessionId, currentUser.id).catch(() => {});
    markChatNotificationsRead(currentUser.id, sessionId).catch(() => {});
  }, [sessionId, currentUser?.id, lastIncomingId]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <MaxWidthContainer style={{maxWidth: 768}}>
        {/* header y FlatList… */}
        <View style={styles.profileHeader}>
          <Image cachePolicy="memory-disk" transition={200}
            source={photoUri ? { uri: photoUri } : defaultUserImage}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>{friendName || 'Chat'}</Text>
        </View>
        <FlatList
          data={uniqueMessages}                // usa la lista deduplicada
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />

        {/* Footer: elevamos 2px la línea de separación */}
        <View
          style={[
            styles.inputRow,
            {
              paddingBottom: (insets.bottom || 0) + 2, // mantén algo de espacio al fondo
            
            }
          ]}
        >
          <TextInput
            testID="chat-input"
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#888"
          />
          <TouchableOpacity testID="chat-send" style={styles.sendBtn} onPress={handleSend}>
            <Text style={styles.sendText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </MaxWidthContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // mismo negro que Feed
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#121212',
  },
  profileImage: {
    width: 80, height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#bb86fc',
  },
  profileName: {
    marginTop: 8,
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  list: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  bubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginVertical: 4,
    flexShrink: 1,
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderColor: '#333',
    backgroundColor: '#121212',
  },
  input: {
    flex: 1,
    backgroundColor: '#333',
    height: 44,
    borderRadius: 20,
    paddingHorizontal: 16,
    color: '#fff',
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: '#8B5CF6',
    height: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});