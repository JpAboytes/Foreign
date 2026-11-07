import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import type { AdminSortOption, AdminSortOrder } from '../../utils/adminFilters';
import { adminStyles as styles } from './adminStyles';

interface Props {
  categoryName: string;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  sortOptions: AdminSortOption[];
  sortBy: string;
  onSortByChange: (field: string) => void;
  sortOrder: AdminSortOrder;
  onToggleSortOrder: () => void;
  shownCount: number;
  totalCount: number;
}

export default function AdminListHeader({
  categoryName,
  searchQuery,
  onSearchChange,
  sortOptions,
  sortBy,
  onSortByChange,
  sortOrder,
  onToggleSortOrder,
  shownCount,
  totalCount,
}: Props) {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Buscar ${categoryName.toLowerCase()}...`}
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Feather name="x" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Ordenar por:</Text>
        <View style={styles.sortButtons}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.sortButton, sortBy === option.id && styles.sortButtonActive]}
              onPress={() => onSortByChange(option.id)}
            >
              <Text style={[styles.sortButtonText, sortBy === option.id && styles.sortButtonTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity onPress={onToggleSortOrder} style={styles.sortOrderButton}>
            <MaterialIcons name={sortOrder === 'asc' ? 'arrow-upward' : 'arrow-downward'} size={20} color="#b388ff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Mostrando {shownCount} de {totalCount} {categoryName.toLowerCase()}
        </Text>
      </View>
    </View>
  );
}
