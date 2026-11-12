import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  message: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  testID?: string;
};

/** Estado vacío para listas (tema oscuro de la app). */
export default function EmptyState({ message, icon = 'file-tray-outline', testID }: Props) {
  return (
    <View style={styles.container} testID={testID}>
      <Ionicons name={icon} size={48} color="#b388ff" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
});
