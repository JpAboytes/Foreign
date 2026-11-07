import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import type { AdminCategoryConfig } from './adminCategories';
import { adminStyles as styles } from './adminStyles';

interface Props {
  categories: AdminCategoryConfig[];
  activeCategory: AdminCategoryConfig;
  onSelect: (category: AdminCategoryConfig) => void;
}

export default function AdminCategorySelector({ categories, activeCategory, onSelect }: Props) {
  return (
    <View style={styles.categorySelectorContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categorySelectorContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryButton, activeCategory.id === category.id && styles.categoryButtonActive]}
            onPress={() => onSelect(category)}
          >
            <View style={styles.categoryIconContainer}>{category.icon}</View>
            <Text
              style={[styles.categoryButtonText, activeCategory.id === category.id && styles.categoryButtonTextActive]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
