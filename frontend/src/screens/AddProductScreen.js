import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker'; // Import da Câmera
import api from '../services/api';
import { initDB, addLocalProduct } from '../services/db';

export default function AddProductScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);

  // --- FUNÇÃO DA CÂMERA LEVE ---
  const pickImage = async () => {
    // Pede permissão
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      return Alert.alert("Erro", "Precisamos da permissão da câmera!");
    }

    // Abre a câmera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Permite cortar
      aspect: [1, 1],      // Foto Quadrada (tipo Instagram)
      quality: 0.15,       // Qualidade menor para reduzir tamanho
      base64: true,        // Converte para texto
    });

    if (!result.canceled) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };
  // -----------------------------

  async function handleCreate() {
    if (!name || !price || !stock) {
      return Alert.alert("Atenção", "Preencha nome, preço e estoque!");
    }

    setLoading(true);
    if (Platform.OS !== 'web') {
      await initDB();
    }
    try {
      const r = await api.post('/products', {
        name,
        description,
        price: parseFloat(price.replace(',', '.')), 
        stock_quantity: parseInt(stock),
        image: image // Envia a foto leve
      });
      if (r?.status === 202 && r?.data?.queued) {
        if (Platform.OS !== 'web') {
          await addLocalProduct({ name, description, price: parseFloat(price.replace(',', '.')), stock_quantity: parseInt(stock), image }, 0);
        }
        Alert.alert("Offline", "Produto salvo no celular e será sincronizado quando a internet voltar.");
      } else {
        Alert.alert("Sucesso", "Produto com foto cadastrado!");
      }
      router.back();

    } catch (error) {
      Alert.alert("Erro", "Falha ao criar produto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Novo Produto</Text>

      <View style={styles.form}>
        
        {/* --- BOTÃO DA FOTO --- */}
        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          {image ? (
            <Image source={{ uri: image }} style={styles.imagePreview} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.cameraIcon}>📸</Text>
              <Text style={styles.cameraText}>Tirar Foto</Text>
            </View>
          )}
        </TouchableOpacity>
        {/* --------------------- */}

        <Text style={styles.label}>Nome</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nome..." placeholderTextColor="#666"/>

        <Text style={styles.label}>Preço (R$)</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0.00" placeholderTextColor="#666"/>

        <Text style={styles.label}>Estoque</Text>
        <TextInput style={styles.input} value={stock} onChangeText={setStock} keyboardType="numeric" placeholder="0" placeholderTextColor="#666"/>

        <Text style={styles.label}>Descrição</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline placeholder="Detalhes..." placeholderTextColor="#666"/>

        <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>SALVAR</Text>}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>CANCELAR</Text>
        </TouchableOpacity>
      </View>
      <View style={{height: 50}} /> 
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1D2C', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#AF8EFA', textAlign: 'center', marginBottom: 20, marginTop: 40 },
  form: { backgroundColor: '#25293A', padding: 20, borderRadius: 10 },
  label: { color: '#E0E0E0', marginBottom: 5, fontWeight: '600' },
  input: { backgroundColor: '#1A1D2C', color: '#FFF', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  textArea: { height: 80, textAlignVertical: 'top' },
  button: { backgroundColor: '#AF8EFA', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontWeight: 'bold' },
  cancelButton: { marginTop: 15, alignItems: 'center' },
  cancelText: { color: '#FF4444' },
  
  // Estilos da Câmera
  imagePicker: { height: 200, backgroundColor: '#1A1D2C', borderRadius: 10, marginBottom: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#AF8EFA', borderStyle: 'dashed' },
  imagePreview: { width: '100%', height: '100%', borderRadius: 10 },
  placeholder: { alignItems: 'center' },
  cameraIcon: { fontSize: 40, marginBottom: 10 },
  cameraText: { color: '#AF8EFA', fontWeight: 'bold' }
});
