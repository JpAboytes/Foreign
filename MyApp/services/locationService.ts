import { supabase } from './supabase/client';
import type { Tables } from '../types/supabase';
import * as Location from 'expo-location';

// Interfaces
export interface MapLocation {
  id?: string;
  title: string;
  description?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  type: 'university' | 'restaurant' | 'housing' | 'entertainment' | 'transport' | 'other';
  address?: string;
  rating?: number;
  imageUrl?: string;
  createdBy?: string;
  createdAt?: any;
}

export interface UserLocation {
  id?: string;
  userId: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  lastUpdated: any;
}

// Obtener la ubicación actual del usuario
export const getCurrentLocation = async (): Promise<Location.LocationObject | null> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('Permiso para acceder a la ubicación denegado');
      return null;
    }
    
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    return location;
  } catch (error) {
    console.error('Error obteniendo ubicación actual:', error);
    return null;
  }
};

// Guardar la ubicación actual del usuario.
// Pendiente: el esquema de Supabase aún no tiene tabla para ubicaciones de usuario
// (antes `userLocations`), así que no se persiste. Ningún llamador la usa hoy.
export const saveUserLocation = async (
  _userId: string,
  _coordinates: { latitude: number; longitude: number }
): Promise<string | null> => {
  console.warn('saveUserLocation: sin tabla en Supabase, no se guardó la ubicación');
  return null;
};

const MAP_LOCATION_TYPES = ['university', 'restaurant', 'housing', 'entertainment', 'transport', 'other'] as const;

type LocationRow = Tables<'map_locations'> & {
  map_location_ratings: { stars: number }[];
};

const toLocation = (row: LocationRow): MapLocation => {
  const stars = row.map_location_ratings.map((r) => r.stars);
  const known = row.types.find((t): t is MapLocation['type'] =>
    (MAP_LOCATION_TYPES as readonly string[]).includes(t)
  );
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    coordinates: { latitude: row.latitude, longitude: row.longitude },
    type: known ?? 'other',
    rating: stars.length ? stars.reduce((a, b) => a + b, 0) / stars.length : undefined,
    imageUrl: row.image_urls[0],
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
};

// Obtener todas las ubicaciones de interés
export const getMapLocations = async (
  type?: string
): Promise<MapLocation[]> => {
  try {
    let q = supabase
      .from('map_locations')
      .select('*, map_location_ratings(stars)')
      .order('created_at', { ascending: false });
    if (type && type !== 'all') q = q.contains('types', [type]);

    const { data, error } = await q;
    if (error) throw error;
    return (data as unknown as LocationRow[]).map(toLocation);
  } catch (error) {
    console.error('Error obteniendo ubicaciones del mapa:', error);
    return [];
  }
};

// Agregar una nueva ubicación al mapa.
// `address` no tiene columna en el esquema y no se guarda.
export const addMapLocation = async (
  location: Omit<MapLocation, 'id' | 'createdAt'>,
  userId: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('map_locations')
      .insert({
        created_by: userId,
        title: location.title,
        description: location.description ?? '',
        latitude: location.coordinates.latitude,
        longitude: location.coordinates.longitude,
        types: [location.type],
        image_urls: location.imageUrl ? [location.imageUrl] : [],
      })
      .select('id')
      .single();
    if (error) throw error;

    if (location.rating) {
      const { error: ratingError } = await supabase
        .from('map_location_ratings')
        .insert({ location_id: data.id, user_id: userId, stars: Math.round(location.rating) });
      if (ratingError) console.error('Error guardando calificación:', ratingError);
    }
    return data.id;
  } catch (error) {
    console.error('Error agregando ubicación al mapa:', error);
    return null;
  }
};

// Eliminar una ubicación del mapa (RLS solo permite al autor o a un admin)
export const deleteMapLocation = async (
  locationId: string,
  userId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('map_locations')
      .delete()
      .eq('id', locationId)
      .eq('created_by', userId)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('No tienes permisos para eliminar esta ubicación');
    }
    return true;
  } catch (error) {
    console.error('Error eliminando ubicación del mapa:', error);
    return false;
  }
};

// Obtener dirección a partir de coordenadas (geocoding inverso)
export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    const result = await Location.reverseGeocodeAsync({
      latitude,
      longitude
    });
    
    if (result.length > 0) {
      const { street, city, region, country } = result[0];
      const addressParts = [street, city, region, country].filter(Boolean);
      return addressParts.join(', ');
    }
    
    return 'Dirección desconocida';
  } catch (error) {
    console.error('Error obteniendo dirección desde coordenadas:', error);
    return 'Error al obtener dirección';
  }
};

// Buscar ubicación por nombre o dirección (geocoding)
export const searchLocation = async (query: string): Promise<Location.LocationGeocodedLocation[]> => {
  try {
    return await Location.geocodeAsync(query);
  } catch (error) {
    console.error('Error buscando ubicación:', error);
    return [];
  }
};

// Calcular distancia entre dos puntos (en kilómetros)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distancia en km
  
  return d;
};

// Convertir grados a radianes
const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};