import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser } from '../services/auth';
import { getUserProfile } from '../services/userService';
import { getFriendIds } from '../services/profileService';
import { getAllLocations } from '../services/mapService';
import { filterVisibleLocations } from '../utils/mapPins';

export type MapFriend = { id: string; name: string };

/** Usuario actual, amigos y lugares visibles (propios + de amigos) del mapa. */
export function useMapData() {
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [friends, setFriends] = useState<MapFriend[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  //auth y amigos
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!user || cancelled) return;
        setCurrentUserId(user.id);
        const ids = await getFriendIds(user.id);
        if (!cancelled) setFriendIds(ids);
      } catch (err) {
        console.error('❌ Error cargando usuario y amigos:', err);
        if (!cancelled) {
          setError('No se pudo cargar tu información. Revisa tu conexión e inténtalo de nuevo.');
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  //fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const loadedLocations = filterVisibleLocations(await getAllLocations(), currentUserId, friendIds);
        setLocations(loadedLocations);
      } catch (err) {
        console.error('❌ Error cargando lugares:', err);
        setError('No se pudieron cargar los lugares. Revisa tu conexión e inténtalo de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUserId) {
      fetchLocations();
    }
  }, [currentUserId, friendIds, reloadKey]);

  // filtrar info de amigos
  useEffect(() => {
    const fetchFriendsData = async () => {
      try {
        const friendsData: MapFriend[] = [];

        for (const friendId of friendIds) {
          const friendInfo = await getUserProfile(friendId);
          if (friendInfo) {
            friendsData.push({
              id: friendId,
              name: friendInfo.name || 'Usuario sin nombre',
            });
          }
        }

        setFriends(friendsData);
      } catch (error) {
        console.error('❌ Error cargando amigos:', error);
      }
    };

    if (friendIds.length > 0) {
      fetchFriendsData();
    }
  }, [friendIds]);

  //volver a fetchear ubis
  const fetchLocationsAgain = async () => {
    try {
      const loadedLocations = await getAllLocations();
      setLocations(loadedLocations);
    } catch (error) {
      console.error('❌ Error recargando lugares:', error);
    }
  };

  const reload = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  return { locations, isLoading, error, reload, currentUserId, friendIds, friends, setFriends, fetchLocationsAgain };
}
