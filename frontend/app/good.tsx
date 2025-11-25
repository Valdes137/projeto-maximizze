import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, FlatList, Modal, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../src/services/api';
import { useAuth } from '../src/contexts/AuthContext';

export default function GoodAdmin() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');

  function clearUser(id: number) {
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  function clearList() {
    setUsers([]);
    setQuery('');
  }

  async function loadUsers() {
    setLoading(true);
    try {
      const r = await api.get(`/admin/users`, { params: { q: query } });
      setUsers(r.data || []);
    } catch (error: any) {
      const status = error?.response?.status;
      const msg = error?.response?.data?.message || 'Falha ao carregar';
      if (status === 403 || status === 401) {
        Alert.alert('Acesso negado', 'Faça login com pablo@good.com');
        router.replace('/');
        return;
      }
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  async function saveUser(u: any) {
    try {
      await api.put(`/admin/users/${u.id}`, {
        name: u.name,
        email: u.email,
        role: u.role,
        is_active: u.is_active,
        security_question: u.security_question
      });
      setEditing(null);
      await loadUsers();
      Alert.alert('Sucesso', 'Usuário atualizado');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Falha ao salvar';
      Alert.alert('Erro', msg);
    }
  }

  async function deleteUser(id: number) {
    try {
      const r = await api.delete(`/admin/users/${id}`);
      await loadUsers();
      Alert.alert('Sucesso', r?.data?.message || 'Operação concluída');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Falha ao excluir';
      Alert.alert('Erro', msg);
    }
  }

  async function resetPassword(id: number) {
    if (!newPassword || newPassword.length < 6) return Alert.alert('Atenção', 'Senha deve ter ao menos 6 caracteres');
    try {
      await api.post(`/admin/users/${id}/reset-password`, { new_password: newPassword });
      setNewPassword('');
      Alert.alert('Sucesso', 'Senha atualizada');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Falha ao atualizar senha';
      Alert.alert('Erro', msg);
    }
  }

  async function reactivateUser(id: number) {
    try {
      await api.put(`/admin/users/${id}`, { is_active: true });
      await loadUsers();
      Alert.alert('Sucesso', 'Usuário reativado');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Falha ao reativar';
      Alert.alert('Erro', msg);
    }
  }

  return (
    <SafeAreaView style={[styles.container, Platform.OS === 'ios' ? { paddingTop: 0 } : null]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>GOOD Admin</Text>
        <TouchableOpacity style={styles.buttonAlt} onPress={signOut}>
          <Text style={styles.buttonText}>SAIR</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.searchRow}>
        <TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder="Buscar por nome ou email" placeholderTextColor="#666" blurOnSubmit returnKeyType="search" onSubmitEditing={loadUsers} />
        <TouchableOpacity style={styles.button} onPress={loadUsers}><Text style={styles.buttonText}>BUSCAR</Text></TouchableOpacity>
        <TouchableOpacity style={styles.buttonAlt} onPress={clearList}><Text style={styles.buttonText}>LIMPAR LISTA</Text></TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color="#AF8EFA" /> : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.itemTitle}>{item.name || 'Sem nome'}</Text>
              <Text style={styles.itemText}>{item.email}</Text>
              <Text style={styles.itemText}>Role: {item.role}</Text>
              <Text style={styles.itemText}>Ativo: {item.is_active ? 'Sim' : 'Não'}</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.smallButton} onPress={() => setEditing({ ...item })}><Text style={styles.smallButtonText}>Editar</Text></TouchableOpacity>
                <TouchableOpacity style={styles.smallButton} onPress={() => deleteUser(item.id)}><Text style={styles.smallButtonText}>Excluir</Text></TouchableOpacity>
                <TouchableOpacity style={styles.smallButton} onPress={() => clearUser(item.id)}><Text style={styles.smallButtonText}>Limpar da lista</Text></TouchableOpacity>
                {!item.is_active && (
                  <TouchableOpacity style={styles.smallButton} onPress={() => reactivateUser(item.id)}>
                    <Text style={styles.smallButtonText}>Reativar</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.resetRow}>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Nova senha"
                  placeholderTextColor="#666"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="none"
                  autoComplete="off"
                  blurOnSubmit
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                <TouchableOpacity style={styles.smallButton} onPress={() => resetPassword(item.id)}><Text style={styles.smallButtonText}>Salvar senha</Text></TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={!!editing} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar Usuário</Text>
            {editing && (
              <>
                <TextInput style={styles.input} value={editing.name || ''} onChangeText={(t) => setEditing({ ...editing, name: t })} placeholder="Nome" placeholderTextColor="#666" autoCorrect={false} textContentType="none" autoComplete="off" blurOnSubmit returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />
                <TextInput style={styles.input} value={editing.email || ''} onChangeText={(t) => setEditing({ ...editing, email: t })} placeholder="Email" placeholderTextColor="#666" autoCapitalize="none" autoCorrect={false} textContentType="none" autoComplete="off" blurOnSubmit returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.smallButton} onPress={() => setEditing(null)}><Text style={styles.smallButtonText}>Cancelar</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.smallButton} onPress={() => saveUser(editing)}><Text style={styles.smallButtonText}>Salvar</Text></TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E111A', paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { color: '#AF8EFA', fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  input: { backgroundColor: '#1A1D2C', color: '#FFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333', flex: 1 },
  button: { backgroundColor: '#AF8EFA', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  buttonAlt: { backgroundColor: '#2A2E40', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFF', fontWeight: 'bold' },
  card: { backgroundColor: '#151826', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#262A3F' },
  itemTitle: { color: '#E0E0E0', fontWeight: 'bold', marginBottom: 4 },
  itemText: { color: '#AAA', marginBottom: 2 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  smallButton: { backgroundColor: '#2A2E40', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  smallButtonText: { color: '#FFF', fontWeight: '600' },
  resetRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '92%', maxWidth: 480, backgroundColor: '#151826', borderRadius: 10, padding: 16 },
  modalTitle: { color: '#AF8EFA', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }
});
