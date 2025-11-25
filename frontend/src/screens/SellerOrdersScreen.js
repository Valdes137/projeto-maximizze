import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function SellerOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const response = await api.get('/orders/all');
      setOrders(response.data);
    } catch (error) {
      alert("Erro ao buscar pedidos");
    } finally {
      setLoading(false);
    }
  }

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.customer}>👤 {item.customer?.email || 'Cliente'}</Text>
        <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <View style={styles.divider} />
      
      {/* Lista de itens dentro do pedido */}
      {item.items.map((orderItem, index) => (
        <Text key={index} style={styles.productItem}>
          • {orderItem.quantity}x {orderItem.product?.name}
        </Text>
      ))}

      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.status}>Status: {item.status}</Text>
        <Text style={styles.total}>R$ {item.total_amount}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>⬅ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pedidos Recebidos</Text>
        <View style={{width: 50}} />
      </View>

      {loading ? (
        <ActivityIndicator color="#AF8EFA" size="large" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma venda ainda.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1D2C' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#25293A', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  backText: { color: '#AF8EFA', fontSize: 16 },
  list: { padding: 20 },
  card: { backgroundColor: '#25293A', padding: 15, borderRadius: 10, marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customer: { color: '#AF8EFA', fontWeight: 'bold', fontSize: 16 },
  date: { color: '#AAA', fontSize: 12 },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 10 },
  productItem: { color: '#E0E0E0', marginBottom: 5 },
  total: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  status: { color: '#AAA', textTransform: 'uppercase', fontSize: 12 },
  empty: { color: '#AAA', textAlign: 'center', marginTop: 50 }
});