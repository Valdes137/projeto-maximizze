import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../src/services/api';

export default function CustomersTab() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [])
  );

  async function loadCustomers() {
    setLoading(true);
    try {
      const response = await api.get('/orders/customers');
      setCustomers(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  // --- CORREÇÃO AQUI: Adicionei ": any" ---
  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.row}>
        {/* Avatar ou Inicial */}
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarLetter}>
              {item.email ? item.email.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name}>{item.name !== 'Cliente sem nome' ? item.name : 'Cliente'}</Text>
          <Text style={styles.email}>{item.email}</Text>
          <Text style={styles.lastDate}>Última: {new Date(item.lastOrder).toLocaleDateString()}</Text>
        </View>

        <View style={styles.stats}>
          <Text style={styles.totalSpent}>R$ {Number(item.totalSpent).toFixed(2)}</Text>
          <Text style={styles.ordersCount}>{item.ordersCount} pedidos</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus Clientes</Text>

      {loading ? (
        <ActivityIndicator color="#AF8EFA" size="large" style={{marginTop: 50}} />
      ) : (
        <FlatList 
          data={customers}
          keyExtractor={(item: any) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-group-outline" size={60} color="#444" />
              <Text style={styles.empty}>Nenhum cliente ainda.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1D2C', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 20, marginTop: 30 },
  list: { paddingBottom: 80 },
  
  card: { backgroundColor: '#25293A', padding: 15, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#AF8EFA' },
  row: { flexDirection: 'row', alignItems: 'center' },
  
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#333' },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#AF8EFA', fontSize: 24, fontWeight: 'bold' },
  
  info: { flex: 1, marginLeft: 15 },
  name: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  email: { color: '#AAA', fontSize: 12 },
  lastDate: { color: '#666', fontSize: 10, marginTop: 2 },

  stats: { alignItems: 'flex-end' },
  totalSpent: { color: '#4E9F3D', fontWeight: 'bold', fontSize: 16 },
  ordersCount: { color: '#AAA', fontSize: 12 },

  emptyContainer: { alignItems: 'center', marginTop: 50 },
  empty: { color: '#666', marginTop: 10 }
});