import { describe, it, expect, beforeEach, jest } from '@jest/globals';
const mockInsertSingle = jest.fn<(...a: any[]) => Promise<any>>();
const mockRatingInsert = jest.fn<(...a: any[]) => Promise<any>>();
const mockDeleteEq = jest.fn<(...a: any[]) => Promise<any>>();
let mockSelectResult: { data: any; error: any } = { data: [], error: null };
const mockOverlaps = jest.fn();

jest.mock('../supabase/client', () => {
  const selectChain: any = {
    order: () => selectChain,
    eq: () => selectChain,
    in: () => selectChain,
    overlaps: (...a: any[]) => {
      mockOverlaps(...a);
      return selectChain;
    },
    then: (res: any, rej: any) => Promise.resolve(mockSelectResult).then(res, rej),
  };
  return {
    supabase: {
      from: (table: string) => {
        if (table === 'map_location_ratings') return { insert: mockRatingInsert };
        return {
          select: () => selectChain,
          insert: () => ({ select: () => ({ single: mockInsertSingle }) }),
          delete: () => ({ eq: mockDeleteEq }),
        };
      },
    },
  };
});
jest.mock('../imageService', () => ({ uploadImageToSupabase: jest.fn() }));

import { createLocation, getAllLocations, getLocationsByType, getFriendsLocations } from '../mapService';

const row = {
  id: 'loc-1',
  created_by: 'u1',
  title: 'Cafe',
  description: 'rico',
  latitude: 32.5,
  longitude: -117,
  types: ['favoritos'],
  image_urls: ['http://img/1.jpg'],
  created_at: '2026-10-24T00:00:00Z',
  map_location_ratings: [{ user_id: 'u1', stars: 4 }],
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  mockSelectResult = { data: [row], error: null };
});

describe('mapService', () => {
  it('mapea filas de Supabase a MapLocation', async () => {
    const [loc] = await getAllLocations();
    expect(loc).toMatchObject({
      id: 'loc-1',
      locationId: 'loc-1',
      geoPoint: { latitude: 32.5, longitude: -117 },
      type: ['favoritos'],
      imageUrl: 'http://img/1.jpg',
      createdBy: 'u1',
      rating: [{ userId: 'u1', stars: 4 }],
    });
  });

  it('propaga errores de la consulta', async () => {
    mockSelectResult = { data: null, error: new Error('rls') };
    await expect(getAllLocations()).rejects.toThrow('rls');
  });

  it('filtra por tipos con overlaps y regresa vacío sin tipos', async () => {
    await getLocationsByType(['favoritos']);
    expect(mockOverlaps).toHaveBeenCalledWith('types', ['favoritos']);
    expect(await getLocationsByType([])).toEqual([]);
  });

  it('getFriendsLocations regresa vacío sin amigos', async () => {
    expect(await getFriendsLocations('u1', [])).toEqual([]);
  });

  it('createLocation inserta el lugar y la calificación del autor', async () => {
    mockInsertSingle.mockResolvedValue({ data: { id: 'new-id' }, error: null });
    mockRatingInsert.mockResolvedValue({ error: null });
    const id = await createLocation('u1', {
      title: ' Cafe ',
      description: ' rico ',
      coords: { latitude: 1, longitude: 2 },
      types: ['favoritos'],
      rating: 5,
    });
    expect(id).toBe('new-id');
    expect(mockRatingInsert).toHaveBeenCalledWith({ location_id: 'new-id', user_id: 'u1', stars: 5 });
  });

  it('createLocation borra el lugar si falla la calificación', async () => {
    mockInsertSingle.mockResolvedValue({ data: { id: 'new-id' }, error: null });
    mockRatingInsert.mockResolvedValue({ error: new Error('boom') });
    mockDeleteEq.mockResolvedValue({ error: null });
    await expect(
      createLocation('u1', { title: 'a', description: '', coords: { latitude: 1, longitude: 2 }, types: [], rating: 3 })
    ).rejects.toThrow('boom');
    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'new-id');
  });
});
