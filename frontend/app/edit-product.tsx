import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router'; 
import api from '../src/services/api';

export default function EditProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(false);
  
  const toStringParam = (v: any): string => {
    if (Array.isArray(v)) return String(v?.[0] ?? '');
    return String(v ?? '');
  };

  const [name, setName] = useState<string>(toStringParam(params.name));
  const [price, setPrice] = useState<string>(toStringParam(params.price)); 
  const [stock, setStock] = useState<string>(toStringParam(params.stock_quantity));
  const [description, setDescription] = useState<string>(toStringParam(params.description));

  async function handleUpdate() {
    if (!name || !price || !stock) {
      return Alert.alert("Atenção", "Preencha nome, preço e estoque!");
    }

    setLoading(true);
    try {
      const idStr = toStringParam(params.id);
      await api.put(`/products/${idStr}`, {
        name,
        description,
        price: parseFloat(price.replace(',', '.')),
        stock_quantity: parseInt(stock)
      });

      Alert.alert("Sucesso", "Produto atualizado!");
      router.back(); 

    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar produto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Produto</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Nome</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>Preço (R$)</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />

        <Text style={styles.label}>Estoque</Text>
        <TextInput style={styles.input} value={stock} onChangeText={setStock} keyboardType="numeric" />

        <Text style={styles.label}>Descrição</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline />

        <TouchableOpacity style={styles.button} onPress={handleUpdate} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>SALVAR ALTERAÇÕES</Text>}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>CANCELAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1D2C', padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#AF8EFA', textAlign: 'center', marginBottom: 20 },
  form: { backgroundColor: '#25293A', padding: 20, borderRadius: 10 },
  label: { color: '#E0E0E0', marginBottom: 5, fontWeight: '600' },
  input: { backgroundColor: '#1A1D2C', color: '#FFF', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  textArea: { height: 80, textAlignVertical: 'top' },
  button: { backgroundColor: '#AF8EFA', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontWeight: 'bold' },
  cancelButton: { marginTop: 15, alignItems: 'center' },
  cancelText: { color: '#FF4444' }
});
