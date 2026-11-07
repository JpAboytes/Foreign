import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Marker } from 'react-native-maps';

type Props = {
  place: any;
  pinColor: string;
  onPress: () => void;
};

export default function PlaceMarker({ place, pinColor, onPress }: Props) {
  return (
    <Marker
      coordinate={place.geoPoint}
      title={place.title}
      description={place.description}
      pinColor={pinColor}
      onPress={onPress}
    >
      <View style={{
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: 'white',
        backgroundColor: '#2a2a2a',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
      }}>
        {place.imageUrl ? (
          <Image cachePolicy="memory-disk" transition={200} source={{ uri: place.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
            {place.title.charAt(0)}
          </Text>
        )}
      </View>
    </Marker>
  );
}
