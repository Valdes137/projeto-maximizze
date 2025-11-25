import { useRouter } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, RefreshControl, ScrollView, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../src/services/api';

export default function DashboardTab() {
  const router = useRouter();
  const [stats, setStats] = useState({ 
    totalSales: 0, 
    totalOrders: 0, 
    pendingOrders: 0, 
    lowStock: 0,
    totalProducts: 0 
  });
  const [loading, setLoading] = useState(false);
  const [showValues, setShowValues] = useState(false); 

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  async function loadStats() {
    setLoading(true);
    try {
      const response = await api.get('/orders/stats');
      setStats(response.data || { totalSales: 0, totalOrders: 0, pendingOrders: 0, lowStock: 0, totalProducts: 0 });
    } catch (error) { console.log(error); } 
    finally { setLoading(false); }
  }

  type StatCardProps = {
    title: string;
    value: number;
    icon: string;
    color: string;
    route: string;
    params?: Record<string, string>;
  };
  const StatCard = ({ title, value, icon, color, route, params }: StatCardProps) => (
    <TouchableOpacity 
      style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]} 
      onPress={() => {
        if (params) {
            router.push({ pathname: route as any, params: params });
        } else {
            router.push(route as any);
        }
      }}
      activeOpacity={0.8}
    >
      <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>        
        <MaterialCommunityIcons name={icon as any} size={24} color={color} />
      </View>
      <View>
        <Text style={styles.cardValue}>{value}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1D2C" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Maximizze</Text>
          <Text style={styles.date}> </Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadStats} tintColor="#AF8EFA" />}
      >
        
        <View style={styles.mainCard}>
          <View style={{flex: 1}}>
            <View style={styles.balanceHeader}>
              <Text style={styles.mainCardLabel}>Faturamento Total</Text>
              <TouchableOpacity onPress={() => setShowValues(!showValues)} style={styles.eyeButton}>
                <MaterialCommunityIcons 
                  name={showValues ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="rgba(255,255,255,0.7)" 
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.mainCardValue}>
              {showValues ? `R$ ${Number(stats.totalSales).toFixed(2)}` : 'R$ ••••••••'}
            </Text>
          </View>
          <View style={styles.mainCardIcon}>
            <MaterialCommunityIcons name="cash-multiple" size={32} color="#FFF" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Visão Geral</Text>

        <View style={styles.grid}>
          <StatCard 
            title="Pendentes" 
            value={stats.pendingOrders} 
            icon="clock-outline" 
            color="#FFB344" 
            route="/(tabs)/orders"
            params={{ status: 'pending' }} 
          />
          
          <StatCard 
            title="Em Estoque" 
            value={stats.totalProducts} 
            icon="package-variant" 
            color="#AF8EFA" 
            route="/products" 
          />
          
          <StatCard 
            title="Entregues" 
            value={stats.totalOrders} 
            icon="check-circle-outline" 
            color="#4E9F3D" 
            route="/(tabs)/orders"
            params={{ status: 'delivered' }} 
          />
          
          {/* --- ATUALIZADO: AGORA ENVIA O FILTRO 'lowStock' --- */}
          <StatCard 
            title="Baixo Estoque" 
            value={stats.lowStock} 
            icon="alert-outline" 
            color="#FF4444" 
            route="/products"
            params={{ filter: 'lowStock' }}
          />
          {/* --------------------------------------------------- */}
        </View>

        <Text style={styles.sectionTitle}>Ações Rápidas</Text>

        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-product')}>
          <MaterialCommunityIcons name="plus-circle-outline" size={24} color="#FFF" />
          <Text style={styles.addButtonText}>Adicionar Novo Produto</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1D2C' }, 
  content: { padding: 20, paddingBottom: 100 },
  header: { marginTop: 40, marginBottom: 20, paddingHorizontal: 10 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  date: { fontSize: 14, color: '#AAA', marginTop: 2 },
  mainCard: { backgroundColor: '#AF8EFA', borderRadius: 20, padding: 25, marginBottom: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: "#AF8EFA", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  eyeButton: { marginLeft: 10, padding: 4 },
  mainCardLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600' },
  mainCardValue: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  mainCardIcon: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 15 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginLeft: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#25293A', borderRadius: 16, padding: 15, marginBottom: 15, height: 110, justifyContent: 'space-between', elevation: 3 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  cardValue: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  cardTitle: { color: '#AAA', fontSize: 12, fontWeight: '600' },
  addButton: { backgroundColor: '#25293A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, marginTop: 10, borderWidth: 1, borderColor: '#AF8EFA', borderStyle: 'dashed' },
  addButtonText: { color: '#FFF', fontWeight: 'bold', marginLeft: 10, fontSize: 16 }
});
