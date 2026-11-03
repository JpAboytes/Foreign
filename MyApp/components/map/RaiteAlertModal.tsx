import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { styles } from './mapScreenStyles';

type Props = {
  visible: boolean;
  friendName: string | null;
  onReject: () => void;
  onAccept: () => void;
  onViewRoute: () => void;
};

export default function RaiteAlertModal({ visible, friendName, onReject, onAccept, onViewRoute }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Solicitud de Raite</Text>

          {friendName !== null && (
            <Text style={{ color: '#fff', textAlign: 'center', marginBottom: 10 }}>
              Tu amigo <Text style={{ fontWeight: 'bold' }}>{friendName}</Text> necesita un raite.
            </Text>
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={onReject}>
              <Text style={styles.modalButtonText}>Rechazar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalButton} onPress={onAccept}>
              <Text style={styles.modalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>

          {/* Botón separado para ver la ruta */}
          <TouchableOpacity onPress={onViewRoute} style={styles.viewRouteButton}>
            <Text style={styles.viewRouteText}>📍 Ver ruta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
