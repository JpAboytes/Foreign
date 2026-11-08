import { describe, it, expect, jest } from '@jest/globals';

jest.mock('../../services/supabase/client', () => ({ supabase: {} }));

import { sortAdminItems } from '../../services/adminService';
import { filterAdminItems, getSortFieldForCategory, getSortOptions } from '../adminFilters';

const users: any[] = [
  { id: '1', name: 'Zoe', email: 'zoe@x.mx' },
  { id: '2', name: 'Ana', email: 'ANA@y.mx' },
  { id: '3', email: 'sin-nombre@z.mx' },
];

describe('filterAdminItems', () => {
  it('devuelve todo con consulta vacía o en blanco', () => {
    expect(filterAdminItems(users, 'users', '')).toHaveLength(3);
    expect(filterAdminItems(users, 'users', '   ')).toHaveLength(3);
  });
  it('busca por nombre o email sin distinguir mayúsculas', () => {
    expect(filterAdminItems(users, 'users', 'ana').map((u) => u.id)).toEqual(['2']);
    expect(filterAdminItems(users, 'users', 'Z.MX').map((u) => u.id)).toEqual(['3']);
  });
  it('usa los campos de cada categoría', () => {
    const posts: any[] = [{ id: 'p', caption: 'Hola', userName: 'Luis' }];
    expect(filterAdminItems(posts, 'posts', 'luis')).toHaveLength(1);
    expect(filterAdminItems(posts, 'forums', 'luis')).toHaveLength(0);
    const locs: any[] = [{ id: 'l', title: 'Café', description: 'wifi' }];
    expect(filterAdminItems(locs, 'locations', 'WIFI')).toHaveLength(1);
  });
});

describe('getSortFieldForCategory', () => {
  it('cae al campo por defecto de la categoría', () => {
    expect(getSortFieldForCategory('users', 'specialty')).toBe('name');
    expect(getSortFieldForCategory('users', 'email')).toBe('email');
    expect(getSortFieldForCategory('mentors', 'specialty')).toBe('name');
    expect(getSortFieldForCategory('posts', 'name')).toBe('caption');
    expect(getSortFieldForCategory('forums', 'authorName')).toBe('title');
    expect(getSortFieldForCategory('locations', 'createdAt')).toBe('createdAt');
  });
});

describe('getSortOptions', () => {
  it('incluye siempre la opción Fecha', () => {
    for (const c of ['users', 'mentors', 'posts', 'locations', 'forums'] as const) {
      expect(getSortOptions(c).some((o) => o.id === 'createdAt')).toBe(true);
    }
  });
});

describe('filtrar y ordenar', () => {
  it('ordena el resultado filtrado de forma ascendente y descendente', () => {
    const sorted = (o: 'asc' | 'desc') =>
      sortAdminItems(filterAdminItems(users, 'users', 'mx'), getSortFieldForCategory('users', 'name'), o).map((u) => u.id);
    expect(sorted('asc')).toEqual(['3', '2', '1']);
    expect(sorted('desc')).toEqual(['1', '2', '3']);
  });
});
