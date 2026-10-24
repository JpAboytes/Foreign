import { supabase } from './supabase/client';
import { uploadImageToSupabase } from './imageService';
import type { Tables } from '../types/supabase';

// Tipos
export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface MapLocation {
  id: string;
  locationId: string;
  title: string;
  description: string;
  geoPoint: LocationCoords;
  type: string[];
  imageUrl: string;
  imageUrls?: string[];
  createdBy: string;
  rating: Array<{ userId: string; stars: number }>;
  createdAt: any;
}

interface CreateLocationInput {
  title: string;
  description: string;
  coords: LocationCoords;
  types: string[];
  rating: number;
  images?: string[];
}

// Lugar con sus calificaciones en una sola consulta.
const LOCATION_SELECT = '*, map_location_ratings(user_id, stars)';

type LocationRow = Tables<'map_locations'> & {
  map_location_ratings: { user_id: string; stars: number }[];
};

export const toMapLocation = (row: LocationRow): MapLocation => ({
  id: row.id,
  locationId: row.id,
  title: row.title,
  description: row.description,
  geoPoint: { latitude: row.latitude, longitude: row.longitude },
  type: row.types,
  imageUrl: row.image_urls[0] ?? '',
  imageUrls: row.image_urls,
  createdBy: row.created_by,
  rating: row.map_location_ratings.map((r) => ({ userId: r.user_id, stars: r.stars })),
  createdAt: row.created_at,
});

// Subir las imágenes de un lugar a la carpeta del usuario (las políticas de Storage lo exigen).
export const uploadLocationImages = async (userId: string, uris: string[]): Promise<string[]> => {
  const batch = Date.now();
  return await Promise.all(
    uris.map((uri, i) =>
      uploadImageToSupabase(uri, 'post-images', `${userId}/map/${batch}_${i}.jpg`, {
        width: 1200,
        quality: 0.8,
      })
    )
  );
};

// Crear nueva ubicación; devuelve su id
export const createLocation = async (
  userId: string,
  location: CreateLocationInput
): Promise<string> => {
  try {
    const imageUrls =
      location.images && location.images.length > 0
        ? await uploadLocationImages(userId, location.images)
        : [];

    const { data, error } = await supabase
      .from('map_locations')
      .insert({
        created_by: userId,
        title: location.title.trim(),
        description: location.description.trim(),
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        types: location.types,
        image_urls: imageUrls,
      })
      .select('id')
      .single();
    if (error) throw error;

    const { error: ratingError } = await supabase
      .from('map_location_ratings')
      .insert({ location_id: data.id, user_id: userId, stars: location.rating });
    if (ratingError) {
      // No dejar un lugar sin la calificación de su autor.
      await supabase.from('map_locations').delete().eq('id', data.id);
      throw ratingError;
    }

    return data.id;
  } catch (error) {
    console.error('Error creating location:', error);
    throw error;
  }
};

const fetchLocations = async (
  build: (q: ReturnType<typeof baseQuery>) => ReturnType<typeof baseQuery> = (q) => q
): Promise<MapLocation[]> => {
  const { data, error } = await build(baseQuery());
  if (error) throw error;
  return (data as unknown as LocationRow[]).map(toMapLocation);
};

const baseQuery = () =>
  supabase.from('map_locations').select(LOCATION_SELECT).order('created_at', { ascending: false });

// Obtener todas las ubicaciones
export const getAllLocations = async (): Promise<MapLocation[]> => {
  try {
    return await fetchLocations();
  } catch (error) {
    console.error('Error getting all locations:', error);
    throw error;
  }
};

// Obtener ubicaciones por usuario
export const getLocationsByUser = async (userId: string): Promise<MapLocation[]> => {
  try {
    return await fetchLocations((q) => q.eq('created_by', userId));
  } catch (error) {
    console.error(`Error getting locations for user ${userId}:`, error);
    throw error;
  }
};

// Obtener ubicaciones que tengan al menos uno de los tipos
export const getLocationsByType = async (types: string[]): Promise<MapLocation[]> => {
  try {
    if (!types.length) return [];
    return await fetchLocations((q) => q.overlaps('types', types));
  } catch (error) {
    console.error('Error getting locations by type:', error);
    throw error;
  }
};

// Obtener ubicaciones de amigos (y las propias)
export const getFriendsLocations = async (
  userId: string,
  friendIds: string[]
): Promise<MapLocation[]> => {
  try {
    // Si no hay amigos, devolver vacío
    if (!friendIds.length) return [];
    return await fetchLocations((q) => q.in('created_by', [userId, ...friendIds]));
  } catch (error) {
    console.error('Error getting friends locations:', error);
    throw error;
  }
};
