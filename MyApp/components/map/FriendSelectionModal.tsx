import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { styles } from './mapScreenStyles';

type Props = {
  visible: boolean;
  friends: { id: string; name: string }[];
  selectedFriends: string[];
  onToggle: (friendId: string) => void;
  onCancel: () => void;
  onSend: () => void;
};

export default function FriendSelectionModal({ visible, friends, selectedFriends, onToggle, onCancel, onSend }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Selecciona amigos</Text>
          <ScrollView style={styles.friendsList}>
            {friends.map((friend) => (
              <TouchableOpacity key={friend.id} style={styles.friendItem} onPress={() => onToggle(friend.id)}>
                <Text style={styles.friendText}>{friend.name}</Text>
                {selectedFriends.includes(friend.id) && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={onCancel}>
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={onSend}>
              <Text style={styles.modalButtonText}>Enviar Solicitud</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
