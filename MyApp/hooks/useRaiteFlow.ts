import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import type { LatLng } from 'react-native-maps';
import {
  acceptRaiteRequest,
  cancelRaiteRequest as cancelRaiteRequestService,
  getRaiteRequest,
  sendRaiteRequest as sendRaiteRequestService,
  subscribeToRaitesForMe,
} from '../services/raiteService';
import { useRaite } from '../context/RaiteContext';

export type FriendRaiteRequest = {
  friendId: string;
  friendName: string;
  to: LatLng;
};

/** Flujo completo de "Pedir Raite" (enviar, cancelar, recibir y aceptar solicitudes). */
export function useRaiteFlow(
  currentUserId: string | null,
  userLocation: LatLng | null,
  setFriends: (friends: any[]) => void
) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setHasActiveRaiteRequest } = useRaite();

  const [friendRaiteRequests, setFriendRaiteRequests] = useState<FriendRaiteRequest[]>([]);
  const [raiteAlertModalVisible, setRaiteAlertModalVisible] = useState(false);
  const [selectedFriendRaite, setSelectedFriendRaite] = useState<FriendRaiteRequest | null>(null);
  const [isRaiteActive, setIsRaiteActive] = useState(false);
  const [selectedRaitePlace, setSelectedRaitePlace] = useState<LatLng | null>(null);
  const [raiteConfirmModalVisible, setRaisteConfirmModalVisible] = useState(false);
  const [friendSelectionModalVisible, setFriendSelectionModalVisible] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [raiteTimeoutId, setRaiteTimeoutId] = useState<number | null>(null);

  // Procesar parámetros cuando se llega desde una notificación
  useEffect(() => {
    if (params?.showRaiteRequest && params?.fromUserId) {
      const fromUserId = params.fromUserId as string;

      // Buscar la solicitud de raite del amigo
      getRaiteRequest(fromUserId)
        .then((request) => {
          if (request && request.status === 'pending') {
            setSelectedFriendRaite({
              friendId: request.requesterId,
              friendName: request.requesterName,
              to: request.to,
            });
            setRaiteAlertModalVisible(true);
          }
        })
        .catch((error) => console.error('Error obteniendo solicitud de raite:', error));
    }
  }, [params]);

  // Solicitudes de raite que me mandan mis amigos (en tiempo real)
  useEffect(() => {
    if (!currentUserId) return;
    return subscribeToRaitesForMe(currentUserId, (requests) => {
      setFriendRaiteRequests(
        requests.map((r) => ({ friendId: r.requesterId, friendName: r.requesterName, to: r.to }))
      );
    });
  }, [currentUserId]);

  useEffect(() => {
    setHasActiveRaiteRequest(friendRaiteRequests.length > 0);
  }, [friendRaiteRequests]);

  const sendRaiteRequestRealtime = async () => {
    const userId = currentUserId;
    if (!userId || !userLocation || !selectedRaitePlace || selectedFriends.length === 0) return;

    try {
      // Las notificaciones a cada amigo las crea un trigger en la base de datos.
      await sendRaiteRequestService(userId, userLocation, selectedRaitePlace, selectedFriends);

      console.log('Notificaciones de raite enviadas a:', selectedFriends);
    } catch (error) {
      console.error('Error al enviar solicitud de raite:', error);
      throw error;
    }
  };

  const cancelRaiteRequestRealtime = async () => {
    const userId = currentUserId;
    if (!userId) return;
    await cancelRaiteRequestService(userId);
  };

  const handleMapPress = (e: any) => {
    const coordinate: LatLng = e.nativeEvent.coordinate;
    if (isRaiteActive) {
      setSelectedRaitePlace(coordinate);
      setRaisteConfirmModalVisible(true);
    }
  };

  const confirmRaiteRequest = () => {
    setRaisteConfirmModalVisible(false);
    setFriendSelectionModalVisible(true);
  };

  const cancelRaiteRequest = async () => {
    try {
      await cancelRaiteRequestRealtime();
    } catch (error) {
      console.error('❌ Error cancelando raite:', error);
    }

    setRaisteConfirmModalVisible(false);
    setSelectedRaitePlace(null);
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const sendRaiteRequest = async () => {
    try {
      await sendRaiteRequestRealtime();
      Alert.alert('Solicitud Enviada');
    } catch (error) {
      console.error('❌ Error enviando raite:', error);
      Alert.alert('Error', 'No se pudo enviar la solicitud de raite.');
    }

    setFriendSelectionModalVisible(false);
    setSelectedRaitePlace(null);
    setFriends([]);
    setIsRaiteActive(false);
  };

  const toggleRaiteMode = () => {
    setIsRaiteActive((prev) => {
      const newState = !prev;

      if (newState) {
        const timeoutId = setTimeout(() => {
          setIsRaiteActive(false);
          setSelectedRaitePlace(null);
          setRaisteConfirmModalVisible(false);
          setFriendSelectionModalVisible(false);
        }, 15 * 60 * 1000); // 15 minutos

        setRaiteTimeoutId(timeoutId as unknown as number);
      } else {
        if (raiteTimeoutId) {
          clearTimeout(raiteTimeoutId);
          setRaiteTimeoutId(null);
        }

        setSelectedRaitePlace(null);
        setRaisteConfirmModalVisible(true);
        setFriendSelectionModalVisible(false);
      }

      return newState;
    });
  };

  const handleAcceptRaite = async () => {
    if (!selectedFriendRaite || !currentUserId) return;

    try {
      await acceptRaiteRequest(selectedFriendRaite.friendId);

      // Cerrar modal
      setRaiteAlertModalVisible(false);
      setSelectedFriendRaite(null);

      // Navegar al chat
      router.push(`/extra/chat?friendId=${selectedFriendRaite.friendId}&friendName=${encodeURIComponent(selectedFriendRaite.friendName)}`);
    } catch (error) {
      console.error('❌ Error al aceptar raite:', error);
      Alert.alert('Error', 'No se pudo aceptar la solicitud.');
    }
  };

  const rejectRaiteAlert = () => {
    setRaiteAlertModalVisible(false);
    setSelectedFriendRaite(null);
  };

  const openFirstRequest = () => {
    setSelectedFriendRaite(friendRaiteRequests[0]);
    setRaiteAlertModalVisible(true);
  };

  return {
    friendRaiteRequests,
    raiteAlertModalVisible,
    setRaiteAlertModalVisible,
    selectedFriendRaite,
    isRaiteActive,
    selectedRaitePlace,
    raiteConfirmModalVisible,
    friendSelectionModalVisible,
    setFriendSelectionModalVisible,
    selectedFriends,
    handleMapPress,
    confirmRaiteRequest,
    cancelRaiteRequest,
    toggleFriendSelection,
    sendRaiteRequest,
    toggleRaiteMode,
    handleAcceptRaite,
    rejectRaiteAlert,
    openFirstRequest,
  };
}
