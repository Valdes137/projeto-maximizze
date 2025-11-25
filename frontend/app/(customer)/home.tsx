import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image, RefreshControl, TextInput, Modal, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { useCart } from '../../src/contexts/CartContext';

// Tipagem atualizada (incluindo o vendedor opcional)
interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string | null;
  seller?: {
    name: string;
  };
}

export default function CustomerHome() {
  // Estados de Dados
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estado da Pesquisa
  const [search, setSearch] = useState('');

  // Estado do Modal (Detalhes do Produto)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { addToCart } = useCart();

  useEffect(() => {
    loadProducts();
  }, []);

  // Filtro de Pesquisa em Tempo Real
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [search, products]);

  async function loadProducts() {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.log('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts();
  }, []);

  // Abrir Detalhes
  function handleOpenDetails(product: Product) {
    setSelectedProduct(product);
    setModalVisible(true);
  }

  // Adicionar e Fechar Modal
  function handleAddToCartFromModal(product: Product) {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description,
      image: product.image || undefined
    });
    setModalVisible(false);
  }

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleOpenDetails(item)}>
      <View style={styles.imageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
             <Ionicons name="image-outline" size={40} color="#666" />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.price}>R$ {Number(item.price).toFixed(2)}</Text>
      </View>
      {/* REMOVIDO O BOTÃO DE ADICIONAR RÁPIDO DAQUI */}
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#A884F3" /></View>;

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MAXIMIZZE</Text>
        
        {/* Barra de Pesquisa */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#AAA" style={{marginRight: 10}} />
          <TextInput 
            placeholder="O que você procura hoje?"
            placeholderTextColor="#AAA"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color="#AAA" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList 
        data={filteredProducts}
        numColumns={2}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A884F3" />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {search ? "Nenhum produto encontrado." : "Carregando ofertas..."}
          </Text>
        }
      />

      {/* --- MODAL DE DETALHES DO PRODUTO --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={{paddingBottom: 20}}>
              {/* Imagem Grande */}
              <View style={styles.modalImageContainer}>
                {selectedProduct?.image ? (
                  <Image source={{ uri: selectedProduct.image }} style={styles.modalImage} resizeMode="contain" />
                ) : (
                  <View style={styles.modalImagePlaceholder}>
                    <Ionicons name="image-outline" size={60} color="#666" />
                  </View>
                )}
              </View>

              {/* Informações Detalhadas */}
              <Text style={styles.modalTitle}>{selectedProduct?.name}</Text>
              
              <View style={styles.sellerContainer}>
                <MaterialCommunityIcons name="store" size={16} color="#A884F3" />
                <Text style={styles.sellerName}>
                  Vendido por: {selectedProduct?.seller?.name || "Loja Parceira Maximizze"}
                </Text>
              </View>

              <Text style={styles.modalPrice}>R$ {Number(selectedProduct?.price).toFixed(2)}</Text>
              
              <Text style={styles.sectionHeader}>Descrição</Text>
              <Text style={styles.modalDescription}>
                {selectedProduct?.description || "Sem descrição disponível para este produto."}
              </Text>
            </ScrollView>

            {/* Botão de Compra no Modal */}
            <TouchableOpacity 
              style={styles.modalAddButton} 
              onPress={() => selectedProduct && handleAddToCartFromModal(selectedProduct)}
            >
              <Text style={styles.modalAddButtonText}>ADICIONAR AO CARRINHO</Text>
              <Ionicons name="cart" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1D2C', paddingTop: 50, paddingHorizontal: 16 },
  center: { flex: 1, backgroundColor: '#1A1D2C', justifyContent: 'center', alignItems: 'center' },
  
  // Header e Pesquisa
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#A884F3', letterSpacing: 1, textAlign: 'center', marginBottom: 15 },
  searchBar: { 
    flexDirection: 'row', 
    backgroundColor: '#25293A', 
    borderRadius: 12, 
    padding: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333'
  },
  searchInput: { flex: 1, color: '#FFF', fontSize: 16 },

  // Lista
  row: { justifyContent: 'space-between' },
  emptyText: { color: '#AAA', textAlign: 'center', marginTop: 50, fontSize: 16 },

  // Card do Produto
  card: { 
    backgroundColor: '#25293A', 
    borderRadius: 15, 
    padding: 10, 
    marginBottom: 15, 
    width: '48%', 
    borderWidth: 1,
    borderColor: '#333',
    elevation: 3
  },
  imageContainer: { width: '100%', height: 120, marginBottom: 10, borderRadius: 10, overflow: 'hidden' },
  productImage: { width: '100%', height: '100%' },
  imagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#1F2230', justifyContent: 'center', alignItems: 'center' },
  
  info: { marginBottom: 10, height: 60 },
  name: { fontSize: 13, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  price: { color: '#A884F3', fontSize: 15, fontWeight: 'bold' },
  
  // REMOVIDO O ESTILO 'addButton' POIS NÃO É MAIS USADO

  // --- ESTILOS DO MODAL ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#1A1D2C', 
    height: '85%', 
    borderTopLeftRadius: 25, 
    borderTopRightRadius: 25, 
    padding: 20,
    paddingTop: 40
  },
  closeButton: { position: 'absolute', top: 15, right: 15, zIndex: 10, backgroundColor: '#333', padding: 5, borderRadius: 20 },
  
  modalImageContainer: { width: '100%', height: 250, marginBottom: 20, backgroundColor: '#25293A', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  modalImage: { width: '100%', height: '100%' },
  modalImagePlaceholder: { alignItems: 'center' },
  
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 5 },
  modalPrice: { fontSize: 28, fontWeight: 'bold', color: '#A884F3', marginBottom: 20 },
  
  sellerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sellerName: { color: '#AAA', marginLeft: 8, fontSize: 14 },
  
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginBottom: 8, marginTop: 10 },
  modalDescription: { fontSize: 14, color: '#CCC', lineHeight: 22 },
  
  modalAddButton: { 
    backgroundColor: '#A884F3', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 18, 
    borderRadius: 15, 
    marginTop: 20,
    gap: 10
  },
  modalAddButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
