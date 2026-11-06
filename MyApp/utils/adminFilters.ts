import type {
  AdminCategory,
  AdminItem,
  AdminUser,
  AdminMentor,
  AdminPost,
  AdminLocation,
  AdminForum,
} from '../services/adminService';

export type AdminSortOrder = 'asc' | 'desc';
export interface AdminSortOption {
  id: string;
  label: string;
}

/** Campo de orden efectivo según la categoría y el criterio elegido. */
export function getSortFieldForCategory(category: AdminCategory, sortBy: string): string {
  switch (category) {
    case 'users':
      return sortBy === 'createdAt' ? 'createdAt' : sortBy === 'email' ? 'email' : 'name';
    case 'mentors':
      return sortBy === 'createdAt' ? 'createdAt' : 'name';
    case 'posts':
      return sortBy === 'createdAt' ? 'createdAt' : sortBy === 'userName' ? 'userName' : 'caption';
    case 'locations':
    case 'forums':
      return sortBy === 'createdAt' ? 'createdAt' : 'title';
    default:
      return 'name';
  }
}

/** Opciones de orden que muestra la barra de cada categoría. */
export function getSortOptions(category: AdminCategory): AdminSortOption[] {
  switch (category) {
    case 'users':
      return [
        { id: 'name', label: 'Nombre' },
        { id: 'email', label: 'Email' },
        { id: 'createdAt', label: 'Fecha' },
      ];
    case 'mentors':
      return [
        { id: 'name', label: 'Nombre' },
        { id: 'specialty', label: 'Especialidad' },
        { id: 'createdAt', label: 'Fecha' },
      ];
    case 'posts':
      return [
        { id: 'caption', label: 'Título' },
        { id: 'userName', label: 'Usuario' },
        { id: 'createdAt', label: 'Fecha' },
      ];
    case 'locations':
      return [
        { id: 'title', label: 'Nombre' },
        { id: 'type', label: 'Tipo' },
        { id: 'createdAt', label: 'Fecha' },
      ];
    case 'forums':
      return [
        { id: 'title', label: 'Título' },
        { id: 'authorName', label: 'Autor' },
        { id: 'createdAt', label: 'Fecha' },
      ];
    default:
      return [
        { id: 'name', label: 'Nombre' },
        { id: 'createdAt', label: 'Fecha' },
      ];
  }
}

const has = (value: string | undefined, query: string) => value?.toLowerCase().includes(query);

/** Filtra por texto (sin distinguir mayúsculas) según los campos de cada categoría. */
export function filterAdminItems(items: AdminItem[], category: AdminCategory, query: string): AdminItem[] {
  if (query.trim() === '') return items;
  const q = query.toLowerCase();
  return items.filter((item) => {
    switch (category) {
      case 'users':
        return has((item as AdminUser).name, q) || has((item as AdminUser).email, q);
      case 'mentors':
        return has((item as AdminMentor).name, q) || has((item as AdminMentor).specialty, q);
      case 'posts':
        return has((item as AdminPost).caption, q) || has((item as AdminPost).userName, q);
      case 'locations':
        return has((item as AdminLocation).title, q) || has((item as AdminLocation).description, q);
      case 'forums':
        return has((item as AdminForum).title, q) || has((item as AdminForum).authorName, q);
      default:
        return false;
    }
  });
}
