import React from 'react';
import {
  Text,
  View,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ErrorState from '../../../components/common/ErrorState';
import MaxWidthContainer from '../../../components/MaxWidthContainer';
import AdminCategorySelector from '../../../components/admin/AdminCategorySelector';
import AdminListHeader from '../../../components/admin/AdminListHeader';
import AdminEmptyList from '../../../components/admin/AdminEmptyList';
import AdminItemCard from '../../../components/admin/AdminItemCard';
import { adminStyles as styles } from '../../../components/admin/adminStyles';
import { useManageUsers } from '../../../hooks/useManageUsers';
import { getSortOptions } from '../../../utils/adminFilters';

export default function ManagementScreen() {
  const router = useRouter();
  const {
    categories,
    activeCategory,
    setActiveCategory,
    items,
    filteredItems,
    loading,
    refreshing,
    error,
    reload,
    searchQuery,
    setSearchQuery,
    sortOrder,
    sortBy,
    setSortBy,
    toggleSortOrder,
    onRefresh,
    handleDeleteItem,
  } = useManageUsers();

  const handleEdit = (itemId: string) =>
    router.push({ pathname: './editItem', params: { itemId, category: activeCategory.id } });

  const handleAdd = () => {
    if (activeCategory.id === 'mentors') {
      router.push({ pathname: './addMentor' });
    } else {
      router.push({ pathname: './addItem', params: { category: activeCategory.id } });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <MaxWidthContainer style={{ maxWidth: 1000 }}>
        <AdminCategorySelector categories={categories} activeCategory={activeCategory} onSelect={setActiveCategory} />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#b388ff" />
            <Text style={styles.loadingText}>Cargando {activeCategory.name.toLowerCase()}...</Text>
          </View>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <FlatList
            data={filteredItems}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <AdminItemCard category={activeCategory.id} item={item} onEdit={handleEdit} onDelete={handleDeleteItem} />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={
              <AdminListHeader
                categoryName={activeCategory.name}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortOptions={getSortOptions(activeCategory.id)}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOrder={sortOrder}
                onToggleSortOrder={toggleSortOrder}
                shownCount={filteredItems.length}
                totalCount={items.length}
              />
            }
            ListEmptyComponent={<AdminEmptyList category={activeCategory} hasSearch={searchQuery.length > 0} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#b388ff" colors={['#b388ff']} />
            }
          />
        )}

        {/* Botón flotante */}
        <TouchableOpacity style={styles.floatingButton} onPress={handleAdd}>
          <Ionicons name="add" size={30} color="#000" />
        </TouchableOpacity>
      </MaxWidthContainer>
    </SafeAreaView>
  );
}
