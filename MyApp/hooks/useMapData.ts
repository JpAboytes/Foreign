import { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/auth';
import { getUserProfile } from '../services/userService';
import { getFriendIds } from '../services/profileService';
import { getAllLocations } from '../services/mapService';

export type MapFriend = { id: string; name: string };

/** Usuario actual, amigos y lugares visibles (propios + de amigos) del mapa. */
export function useMapData() {
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [friends, setFriends] = useState<MapFriend[]>([]);

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
      } catch (error) {
        console.error('❌ Error cargando usuario y amigos:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  //fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const loadedLocations = (await getAllLocations()).filter(
          (loc) => loc.createdBy === currentUserId || friendIds.includes(loc.createdBy)
        );
        setLocations(loadedLocations);
      } catch (error) {
        console.error('❌ Error cargando lugares:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUserId) {
      fetchLocations();
    }
  }, [currentUserId, friendIds]);

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

  return { locations, isLoading, currentUserId, friendIds, friends, setFriends, fetchLocationsAgain };
}
