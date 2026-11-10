import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import {
  listAdminItems,
  sortAdminItems,
  deleteAdminItem,
  type AdminItem,
} from '../services/adminService';
import { ADMIN_CATEGORIES, type AdminCategoryConfig } from '../components/admin/adminCategories';
import { filterAdminItems, getSortFieldForCategory, type AdminSortOrder } from '../utils/adminFilters';

/** Estado y acciones del panel de administración (listar, buscar, ordenar, eliminar). */
export function useManageUsers() {
  const [activeCategory, setActiveCategory] = useState<AdminCategoryConfig>(ADMIN_CATEGORIES[0]);
  const [items, setItems] = useState<AdminItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<AdminSortOrder>('asc');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    fetchItems();
  }, [activeCategory]);

  useEffect(() => {
    const filtered = filterAdminItems(items, activeCategory.id, searchQuery);
    setFilteredItems(sortAdminItems(filtered, getSortFieldForCategory(activeCategory.id, sortBy), sortOrder));
  }, [searchQuery, items, activeCategory, sortBy, sortOrder]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      setSearchQuery('');
      const itemsList = await listAdminItems(activeCategory.id);
      setItems(itemsList);
      setFilteredItems(sortAdminItems(itemsList, getSortFieldForCategory(activeCategory.id, sortBy), sortOrder));
    } catch (error) {
      console.error(`Error fetching ${activeCategory.name}:`, error);
      setItems([]);
      setError(`No se pudieron cargar los ${activeCategory.name.toLowerCase()}. Revisa tu conexión e inténtalo de nuevo.`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const handleDeleteItem = (itemId: string) => {
    const singular = activeCategory.name.slice(0, -1);
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro que deseas eliminar este ${singular.toLowerCase()}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' as const },
        {
          text: 'Eliminar',
          style: 'destructive' as const,
          onPress: async () => {
            try {
              await deleteAdminItem(activeCategory.id, itemId);
              const updatedItems = items.filter((item) => item.id !== itemId);
              setItems(updatedItems);
              setFilteredItems(updatedItems);
              Alert.alert('Éxito', `${singular} eliminado correctamente`);
            } catch (error) {
              console.error(`Error deleting ${singular}:`, error);
              Alert.alert('Error', `No se pudo eliminar el ${singular.toLowerCase()}`);
            }
          },
        },
      ]
    );
  };

  const toggleSortOrder = () => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));

  return {
    categories: ADMIN_CATEGORIES,
    activeCategory,
    setActiveCategory,
    items,
    filteredItems,
    loading,
    refreshing,
    error,
    reload: fetchItems,
    searchQuery,
    setSearchQuery,
    sortOrder,
    sortBy,
    setSortBy,
    toggleSortOrder,
    onRefresh,
    handleDeleteItem,
  };
}
