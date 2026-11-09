export const FRIEND_PIN_COLORS = ['#42A5F5', '#66BB6A', '#FFA726', '#EF5350'];

/** Color del pin según el autor: propio, amigo (por índice) o amarillo si excede la paleta. */
export function getPinColor(createdBy: string, currentUserId: string | null, friendIds: string[]): string {
  if (createdBy === currentUserId) return '#4f0c2e'; // Mi lugar
  const friendIndex = friendIds.indexOf(createdBy);
  return FRIEND_PIN_COLORS[friendIndex % FRIEND_PIN_COLORS.length] || '#FFCA28';
}

/** Filtra lugares por tipos confirmados; sin tipos devuelve todos. */
export function filterLocationsByTypes<T extends { type: string[] }>(locations: T[], confirmedTypes: string[]): T[] {
  return locations.filter((place) => {
    if (confirmedTypes.length === 0) return true;
    return place.type.some((t) => confirmedTypes.includes(t));
  });
}

/** Lugares visibles: los del usuario actual y los de sus amigos. */
export function filterVisibleLocations<T extends { createdBy: string }>(
  locations: T[],
  currentUserId: string | null,
  friendIds: string[]
): T[] {
  return locations.filter((loc) => loc.createdBy === currentUserId || friendIds.includes(loc.createdBy));
}
