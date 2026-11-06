import React from 'react';
import { View, Text } from 'react-native';
import type { AdminCategoryConfig } from './adminCategories';
import { adminStyles as styles } from './adminStyles';

interface Props {
  category: AdminCategoryConfig;
  hasSearch: boolean;
}

export default function AdminEmptyList({ category, hasSearch }: Props) {
  return (
    <View style={styles.emptyContainer}>
      {category.icon}
      <Text style={styles.emptyText}>No hay {category.name.toLowerCase()} para mostrar</Text>
      {hasSearch && <Text style={styles.emptySubText}>Intenta con otra búsqueda</Text>}
    </View>
  );
}
