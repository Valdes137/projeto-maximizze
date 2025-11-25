import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router'; // <--- Importar useLocalSearchParams
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../src/services/api';

export default function OrdersTab() {
  // Pega os parâmetros enviados pela navegação (ex: status='pending')
  const params = useLocalSearchParams();
  
  type Status = 'pending' | 'preparing' | 'delivering' | 'delivered';
  interface OrderItemRef {
    quantity: number;
    product?: { name?: string } | null;
  }
  interface OrderRef {
    id: number;
    status: Status | string;
    total_amount: number;
    address?: string | null;
    items?: OrderItemRef[];
    customer?: { name?: string; email?: string } | null;
  }

  const [orders, setOrders] = useState<OrderRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status>('pending');

  // --- EFEITO MÁGICO ---
  // Toda vez que a tela ganha foco ou os parâmetros mudam, atualiza o filtro
  useFocusEffect(
    useCallback(() => {
      const raw = Array.isArray(params.status) ? params.status[0] : params.status;
      const allowed: Status[] = ['pending', 'preparing', 'delivering', 'delivered'];
      if (raw && allowed.includes(raw as Status)) {
        setFilter(raw as Status);
      }
      loadOrders();
    }, [params.status]) // Escuta mudanças no params
  );
  // ---------------------

  async function loadOrders() {
    setLoading(true);
    try {
      const response = await api.get('/orders/all');
      const data = response?.data || [];
      setOrders(data);
    } catch (error) {
      console.log("Erro ao carregar pedidos:", error);
      setOrders([]); 
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(orderId: number, newStatus: Status) {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      loadOrders(); 
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar o status.");
    }
  }

  const safeOrders: OrderRef[] = Array.isArray(orders) ? orders : [];
  const filteredOrders = safeOrders.filter(o => o.status === filter);

  const FilterBadge = ({ title, status, icon }: { title: string; status: Status; icon: string }) => (
    <TouchableOpacity 
      style={[styles.filterBadge, filter === status && styles.activeFilter]} 
      onPress={() => setFilter(status)}
    >
      <MaterialCommunityIcons name={icon as any} size={20} color={filter === status ? "#FFF" : "#AAA"} />
      <Text style={[styles.filterText, filter === status && styles.activeFilterText]}>{title}</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: OrderRef }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
            <Text style={styles.customer}>
              👤 {item.customer?.name || item.customer?.email || 'Cliente'}
            </Text>
            <Text style={styles.address}>
              📍 {item.address || 'Retirada na Loja'}
            </Text>
        </View>
        <Text style={styles.price}>R$ {item.total_amount}</Text>
      </View>
      
      {item.items?.map((i: OrderItemRef, idx: number) => (
        <Text key={idx} style={styles.itemText}>• {i.quantity}x {i.product?.name || 'Produto removido'}</Text>
      ))}

      <View style={styles.actions}>
        <Text style={styles.statusLabel}>Mudar Status:</Text>
        <View style={styles.actionButtons}>
          {filter === 'pending' && <TouchableOpacity style={[styles.btn, {backgroundColor: '#FFB344'}]} onPress={() => changeStatus(item.id, 'preparing')}><Text style={styles.btnText}>Preparar</Text></TouchableOpacity>}
          {filter === 'preparing' && <TouchableOpacity style={[styles.btn, {backgroundColor: '#AF8EFA'}]} onPress={() => changeStatus(item.id, 'delivering')}><Text style={styles.btnText}>Enviar</Text></TouchableOpacity>}
          {filter === 'delivering' && <TouchableOpacity style={[styles.btn, {backgroundColor: '#4E9F3D'}]} onPress={() => changeStatus(item.id, 'delivered')}><Text style={styles.btnText}>Concluir</Text></TouchableOpacity>}
          {filter === 'delivered' && <Text style={{color: '#4E9F3D', fontWeight: 'bold'}}>✅ Entregue</Text>}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestão de Pedidos</Text>
      
      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterBadge title="Pendentes" status="pending" icon="clock-outline" />
          <FilterBadge title="Preparando" status="preparing" icon="package-variant" />
          <FilterBadge title="Envio" status="delivering" icon="truck-delivery" />
          <FilterBadge title="Entregues" status="delivered" icon="check-circle" />
        </ScrollView>
      </View>

      {loading ? <ActivityIndicator color="#AF8EFA" size="large" style={{marginTop: 50}} /> : (
        <FlatList 
            data={filteredOrders} 
            keyExtractor={(item: any) => String(item.id)} 
            renderItem={renderItem} 
            contentContainerStyle={styles.list} 
            ListEmptyComponent={<Text style={styles.empty}>Nenhum pedido nesta etapa.</Text>} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1D2C', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 20, marginTop: 30 },
  filters: { flexDirection: 'row', marginBottom: 20, height: 50 },
  filterBadge: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 20, borderWidth: 1, borderColor: '#333', marginRight: 10, height: 40 },
  activeFilter: { backgroundColor: '#AF8EFA', borderColor: '#AF8EFA' },
  filterText: { color: '#AAA', marginLeft: 5, fontWeight: '600' },
  activeFilterText: { color: '#FFF' },
  list: { paddingBottom: 80 },
  empty: { color: '#666', textAlign: 'center', marginTop: 50 },
  card: { backgroundColor: '#25293A', padding: 15, borderRadius: 10, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  customer: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  address: { color: '#AAA', fontSize: 12, marginTop: 4, maxWidth: 200 },
  price: { color: '#AF8EFA', fontWeight: 'bold', fontSize: 16 },
  itemText: { color: '#CCC', marginBottom: 2 },
  actions: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 10 },
  statusLabel: { color: '#666', fontSize: 12, marginBottom: 5 },
  actionButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
  btn: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 }
});
