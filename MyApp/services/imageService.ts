import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase/client';

// Interfaces
export interface ImagePickerOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}

// Seleccionar imagen de la galería
export const pickImageFromLibrary = async (options: ImagePickerOptions = {}): Promise<string | null> => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect,
      quality: options.quality ?? 1,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }
    
    return null;
  } catch (error) {
    console.error('Error seleccionando imagen:', error);
    throw error;
  }
};

// Procesar imagen para optimizarla
export const processImage = async (
  uri: string, 
  options: { width?: number; quality?: number } = {}
): Promise<string> => {
  try {
    const processed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: options.width || 1000 } }],
      { compress: options.quality || 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    return processed.uri;
  } catch (error) {
    console.error('Error procesando imagen:', error);
    throw error;
  }
};

// Subir imagen a un bucket de Supabase Storage. Las políticas solo permiten escribir
// en la carpeta del propio usuario, así que el path debe empezar con su id.
export const uploadImageToSupabase = async (
  uri: string,
  bucket: 'avatars' | 'post-images',
  path: string,
  processOptions: { width?: number; quality?: number } = {}
): Promise<string> => {
  try {
    const processedUri = await processImage(uri, processOptions);
    const body = await (await fetch(processedUri)).arrayBuffer();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, body, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;

    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  } catch (error) {
    console.error('Error subiendo imagen a Supabase:', error);
    throw error;
  }
};

// Subir imagen de perfil del usuario autenticado
export const uploadProfileImage = async (
  uri: string,
  userId: string
): Promise<string> => {
  const path = `${userId}/avatar-${Date.now()}.jpg`;
  return await uploadImageToSupabase(uri, 'avatars', path, { width: 800, quality: 0.8 });
};
