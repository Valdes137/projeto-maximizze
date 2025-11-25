import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ScrollView, ActivityIndicator, Platform, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';

export default function SellerProfileTab() {
  const router = useRouter();
  const { signOut } = useAuth() as any;
  
  // Estados
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para Exclusão de Conta
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [passwordToDelete, setPasswordToDelete] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [checkingOrders, setCheckingOrders] = useState(false);

  // Recarrega os dados sempre que a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  async function loadProfile() {
    try {
      console.log("🔄 Buscando perfil do vendedor...");
      const response = await api.get('/auth/profile');
      
      const user = response.data;
      if (user) {
        setName(user.name || '');
        setEmail(user.email || '');
        setAvatar(user.avatar || null);
        setDescription(user.description || '');
      }
    } catch (error) {
      console.error("❌ Erro ao carregar perfil:", error);
    }
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setAvatar(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  async function handleSave() {
    setLoading(true);
    try {
      await api.put('/auth/profile', { name, avatar, description });
      
      const msg = "Perfil atualizado com sucesso!";
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert("Sucesso", msg);
      
    } catch (error) {
      const msg = "Falha ao atualizar.";
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert("Erro", msg);
    } finally {
      setLoading(false);
    }
  }

  // --- LÓGICA DE SAIR ---
  function confirmLogout() {
    if (Platform.OS === 'web') {
      // @ts-ignore
      if (window.confirm("Sair da conta?")) performLogout();
    } else {
      Alert.alert("Sair", "Deseja desconectar?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", style: "destructive", onPress: performLogout }
      ]);
    }
  }

  async function performLogout() {
    try {
      await AsyncStorage.removeItem('role');
      await signOut();
    } catch (error) {
      router.replace('/');
    }
  }

  // --- 1. VERIFICAÇÃO DE VENDAS PENDENTES ---
  async function handleInitiateDelete() {
    setCheckingOrders(true);
    try {
      // Para vendedor, buscamos TODAS as vendas (/orders/all)
      const response = await api.get('/orders/all'); 
      const orders = response.data;

      // Verifica se tem vendas que precisam ser enviadas ou finalizadas
      const activeSales = orders.filter((order: any) => 
        ['pending', 'paid'].includes(order.status)
      );

      setCheckingOrders(false);

      if (activeSales.length > 0) {
        const msg = `Você possui ${activeSales.length} venda(s) em andamento. Finalize ou cancele esses pedidos antes de excluir a conta.`;
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert("Ação Bloqueada", msg);
        return;
      }

      openDeleteModal();

    } catch (error) {
      setCheckingOrders(false);
      console.log("Erro ao verificar vendas:", error);
      // Se der erro (ex: rota não existe), avisa mas permite tentar abrir o modal por segurança
      // Alert.alert("Erro", "Não foi possível verificar suas vendas.");
      openDeleteModal();
    }
  }

  function openDeleteModal() {
    const warningText = "Tem certeza? Essa ação é irreversível e apagará sua loja e produtos.";

    if (Platform.OS === 'web') {
      // @ts-ignore
      if (window.confirm(`EXCLUIR LOJA\n\n${warningText}`)) {
        setDeleteModalVisible(true);
        setPasswordToDelete('');
        setShowPassword(false);
      }
    } else {
      Alert.alert(
        "EXCLUIR LOJA",
        warningText,
        [
          { text: "Cancelar", style: "cancel" },
          { 
            text: "Sim, Excluir", 
            style: "destructive", 
            onPress: () => {
              setDeleteModalVisible(true);
              setPasswordToDelete('');
              setShowPassword(false);
            }
          }
        ]
      );
    }
  }

  // --- 2. CONFIRMAÇÃO E EXCLUSÃO ---
  async function confirmDeleteAccount() {
    if (!passwordToDelete) {
      const msg = "Por favor, digite sua senha para confirmar.";
      return Platform.OS === 'web' ? alert(msg) : Alert.alert("Erro", msg);
    }

    setDeleting(true);
    try {
      await api.delete('/auth/profile', { 
        data: { password: passwordToDelete.trim() } 
      });

      const successMsg = "Conta encerrada ou desativada com sucesso.";
      if (Platform.OS === 'web') alert(successMsg);
      else Alert.alert("Conta Excluída", successMsg);

      setDeleteModalVisible(false);
      await signOut();
      router.replace('/');

    } catch (error: any) {
      console.error(error);
      let errorMsg = "Erro desconhecido ao excluir conta.";
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMsg = "Erro Técnico: Funcionalidade não encontrada.";
        } else if (error.response.status === 401 || error.response.status === 403) {
          errorMsg = "Senha incorreta. Tente novamente.";
        } else {
          errorMsg = error.response.data?.message || "Erro no servidor.";
        }
      }

      if (Platform.OS === 'web') alert(`Erro: ${errorMsg}`);
      else Alert.alert("Falha na Exclusão", errorMsg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 100}}>
      <Text style={styles.title}>Perfil da Loja</Text>

      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={pickImage}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="store" size={40} color="#666" />
            </View>
          )}
          <View style={styles.editIcon}>
            <MaterialCommunityIcons name="pencil" size={16} color="#FFF" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Nome da Loja</Text>
        <TextInput 
            style={styles.input} 
            value={name} 
            onChangeText={setName} 
            placeholder="Ex: Minha Loja Incrível" 
            placeholderTextColor="#666" 
        />

        <Text style={styles.label}>Sobre a Loja</Text>
        <TextInput 
            style={[styles.input, styles.textArea]} 
            value={description} 
            onChangeText={setDescription} 
            placeholder="Descreva o que você vende..." 
            placeholderTextColor="#666" 
            multiline
        />

        <Text style={styles.label}>Email (Fixo)</Text>
        <View style={[styles.input, styles.disabledInput]}>
          <Text style={{color: '#AAA'}}>{email || "Carregando..."}</Text>
          <Ionicons name="lock-closed" size={16} color="#666" />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>SALVAR ALTERAÇÕES</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
          <Text style={styles.logoutText}>SAIR DA CONTA</Text>
        </TouchableOpacity>

        {/* Botão de Excluir Loja */}
        <TouchableOpacity style={styles.deleteAccountButton} onPress={handleInitiateDelete} disabled={checkingOrders}>
          {checkingOrders ? (
            <ActivityIndicator size="small" color="#FF5555" />
          ) : (
            <Text style={styles.deleteAccountText}>Excluir minha loja</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* --- MODAL DE SENHA --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirme sua senha</Text>
            <Text style={styles.modalSubtitle}>Digite sua senha atual para confirmar a exclusão da loja.</Text>
            
            <View style={styles.passwordContainer}>
              <TextInput 
                style={styles.modalInputPassword}
                placeholder="Sua senha atual"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={passwordToDelete}
                onChangeText={setPasswordToDelete}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#AAA" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonCancel} 
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalButtonConfirm} 
                onPress={confirmDeleteAccount}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Excluir</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1D2C', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 30, marginTop: 40, textAlign: 'center' },
  avatarContainer: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#AF8EFA' },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#25293A', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#333' },
  editIcon: { position: 'absolute', bottom: 0, right: '35%', backgroundColor: '#AF8EFA', padding: 8, borderRadius: 20 },
  form: { backgroundColor: '#25293A', padding: 20, borderRadius: 15 },
  label: { color: '#AAA', marginBottom: 8, fontWeight: 'bold' },
  input: { backgroundColor: '#1A1D2C', color: '#FFF', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  textArea: { height: 100, textAlignVertical: 'top' },
  disabledInput: { opacity: 0.7, justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' },
  
  saveButton: { backgroundColor: '#AF8EFA', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  saveText: { color: '#FFF', fontWeight: 'bold' },
  
  logoutButton: { backgroundColor: '#2E2E4E', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  logoutText: { color: '#FFF', fontWeight: 'bold' },

  deleteAccountButton: { marginTop: 20, alignItems: 'center', padding: 10 },
  deleteAccountText: { color: '#FF5555', fontSize: 14, textDecorationLine: 'underline' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#25293A', borderRadius: 20, padding: 20, width: '100%', maxWidth: 400, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 10 },
  modalSubtitle: { fontSize: 14, color: '#AAA', textAlign: 'center', marginBottom: 20 },
  
  passwordContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#1A1D2C', 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#444', 
    marginBottom: 20,
    width: '100%'
  },
  modalInputPassword: { flex: 1, color: '#FFF', padding: 15 },
  eyeIcon: { padding: 10 },

  modalButtons: { flexDirection: 'row', gap: 10, width: '100%' },
  modalButtonCancel: { flex: 1, padding: 15, borderRadius: 10, backgroundColor: '#444', alignItems: 'center' },
  modalButtonConfirm: { flex: 1, padding: 15, borderRadius: 10, backgroundColor: '#FF5555', alignItems: 'center' },
  modalButtonText: { color: '#FFF', fontWeight: 'bold' }
});
