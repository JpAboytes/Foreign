import React, { useState, useEffect } from 'react';
import { Text, TextInput, TouchableOpacity, Alert, StyleSheet, View } from 'react-native';
import { getEditableItem, updateEditableItem } from '../../../services/adminService';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function EditItem() {
  const params = useLocalSearchParams();
  // Garantizar que los parámetros sean strings
  const itemId = typeof params.itemId === 'string' ? params.itemId : '';
  const category = typeof params.category === 'string' ? params.category : '';
  
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [areasInput, setAreasInput] = useState('');

  // Solo estudiantes y mentores se editan aquí; posts, ubicaciones y foros solo se moderan (eliminar).
  const editable = category === 'users' || category === 'mentors';

  useEffect(() => {
    if (!itemId || !editable) return;

    (async () => {
      try {
        const data = await getEditableItem(category as 'users' | 'mentors', itemId);
        setName(data.name);
        if (category === 'mentors') {
          setAreasInput(data.areas.join(', '));
        }
      } catch (error) {
        console.error('Error al cargar el elemento:', error);
        Alert.alert('Error', 'No se pudo cargar el elemento');
      }
    })();
  }, [itemId, category]);

  const handleUpdate = async () => {
    if (!name.trim()) return Alert.alert('El nombre es obligatorio');
    try {
      await updateEditableItem(category as 'users' | 'mentors', itemId, {
        name: name.trim(),
        areas:
          category === 'mentors'
            ? areasInput.split(',').map(a => a.trim()).filter(a => a)
            : undefined,
      });
      router.back();
    } catch (error) {
      console.error('Error al guardar:', error);
      Alert.alert('Error', 'No se pudieron guardar los cambios');
    }
  };

  if (!editable) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Este tipo de elemento no se edita desde el panel. Puedes eliminarlo desde la lista.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Campos comunes */}
      <Text style={styles.label}>Nombre</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      {/* Solo para mentores */}
      {category === 'mentors' && (
        <>
          <Text style={styles.label}>Áreas (coma separadas)</Text>
          <TextInput
            style={styles.input}
            value={areasInput}
            onChangeText={setAreasInput}
            placeholder="Ej. Deportes, Tecnología"
            placeholderTextColor="#666"
          />
        </>
      )}

      <TouchableOpacity style={styles.button} onPress={handleUpdate}>
        <Text style={styles.buttonText}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:'#000' },
  label: { color:'#fff', marginTop:12 },
  input: { borderWidth:1, borderColor:'#444', color:'#fff', padding:8, marginTop:4, borderRadius:4 },
  button: { backgroundColor:'#b388ff', padding:12, borderRadius:6, marginTop:20, alignItems:'center' },
  buttonText: { color:'#000', fontWeight:'bold' },
});