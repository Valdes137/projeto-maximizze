import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ScrollView, ActivityIndicator, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';

export default function CustomerProfile() {
  const router = useRouter();
  const { signOut } = useAuth() as any;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [passwordToDelete, setPasswordToDelete] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const response = await api.get('/auth/profile');
      const user = response.data;

      setName(user.name || '');
      setEmail(user.email || '');
      setCpf(user.cpf || '');
      setZipCode(user.zip_code || '');
      setAvatar(user.avatar || null);

    } catch (error) {
      console.log("Erro ao carregar perfil:", error);
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
    if (!name.trim()) {
      const msg = "O nome é obrigatório.";
      return Platform.OS === 'web' ? alert(msg) : Alert.alert("Atenção", msg);
    }

    setLoading(true);
    try {
      await api.put('/auth/profile', {
        name,
        avatar,
        cpf,
        zip_code: zipCode
      });

      const msg = "Seus dados foram atualizados!";
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Sucesso", msg);
    } catch (error) {
      console.error(error);
      const msg = "Falha ao atualizar perfil.";
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Erro", msg);
    } finally {
      setLoading(false);
    }
  }

  function confirmLogout() {
    if (Platform.OS === 'web') {
      // @ts-ignore
      if (window.confirm("Deseja realmente sair?")) {
        signOut();
      }
    } else {
      Alert.alert("Sair", "Deseja sair da sua conta?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", style: "destructive", onPress: signOut }
      ]);
    }
  }

  function initiateDeleteAccount() {
    const warning = "Tem certeza? Essa ação é irreversível.";

    if (Platform.OS === 'web') {
      // @ts-ignore
      if (window.confirm(warning)) {
        setDeleteModalVisible(true);
        setPasswordToDelete('');
      }
    } else {
      Alert.alert("EXCLUIR CONTA", warning, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, Excluir",
          style: "destructive",
          onPress: () => {
            setDeleteModalVisible(true);
            setPasswordToDelete('');
          }
        }
      ]);
    }
  }

  async function confirmDeleteAccount() {
    if (!passwordToDelete) {
      const msg = "Digite sua senha para confirmar.";
      return Platform.OS === 'web' ? alert(msg) : Alert.alert("Erro", msg);
    }

    setDeleting(true);

    try {
      await api.delete('/auth/profile', {
        data: { password: passwordToDelete }
      });

      setDeleteModalVisible(false);
      signOut();

    } catch (error: any) {
      console.error(error);

      let msg = "Erro ao excluir conta.";

      if (error.response?.status === 401 || error.response?.status === 403)
        msg = "Senha incorreta.";
      else if (error.response?.status === 404)
        msg = "Rota não encontrada no servidor.";

      Platform.OS === 'web' ? alert(msg) : Alert.alert("Erro", msg);

    } finally {
      setDeleting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={styles.headerTitle}>Meu Perfil</Text>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={50} color="#AAA" />
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={18} color="#FFF" />
          </View>
        </TouchableOpacity>
        <Text style={styles.roleText}>CLIENTE</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Nome Completo</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>CPF</Text>
        <TextInput style={styles.input} value={cpf} onChangeText={setCpf} keyboardType="numeric" />

        <Text style={styles.label}>Endereço / CEP</Text>
        <TextInput style={styles.input} value={zipCode} onChangeText={setZipCode} />

        <Text style={styles.label}>Email (Não pode ser alterado)</Text>
        <View style={[styles.input, styles.disabledInput]}>
          <Text style={{ color: '#AAA' }}>{email}</Text>
          <Ionicons name="lock-closed" size={16} color="#666" />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>SALVAR</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
          <Text style={styles.logoutText}>SAIR</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteAccountButton} onPress={initiateDeleteAccount}>
          <Text style={styles.deleteAccountText}>Excluir minha conta</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirme sua senha</Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.modalInputPassword}
                placeholder="Sua senha"
                secureTextEntry={!showPassword}
                value={passwordToDelete}
                onChangeText={setPasswordToDelete}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#AAA" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalButtonConfirm} onPress={confirmDeleteAccount}>
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
  container: { flex: 1, backgroundColor: '#1A1D2C', paddingTop: 50 },
  headerTitle: { textAlign: 'center', fontSize: 24, color: '#FFF', fontWeight: 'bold', marginBottom: 30 },

  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#A884F3' },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#25293A', alignItems: 'center', justifyContent: 'center' },

  cameraIcon: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#A884F3', padding: 8, borderRadius: 20 },

  roleText: { marginTop: 10, color: '#AAA', fontWeight: 'bold', fontSize: 12 },

  form: { paddingHorizontal: 20 },
  label: { color: '#AAA', marginBottom: 6 },
  input: { backgroundColor: '#25293A', padding: 16, color: '#FFF', borderRadius: 12, marginBottom: 20 },

  disabledInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  saveButton: { backgroundColor: '#A884F3', borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 20 },
  saveText: { fontWeight: 'bold', color: '#FFF', fontSize: 16 },

  logoutButton: { backgroundColor: '#2E2E4E', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  logoutText: { color: '#FFF', fontWeight: 'bold' },

  deleteAccountButton: { alignItems: 'center', padding: 10 },
  deleteAccountText: { color: '#FF5555', textDecorationLine: 'underline' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#25293A', padding: 20, borderRadius: 20, width: '100%', maxWidth: 350 },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },

  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1D2C', paddingHorizontal: 10, borderRadius: 10, marginBottom: 20 },

  modalInputPassword: { flex: 1, color: '#FFF', padding: 14 },

  modalButtons: { flexDirection: 'row', gap: 10 },
  modalButtonCancel: { flex: 1, padding: 14, backgroundColor: '#444', borderRadius: 10, alignItems: 'center' },
  modalButtonConfirm: { flex: 1, padding: 14, backgroundColor: '#FF5555', borderRadius: 10, alignItems: 'center' },
  modalButtonText: { color: '#FFF', fontWeight: 'bold' }
});
