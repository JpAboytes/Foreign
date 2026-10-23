import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert, Image, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { createPostRecord, uploadPostImage } from '../../services/postService';
import { useUser } from '../../context/UserContext';
import { useRouter } from 'expo-router';
import { Dimensions } from 'react-native';
import MaxWidthContainer from '../../components/MaxWidthContainer';



export default function createPost() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<any>(null);
  const [caption, setCaption] = useState('');
  const router = useRouter();
  const { height, width } = Dimensions.get('window');
  const { user } = useUser();



  const savePost = async (caption: string, imageUrl: string) => {
    if (!user || !imageUrl) {
      Alert.alert("Faltan datos", "No se puede guardar sin imagen o usuario.");
      return;
    }
  
    try {
      await createPostRecord(user.id, caption, imageUrl);
      Alert.alert("✅ Publicación guardada");
      router.replace('/(drawer)/(tabs)/feed');
    } catch (error) {
      console.error("❌ Error al guardar post:", error);
      Alert.alert("Error", "No se pudo guardar la publicación.");
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      setLoading(true);
      if (!user) throw new Error('Usuario no autenticado');
      const url = await uploadPostImage(uri, user.id);
      setLoading(false);
      return url;
    } catch (err: any) {
      setLoading(false);
      console.log("🔥 Upload Error:", err);
      Alert.alert('Error al subir imagen', err.message || 'Error desconocido');
      return null;
    }
  };

  const manipulateImage = async (uri: string) => {
    return await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1000 } }],
      {
        compress: 0.6,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
  };
  
  const handleImage = async (uri: string) => {
    const processed = await manipulateImage(uri);
    const url = await uploadImage(processed.uri);
    if (url) {
      setUploadedImageUrl(url);
    }
  };
  
  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      await handleImage(photo.uri);
    }
  };

  const pickImageFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      await handleImage(result.assets[0].uri);
    } else {
      Alert.alert('No seleccionaste ninguna imagen');
    }
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Necesitamos tu permiso para usar la cámara</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.text}>Conceder permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{flex: 1}}
    >
      <MaxWidthContainer style={{maxWidth: 800}}>
        <ScrollView 
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.container}>
      
      {!uploadedImageUrl ? ( // 🔥 Si todavía NO tomaste foto
        <View>
          <CameraView style={{ width, height }} facing={facing} ref={cameraRef} />
  
          {/* 🔥 Botones sobre la cámara */}
          <View style={styles.bottomControls}>
            <TouchableOpacity onPress={toggleCameraFacing} style={styles.flipButton}>
              <Text style={styles.text}>🔄</Text>
            </TouchableOpacity>
  
            <TouchableOpacity onPress={takePhoto} style={styles.captureButton}>
              <View style={styles.innerCircle} />
            </TouchableOpacity>
  
            <TouchableOpacity onPress={pickImageFromLibrary} style={styles.galleryButton}>
              <Text style={styles.text}>📁</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : ( // 🔥 Si ya tomaste foto
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.previewContainer}>
            <Text style={styles.text}>Imagen subida</Text>
            <Image source={{ uri: uploadedImageUrl }} style={styles.imagePreview} />
  
            <Text style={[styles.text, { marginTop: 10 }]}>Escribe un caption:</Text>
            <TextInput
              style={styles.input}
              placeholder="¿Qué estás pensando?"
              placeholderTextColor="#888"
              onChangeText={setCaption}
              value={caption}
            />
  
    
  
            <TouchableOpacity
              onPress={() => savePost(caption, uploadedImageUrl)}
              style={[styles.galleryButton, { marginTop: 20 }]}
            >
              <Text style={styles.text}>📤 Publicar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
      </ScrollView>
      </MaxWidthContainer>
    </KeyboardAvoidingView>
  );
  
  
}

const styles = StyleSheet.create({
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#121212', // Fondo más elegante
    paddingHorizontal: 16,
  },
  message: {
    textAlign: 'center',
    padding: 20,
    color: 'white',
    fontSize: 16,
  },
  permissionButton: {
    backgroundColor: '#4f0c2e',
    padding: 12,
    marginHorizontal: 40,
    borderRadius: 8,
    alignItems: 'center',
  },
  camera: {
    height: 450,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16, // un pequeño margen arriba de los botones
  },  
  flipButton: {
    backgroundColor: '#4f0c2e',
    padding: 12,
    borderRadius: 50,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#4f0c2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 40,
    height: 40,
    backgroundColor: '#4f0c2e',
    borderRadius: 20,
  },
  galleryButton: {
    backgroundColor: '#4f0c2e',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },
  previewContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  imagePreview: {
    width: 320,
    height: 320,
    borderRadius: 16,
    marginTop: 10,
  },
  text: {
    fontSize: 16,
    color: 'white',
  },
  loadingText: {
    color: '#ccc',
    textAlign: 'center',
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#4f0c2e',
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 10,
    color: '#fff',
    width: '90%',
    marginTop: 12,
    fontSize: 16,
  },
});
