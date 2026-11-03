import { useState } from 'react';
import { getUserProfile } from '../services/userService';

export type PlaceOwner = { name: string; photo: any };

/** Lugar seleccionado y datos de su autor para el modal de detalle. */
export function usePlaceDetail() {
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [placeModalVisible, setPlaceModalVisible] = useState(false);
  const [placeOwner, setPlaceOwner] = useState<PlaceOwner | null>(null);

  const fetchPlaceOwner = async (userId: string) => {
    try {
      const userInfo = await getUserProfile(userId);
      if (userInfo) {
        const ownerData = {
          name: userInfo.name || 'Usuario sin nombre',
          photo: userInfo.photo
            ? (userInfo.photo.startsWith('data:')
                ? { uri: userInfo.photo }
                : { uri: userInfo.photo })
            : require('../assets/images/img7.jpg'), // Foto default local si no tiene
        };
        setPlaceOwner(ownerData);
      } else {
        console.log('No se encontró usuario');
        setPlaceOwner(null);
      }
    } catch (error) {
      console.error(`❌ Error cargando usuario ${userId}:`, error);
      setPlaceOwner(null);
    }
  };

  const openPlace = (place: any) => {
    fetchPlaceOwner(place.createdBy);
    setSelectedPlace(place);
    setPlaceModalVisible(true);
  };

  const closePlace = () => setPlaceModalVisible(false);

  return { selectedPlace, placeModalVisible, placeOwner, openPlace, closePlace };
}
