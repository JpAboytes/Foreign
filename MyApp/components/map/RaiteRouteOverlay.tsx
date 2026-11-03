import React from 'react';
import { View } from 'react-native';
import { Marker, Polyline, LatLng } from 'react-native-maps';

type Props = { from: LatLng; to: LatLng };

export default function RaiteRouteOverlay({ from, to }: Props) {
  return (
    <>
      {/* Línea principal */}
      <Polyline
        coordinates={[from, to]}
        strokeColor="#4f0c2e"
        strokeWidth={4}
        lineCap="round"
        lineJoin="round"
      />

      {/* Punto de inicio */}
      <Marker coordinate={from} anchor={{ x: 0.5, y: 0.5 }}>
        <View style={{
          width: 15,
          height: 15,
          borderRadius: 7.5,
          backgroundColor: '#4CAF50',
          borderWidth: 2,
          borderColor: 'white',
        }} />
      </Marker>

      {/* Punto de destino */}
      <Marker coordinate={to} anchor={{ x: 0.5, y: 0.5 }}>
        <View style={{
          width: 15,
          height: 15,
          borderRadius: 7.5,
          backgroundColor: '#F44336',
          borderWidth: 2,
          borderColor: 'white',
        }} />
      </Marker>
    </>
  );
}
