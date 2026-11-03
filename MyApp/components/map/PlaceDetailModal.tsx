import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, Image } from 'react-native';
import { styles } from './mapScreenStyles';

type Props = {
  visible: boolean;
  place: any | null;
  owner: { name: string; photo: any } | null;
  onClose: () => void;
};

export default function PlaceDetailModal({ visible, place, owner, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {place && (
            <ScrollView contentContainerStyle={styles.modalContent}>
              {owner && (
                <View style={styles.ownerInfoContainer}>
                  <Image source={owner.photo} style={styles.ownerAvatar} resizeMode="cover" />
                  <Text style={styles.ownerName}>{owner.name}</Text>
                </View>
              )}

              {place.imageUrl ? (
                <Image source={{ uri: place.imageUrl }} style={styles.placeImage} resizeMode="cover" />
              ) : (
                <View style={[styles.placeImage, {
                  backgroundColor: '#333',
                  alignItems: 'center',
                  justifyContent: 'center',
                }]}>
                  <Text style={{ color: '#888', fontSize: 16 }}>Sin imagen disponible</Text>
                </View>
              )}

              <Text style={styles.modalTitleM}>{place.title}</Text>

              {place.description ? (
                <Text style={styles.modalDescription}>{place.description}</Text>
              ) : (
                <Text style={[styles.modalDescription, { fontStyle: 'italic', color: '#888' }]}>
                  Sin descripción
                </Text>
              )}

              <Text style={styles.modalRating}>
                {place.rating && place.rating.length > 0
                  ? `★ ${place.rating[0].stars} estrellas`
                  : 'Sin calificación'}
              </Text>

              <TouchableOpacity style={styles.modalButton} onPress={onClose}>
                <Text style={styles.modalButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
