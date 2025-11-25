import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCart } from '../../src/contexts/CartContext';
import api from '../../src/services/api';

export default function CartScreen() {
  const router = useRouter();
  const { cart, removeFromCart, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  // --- ENVIAR PEDIDO PARA A API ---
  async function handleCheckout() {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const profileResp = await api.get('/auth/profile');
      const zip = profileResp?.data?.zip_code;
      const addressLabel = zip ? `CEP: ${zip}` : 'Endereço não informado';
      // Monta o pacote de dados para o backend
      // CORREÇÃO: Adicionado 'address' e garantido que números são números
      const payload = {
        total_amount: Number(total),
        address: addressLabel,
        items: cart.map(item => ({
          product_id: Number(item.id),
          quantity: Number(item.quantity),
          unit_price: Number(item.price)
        }))
      };

      console.log("Enviando pedido:", JSON.stringify(payload));

      // Envia para a rota de pedidos
      await api.post('/orders', payload);
      
      Alert.alert('Sucesso!', 'Seu pedido foi enviado para o vendedor.');
      
      // Limpa o carrinho e volta para a loja
      clearCart();
      router.push('/(customer)/home'); 

    } catch (error: any) {
      console.error("Erro no checkout:", error);
      if (error.response) {
        Alert.alert('Erro', `O servidor recusou o pedido: ${JSON.stringify(error.response.data)}`);
      } else {
        Alert.alert('Erro', 'Não foi possível finalizar a compra. Verifique sua conexão.');
      }
    } finally {
      setLoading(false);
    }
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      {/* Imagem Pequena */}
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.itemImage} />
      ) : (
        <View style={styles.itemPlaceholder}>
           <Ionicons name="image" size={20} color="#666" />
        </View>
      )}
      
      {/* Informações */}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemPrice}>R$ {Number(item.price).toFixed(2)}</Text>
        <View style={styles.quantityBadge}>
          <Text style={styles.quantityText}>Qtd: {item.quantity}</Text>
        </View>
      </View>

      {/* Botão de Remover (Lixeira) */}
      <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeButton}>
        <Ionicons name="trash-outline" size={22} color="#FF5555" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MEU CARRINHO</Text>
        <Text style={styles.headerSubtitle}>{cart.length} itens adicionados</Text>
      </View>

      {cart.length === 0 ? (
        // --- TELA DE CARRINHO VAZIO ---
        <View style={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="cart-outline" size={60} color="#AAA" />
          </View>
          <Text style={styles.emptyText}>Seu carrinho está vazio</Text>
          <Text style={styles.emptySubtext}>Adicione produtos para começar suas compras</Text>
          
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(customer)/home')}>
            <Text style={styles.backButtonText}>IR PARA A LOJA</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // --- LISTA DE PRODUTOS ---
        <>
          <FlatList
            data={cart}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 140 }} // Espaço para não esconder atrás do footer
            showsVerticalScrollIndicator={false}
          />

          {/* --- RODAPÉ DE FINALIZAÇÃO --- */}
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL A PAGAR</Text>
              <Text style={styles.totalValue}>R$ {Number(total || 0).toFixed(2)}</Text>
            </View>

            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.checkoutText}>FINALIZAR PEDIDO</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1D2C', paddingTop: 50 },
  
  // Cabeçalho
  header: { alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', letterSpacing: 1 },
  headerSubtitle: { fontSize: 14, color: '#AAA', marginTop: 5 },

  // Estado Vazio
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#25293A', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  emptyText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  emptySubtext: { color: '#AAA', fontSize: 14, textAlign: 'center', marginTop: 10, marginBottom: 30 },
  backButton: { backgroundColor: '#A884F3', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, width: '100%', alignItems: 'center' },
  backButtonText: { color: '#FFF', fontWeight: 'bold' },

  // Item do Carrinho
  cartItem: { 
    backgroundColor: '#25293A', 
    flexDirection: 'row', 
    padding: 12, 
    marginHorizontal: 16, 
    marginBottom: 12, 
    borderRadius: 15, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333'
  },
  itemImage: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#333' },
  itemPlaceholder: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1, marginLeft: 15 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginBottom: 5 },
  itemPrice: { color: '#A884F3', fontSize: 16, fontWeight: 'bold' },
  quantityBadge: { backgroundColor: '#1A1D2C', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, marginTop: 5, borderWidth: 1, borderColor: '#333' },
  quantityText: { color: '#AAA', fontSize: 12 },
  removeButton: { padding: 10, backgroundColor: 'rgba(255, 85, 85, 0.1)', borderRadius: 10 },

  // Rodapé (Footer)
  footer: { 
    position: 'absolute', 
    bottom: 0, left: 0, right: 0, 
    backgroundColor: '#25293A', 
    padding: 20, 
    paddingBottom: 30,
    borderTopWidth: 1, 
    borderTopColor: '#333',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontSize: 14, color: '#AAA', fontWeight: 'bold', letterSpacing: 1 },
  totalValue: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  
  checkoutButton: { 
    backgroundColor: '#A884F3', 
    flexDirection: 'row',
    padding: 18, 
    borderRadius: 15, 
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#A884F3',
    shadowOpacity: 0.4,
    shadowRadius: 10
  },
  checkoutText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
});
