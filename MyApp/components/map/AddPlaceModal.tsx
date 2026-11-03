import React from 'react';
import { View, Text, Modal, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { styles } from './mapScreenStyles';

type Props = {
  visible: boolean;
  name: string;
  onChangeName: (v: string) => void;
  description: string;
  onChangeDescription: (v: string) => void;
  images: string[];
  onPickImages: () => void;
  stars: number;
  onChangeStars: (n: number) => void;
  onCancel: () => void;
  onSave: () => void;
};

export default function AddPlaceModal({
  visible, name, onChangeName, description, onChangeDescription, images,
  onPickImages, stars, onChangeStars, onCancel, onSave,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>Agregar Nuevo Lugar</Text>

          {/* Campo para el título */}
          <TextInput
            style={styles.modalInput}
            placeholder="Nombre del lugar"
            placeholderTextColor="#888"
            value={name}
            onChangeText={onChangeName}
          />

          {/* Campo para la descripción */}
          <TextInput
            style={[styles.modalInput, { height: 100 }]}
            placeholder="Descripción"
            placeholderTextColor="#888"
            value={description}
            onChangeText={onChangeDescription}
            multiline
          />

          {/* Botón para elegir imagen */}
          <TouchableOpacity style={styles.galleryButton} onPress={onPickImages}>
            <Text style={styles.modalButtonText}>Seleccionar Imagen</Text>
          </TouchableOpacity>

          {/* Preview de imagen si hay */}
          {images.length > 0 && (
            <View style={styles.selectedImagesContainer}>
              {images.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.selectedImagePreview} resizeMode="cover" />
              ))}
            </View>
          )}

          {/* Calificación por estrellas */}
          <Text style={styles.modalTitle}>Calificación:</Text>
          <View style={styles.starRatingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => onChangeStars(star)} style={styles.starButton}>
                <Text style={[styles.starIcon, { color: stars >= star ? '#FFD700' : '#444' }]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Botones de acción */}
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={onCancel}>
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalButton} onPress={onSave}>
              <Text style={styles.modalButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
