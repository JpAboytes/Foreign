import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './mapScreenStyles';

export default function MapWebFallback() {
  return (
    <View style={styles.webContainer}>
      <View style={styles.webContent}>
        <Ionicons name="phone-portrait-outline" size={64} color="#bb86fc" />
        <Text style={styles.webTitle}>Disponible solo en dispositivos móviles</Text>
        <Text style={styles.webDescription}>
          Esta función está optimizada para la experiencia móvil. Por favor, descarga nuestra aplicación para acceder a todas las funcionalidades del mapa.
        </Text>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => Linking.openURL('https://play.google.com/store')}
        >
          <Text style={styles.downloadButtonText}>Descargar App</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
