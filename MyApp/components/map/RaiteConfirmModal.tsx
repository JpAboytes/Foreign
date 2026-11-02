import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { styles } from './mapScreenStyles';

type Props = {
  visible: boolean;
  hasPlace: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function RaiteConfirmModal({ visible, hasPlace, onCancel, onConfirm }: Props) {
  if (!visible || !hasPlace) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>¿Confirmar Destino de Raite?</Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={onCancel}>
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalButton} onPress={onConfirm}>
              <Text style={styles.modalButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
