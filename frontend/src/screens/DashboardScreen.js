import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';

export default function CustomerProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Dados do Usuário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [zipCode, setZipCode] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const response = await api.get('/auth/me');
      const u = response.data;
      setName(u.name || '');
      setEmail(u.email || '');
      setCpf(u.cpf || '');
      setPhone(u.phone || '');
      setZipCode(u.zip_code || '');
    } catch (error) {
      console.log(error);
    }
  }

  async function handleSave() {
    setLoading(true);
    try {
      await api.put('/auth/profile', { 
        name, 
        cpf, 
        phone, 
        zip_code: zipCode 
      });
      
      if (Platform.OS === 'web') alert("Dados atualizados!");
      else Alert.alert("Sucesso", "Dados atualizados!");
      
    } catch (error) {
      if (Platform.OS === 'web') alert("Erro ao salvar.");
      else Alert.alert("Erro", "Falha ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  // --- FUNÇÃO DE SAIR ---
  function confirmLogout() {
    if (Platform.OS === 'web') {
      // @ts-ignore
      if (window.confirm("Sair da conta?")) performLogout();
    } else {
      Alert.alert("Sair", "Deseja sair da conta?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", style: "destructive", onPress: performLogout }
      ]);
    }
  }

  async function performLogout() {
    try {
      await AsyncStorage.removeItem('token');
      
      if (Platform.OS === 'web') {
        window.location.reload();
      } else {
        router.replace('/');
      }
    } catch (error) {
      router.replace('/');
    }
  }
  // ---------------------

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 100}}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>⬅ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Meus Dados</Text>
        <View style={{width: 50}} /> 
      </View>

      <View style={styles.avatarArea}>
        <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="account" size={50} color="#FFF" />
        </View>
        <Text style={styles.emailText}>{email}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Nome Completo</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Seu nome" placeholderTextColor="#666" />

        <Text style={styles.label}>CPF</Text>
        <TextInput style={styles.input} value={cpf} onChangeText={setCpf} placeholder="000.000.000-00" placeholderTextColor="#666" keyboardType="numeric" />

        <Text style={styles.label}>Telefone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="(00) 00000-0000" placeholderTextColor="#666" keyboardType="phone-pad" />

        <Text style={styles.label}>CEP (Endereço Padrão)</Text>
        <TextInput style={styles.input} value={zipCode} onChangeText={setZipCode} placeholder="00000-000" placeholderTextColor="#666" keyboardType="numeric" />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>SALVAR DADOS</Text>}
        </TouchableOpacity>

        {/* BOTÃO DE SAIR */}
        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
          <Text style={styles.logoutText}>SAIR DA CONTA</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1D2C' },
  header: { padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#25293A' },
  backText: { color: '#AF8EFA', fontSize: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  
  avatarArea: { alignItems: 'center', marginVertical: 30 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#25293A', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#AF8EFA' },
  emailText: { color: '#AAA', marginTop: 10, fontSize: 14 },

  form: { padding: 20 },
  label: { color: '#AAA', marginBottom: 5, fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  input: { backgroundColor: '#25293A', color: '#FFF', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  
  saveButton: { backgroundColor: '#AF8EFA', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  saveText: { color: '#FFF', fontWeight: 'bold' },
  logoutButton: { backgroundColor: '#FF4444', padding: 15, borderRadius: 10, alignItems: 'center' },
  logoutText: { color: '#FFF', fontWeight: 'bold' }
});