import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Platform, Image } from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router'; // Adicionado useLocalSearchParams
import api from '../src/services/api';
import { getLocalProducts, saveProductsToLocal, initDB } from '../src/services/db';

export default function ProductsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); // Pega os parâmetros vindos do Dashboard
  
  interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
    stock_quantity: number;
    image?: string | null;
  }
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'web') {
        initDB().then(() => loadData());
      } else {
        loadData();
      }
    }, [])
  );

  async function loadData() {
    setLoading(true);
    try {
      console.log("🔄 Tentando buscar da API...");
      const response = await api.get('/products/mine');
      
      console.log("🌐 Internet OK! Salvando no celular...");
      setProducts(response.data);
      setIsOffline(false);

      if (Platform.OS !== 'web') {
        await saveProductsToLocal(response.data);
      }

    } catch (error) {
      console.log("⚠️ Sem internet ou erro na API. Tentando Offline...");
      if (Platform.OS !== 'web') {
        const localData = await getLocalProducts();
        if (localData.length > 0) {
          setProducts(localData);
          setIsOffline(true);
          Alert.alert("Modo Offline", "Exibindo produtos salvos no celular.");
        } else {
          Alert.alert("Offline", "Sem internet e sem produtos salvos.");
        }
      } else {
        alert("Erro de conexão no PC.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (isOffline) return Alert.alert("Offline", "Não dá pra apagar sem internet.");
    
    if (Platform.OS === 'web') {
      if (window.confirm("Apagar?")) executeDelete(id);
    } else {
      Alert.alert("Excluir", "Tem certeza?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Sim", onPress: () => executeDelete(id) }
      ]);
    }
  }

  async function executeDelete(id: number) {
    try {
      await api.delete(`/products/${id}`);
      loadData(); 
    } catch (error) {
      Alert.alert("Erro", "Falha ao excluir.");
    }
  }

  // --- LÓGICA DE FILTRO DO DASHBOARD ---
  const getFilteredProducts = () => {
    const raw = Array.isArray(params.filter) ? params.filter[0] : params.filter;
    if (raw === 'lowStock') {
      return products.filter((p: Product) => p.stock_quantity < 5);
    }
    return products;
  };

  const displayedProducts = getFilteredProducts();
  // -------------------------------------

  const renderItem = ({ item }: any) => (
    <View style={[styles.card, isOffline && styles.offlineCard]}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.productImage} />
      ) : (
        <View style={styles.iconPlaceholder}>
          <Text style={styles.iconText}>📦</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
        <Text style={styles.price}>R$ {Number(item.price).toFixed(2)}</Text>

        {/* Destaque de estoque baixo */}
        {item.stock_quantity < 5 && item.stock_quantity > 0 ? (
            <Text style={{color: '#FF4444', fontWeight: 'bold', fontSize: 12}}>
                ⚠️ Restam apenas {item.stock_quantity}
            </Text>
        ) : (
            <Text style={{color: '#AAA', fontSize: 12}}>Estoque: {item.stock_quantity}</Text>
        )}
      </View>

      {!isOffline && (
        <>
          {/* Botão Editar */}
          <TouchableOpacity 
            onPress={() => router.push({
              pathname: "/edit-product",
              params: { ...item }
            })} 
            style={styles.iconBtn}
          >
            <Text style={{fontSize: 20}}>✏️</Text>
          </TouchableOpacity>

          {/* Botão Excluir */}
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
            <Text style={{fontSize: 20}}>🗑️</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, isOffline && styles.offlineHeader]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>⬅ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {params.filter === 'lowStock' ? "⚠️ Baixo Estoque" : (isOffline ? "Offline" : "Meus Produtos")}
        </Text>
        {!isOffline && (
          <TouchableOpacity onPress={() => router.push('/add-product')} style={styles.addButton}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#AF8EFA" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={displayedProducts}
          keyExtractor={(item: any) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          initialNumToRender={10}
          windowSize={5}
          removeClippedSubviews
          ListEmptyComponent={
            <Text style={styles.empty}>
                {params.filter === 'lowStock' ? "Nenhum produto com estoque baixo!" : "Nenhum produto encontrado."}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1D2C' },
  header: { padding: 20, paddingTop: 40, backgroundColor: '#25293A', flexDirection: 'row', alignItems: 'center' },
  offlineHeader: { backgroundColor: '#442222' },
  backButton: { marginRight: 15 },
  backText: { color: '#AF8EFA', fontSize: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF', flex: 1 },
  addButton: { backgroundColor: '#AF8EFA', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: '#FFF', fontSize: 24, marginTop: -2, fontWeight: 'bold' },
  list: { padding: 20 },
  card: { backgroundColor: '#25293A', borderRadius: 10, padding: 15, marginBottom: 15, flexDirection: 'row', alignItems: 'center' },
  offlineCard: { opacity: 0.7 },
  productImage: { width: 60, height: 60, borderRadius: 8, marginRight: 15, backgroundColor: '#333' },
  iconPlaceholder: { width: 50, height: 50, backgroundColor: '#333', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  iconText: { fontSize: 24 },
  info: { flex: 1 },
  name: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  description: { color: '#AAA', fontSize: 12 },
  price: { color: '#AF8EFA', fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  iconBtn: { padding: 10, marginLeft: 5 },
  deleteText: { fontSize: 20 },
  empty: { color: '#AAA', textAlign: 'center', marginTop: 50 }
});
