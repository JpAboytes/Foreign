// MapScreen.tsx
import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useMapData } from '../../../hooks/useMapData';
import { useMapFilters } from '../../../hooks/useMapFilters';
import { useUserLocation } from '../../../hooks/useUserLocation';
import { usePlaceDetail } from '../../../hooks/usePlaceDetail';
import { useAddPlace } from '../../../hooks/useAddPlace';
import { useRaiteFlow } from '../../../hooks/useRaiteFlow';
import { getPinColor, filterLocationsByTypes } from '../../../utils/mapPins';
import { mapStyle, LATITUDE_DELTA, LONGITUDE_DELTA } from '../../../components/map/mapStyle';
import { styles } from '../../../components/map/mapScreenStyles';
import MapWebFallback from '../../../components/map/MapWebFallback';
import PlaceMarker from '../../../components/map/PlaceMarker';
import RaiteRouteOverlay from '../../../components/map/RaiteRouteOverlay';
import PlaceDetailModal from '../../../components/map/PlaceDetailModal';
import AddPlaceModal from '../../../components/map/AddPlaceModal';
import FriendSelectionModal from '../../../components/map/FriendSelectionModal';
import RaiteConfirmModal from '../../../components/map/RaiteConfirmModal';
import RaiteAlertModal from '../../../components/map/RaiteAlertModal';

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);

  const { locations, isLoading, currentUserId, friendIds, friends, setFriends, fetchLocationsAgain } = useMapData();
  const { confirmedTypes } = useMapFilters();
  const userLocation = useUserLocation();
  const place = usePlaceDetail();
  const add = useAddPlace(currentUserId, fetchLocationsAgain);
  const raite = useRaiteFlow(currentUserId, userLocation, setFriends);

  const filteredLocations = filterLocationsByTypes(locations, confirmedTypes);

  // Early return for web platform
  if (Platform.OS === 'web') {
    return <MapWebFallback />;
  }

  // Si no se ha obtenido la ubicación, mostramos un indicador.
  if (!userLocation) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#bb86fc" />
        <Text style={styles.loadingText}>Cargando ubicación...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Mapa */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }}
          onLongPress={add.handleLongPress}
          onPress={raite.isRaiteActive ? raite.handleMapPress : undefined}
          customMapStyle={mapStyle}
        >
          {/* Marker de usuario */}
          <Marker coordinate={userLocation} title="Tú" />

          {/* Markers de ubicaciones */}
          {filteredLocations.map((loc) => (
            <PlaceMarker
              key={loc.id}
              place={loc}
              pinColor={getPinColor(loc.createdBy, currentUserId, friendIds)}
              onPress={() => place.openPlace(loc)}
            />
          ))}

          {/* Marker de raite */}
          {raite.isRaiteActive && raite.selectedRaitePlace && (
            <Marker coordinate={raite.selectedRaitePlace} pinColor="orange" title="Lugar para Raite" />
          )}

          {raite.selectedFriendRaite && (
            <RaiteRouteOverlay from={userLocation} to={raite.selectedFriendRaite.to} />
          )}
        </MapView>

        {/* Pill badge for raite requests */}
        {raite.friendRaiteRequests.length > 0 && (
          <TouchableOpacity style={styles.pillBadge} onPress={raite.openFirstRequest}>
            <Ionicons name="car-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.pillBadgeText}>1 Solicitud de raite</Text>
          </TouchableOpacity>
        )}

        {/* Loading si está cargando */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#bb86fc" />
            <Text style={styles.loadingText}>Buscando lugares...</Text>
          </View>
        )}
      </View>

      {/* Botón para "Agregar Lugar" */}
      <TouchableOpacity
        style={[
          styles.addButton,
          add.isAddingPlace && { backgroundColor: '#333', borderWidth: 2, borderColor: '#bb86fc' },
        ]}
        onPress={add.toggleAddingPlace}
      >
        <Text style={[styles.addButtonText, add.isAddingPlace && { color: '#bb86fc' }]}>
          {add.isAddingPlace ? 'Cancelar' : 'Agregar Lugar'}
        </Text>
      </TouchableOpacity>

      {/* Botón Pedir Raite */}
      <TouchableOpacity
        style={[
          styles.raiteButton,
          raite.isRaiteActive && { backgroundColor: '#333', borderWidth: 2, borderColor: '#FF4081' },
        ]}
        onPress={raite.toggleRaiteMode}
      >
        <Text style={[styles.raiteButtonText, raite.isRaiteActive && { color: '#FF4081' }]}>
          {raite.isRaiteActive ? 'Cancelar Raite' : 'Pedir Raite'}
        </Text>
      </TouchableOpacity>

      {/* --- MODALES --- */}
      <PlaceDetailModal
        visible={place.placeModalVisible}
        place={place.selectedPlace}
        owner={place.placeOwner}
        onClose={place.closePlace}
      />

      <AddPlaceModal
        visible={add.modalVisible}
        name={add.manualMarkerName}
        onChangeName={add.setManualMarkerName}
        description={add.manualMarkerDescription}
        onChangeDescription={add.setManualMarkerDescription}
        images={add.selectedImages}
        onPickImages={add.pickImagesFromLibrary}
        stars={add.stars}
        onChangeStars={add.setStars}
        onCancel={add.cancelAddPlace}
        onSave={add.handleAddManualMarker}
      />

      <FriendSelectionModal
        visible={raite.friendSelectionModalVisible}
        friends={friends}
        selectedFriends={raite.selectedFriends}
        onToggle={raite.toggleFriendSelection}
        onCancel={() => raite.setFriendSelectionModalVisible(false)}
        onSend={raite.sendRaiteRequest}
      />

      <RaiteConfirmModal
        visible={raite.raiteConfirmModalVisible}
        hasPlace={!!raite.selectedRaitePlace}
        onCancel={raite.cancelRaiteRequest}
        onConfirm={raite.confirmRaiteRequest}
      />

      <RaiteAlertModal
        visible={raite.raiteAlertModalVisible}
        friendName={raite.selectedFriendRaite ? raite.selectedFriendRaite.friendName : null}
        onReject={raite.rejectRaiteAlert}
        onAccept={raite.handleAcceptRaite}
        onViewRoute={() => raite.setRaiteAlertModalVisible(false)}
      />
    </SafeAreaView>
  );
}
