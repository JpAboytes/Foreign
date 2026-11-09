import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { TERMS_URL, PRIVACY_URL } from '../../services/auth';

interface TermsGateProps {
  isLoading: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

// Se muestra tras entrar con Google/Apple (o con una cuenta que aún no acepta la versión vigente)
// y bloquea el acceso a la app hasta aceptar los Términos y Condiciones.
export default function TermsGate({ isLoading, onAccept, onDecline }: TermsGateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Términos y Condiciones</Text>
      <Text style={styles.body}>
        Para usar Foreign debes aceptar los Términos y Condiciones. En Foreign no se tolera el contenido
        ofensivo ni el comportamiento abusivo: puedes reportar contenido y bloquear usuarios, y las cuentas
        que incumplan las reglas pueden ser suspendidas.
      </Text>
      <Text style={styles.link} onPress={() => Linking.openURL(TERMS_URL)}>
        Leer los Términos y Condiciones
      </Text>
      <Text style={styles.link} onPress={() => Linking.openURL(PRIVACY_URL)}>
        Leer la Política de Privacidad
      </Text>
      {isLoading ? (
        <ActivityIndicator size="large" color="#bb86fc" style={styles.loader} />
      ) : (
        <>
          <TouchableOpacity style={styles.primaryButton} onPress={onAccept}>
            <Text style={styles.buttonText}>Acepto los Términos y Condiciones</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={onDecline}>
            <Text style={styles.secondaryText}>No acepto, cerrar sesión</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  body: { color: '#ccc', fontSize: 15, lineHeight: 22, marginBottom: 12 },
  link: { color: '#bb86fc', textDecorationLine: 'underline', marginBottom: 20 },
  loader: { marginVertical: 20 },
  primaryButton: { backgroundColor: '#bb86fc', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#121212', fontWeight: 'bold', fontSize: 16 },
  secondaryButton: { paddingVertical: 12, alignItems: 'center' },
  secondaryText: { color: '#888', fontSize: 14 },
});
