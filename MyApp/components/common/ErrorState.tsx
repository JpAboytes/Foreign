import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  message: string;
  onRetry: () => void;
  retryLabel?: string;
};

/** Estado de error con botón de reintento (tema oscuro de la app). */
export default function ErrorState({ message, onRetry, retryLabel = 'Reintentar' }: Props) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Ionicons name="cloud-offline-outline" size={48} color="#b388ff" />
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity style={styles.button} onPress={onRetry} accessibilityRole="button">
        <Text style={styles.buttonText}>{retryLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#b388ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
