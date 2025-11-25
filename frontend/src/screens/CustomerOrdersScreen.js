import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';

export default function CustomerOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyOrders();
  }, []);

  async function fetchMyOrders() {
    try {
      const response = await api.get('/orders/my-orders');
      setOrders(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#FFB344'; // Laranja
      case 'preparing': return '#AF8EFA'; // Roxo
      case 'delivering': return '#4E9F3D'; // Verde
      case 'delivered': return '#AAA'; // Cinza
      default: return '#FFF';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'Pendente';
      case 'preparing': return 'Em Preparação';
      case 'delivering': return 'Saiu para Entrega';
      case 'delivered': return 'Entregue';
      default: return status;
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      {item.items.map((i, index) => (
        <Text key={index} style={styles.itemText}>
          {i.quantity}x {i.product?.name}
        </Text>
      ))}

      <View style={styles.footer}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalValue}>R$ {item.total_amount}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>⬅ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Minhas Compras</Text>
        <View style={{width: 50}} />
      </View>

      {loading ? <ActivityIndicator color="#AF8EFA" style={{marginTop: 50}} /> : (
        <FlatList 
          data={orders}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Você ainda não fez pedidos.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1D2C' },
  navHeader: { padding: 20, paddingTop: 50, backgroundColor: '#25293A', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  backText: { color: '#AF8EFA', fontSize: 16 },
  list: { padding: 20 },
  empty: { color: '#AAA', textAlign: 'center', marginTop: 50 },
  
  card: { backgroundColor: '#25293A', padding: 15, borderRadius: 10, marginBottom: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  date: { color: '#AAA' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  itemText: { color: '#E0E0E0', marginBottom: 2, fontSize: 16 },
  footer: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { color: '#AAA' },
  totalValue: { color: '#AF8EFA', fontWeight: 'bold', fontSize: 18 }
});