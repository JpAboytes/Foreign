import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { LatLng } from 'react-native-maps';
import { createLocation } from '../services/mapService';

/** Estado y acciones del flujo "Agregar Lugar" (long press + modal). */
export function useAddPlace(currentUserId: string | null, onSaved: () => void) {
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [manualMarkerCoords, setManualMarkerCoords] = useState<LatLng | null>(null);
  const [manualMarkerName, setManualMarkerName] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [review, setReview] = useState('');
  const [stars, setStars] = useState(5);
  const [manualMarkerDescription, setManualMarkerDescription] = useState('');
  const [, setManualMarkerImageUri] = useState<string | null>(null);
  const [, setManualMarkerRating] = useState(0);

  //nuevo lugar
  const handleLongPress = (e: any) => {
    if (!isAddingPlace) return; // SOLO si activamos agregar lugar
    setManualMarkerCoords(e.nativeEvent.coordinate);
    setModalVisible(true);
  };

  //crear el pin (ubicacion)
  const handleAddManualMarker = async () => {
    if (!manualMarkerCoords || !manualMarkerName.trim() || !currentUserId) {
      Alert.alert('Error', 'Completa todos los datos.');
      return;
    }

    try {
      await createLocation(currentUserId, {
        title: manualMarkerName,
        description: review,
        coords: manualMarkerCoords,
        types: ['favoritos'],
        rating: stars,
        images: selectedImages,
      });
      Alert.alert('✅ Lugar guardado correctamente');
      // limpiar estados
      setManualMarkerName('');
      setManualMarkerCoords(null);
      setReview('');
      setStars(5);
      setSelectedImages([]);
      setModalVisible(false);
      setIsAddingPlace(false);
      // Refrescar lugares
      onSaved();
    } catch (error) {
      console.error('❌ Error guardando lugar:', error);
    }
  };

  //para lograr el long press
  const toggleAddingPlace = () => {
    setIsAddingPlace((prev) => !prev);
    if (isAddingPlace) {
      setManualMarkerCoords(null);
      setManualMarkerName('');
      setSelectedImages([]);
      setReview('');
      setStars(5);
    }
  };

  const cancelAddPlace = () => {
    setModalVisible(false);
    setIsAddingPlace(false);
    setManualMarkerCoords(null);
    setManualMarkerName('');
    setManualMarkerDescription('');
    setManualMarkerImageUri(null);
    setManualMarkerRating(0);
  };

  const pickImagesFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        selectionLimit: 5, // máximo 5 imágenes
      });

      if (!result.canceled) {
        const selected = result.assets.map((asset) => asset.uri);
        setSelectedImages(selected);
      }
    } catch (error) {
      console.error('❌ Error seleccionando imágenes:', error);
    }
  };

  return {
    isAddingPlace,
    modalVisible,
    manualMarkerName,
    setManualMarkerName,
    manualMarkerDescription,
    setManualMarkerDescription,
    selectedImages,
    stars,
    setStars,
    handleLongPress,
    handleAddManualMarker,
    toggleAddingPlace,
    cancelAddPlace,
    pickImagesFromLibrary,
  };
}
