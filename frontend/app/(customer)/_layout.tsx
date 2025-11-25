import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function CustomerLayout() {
  return (
    <Tabs screenOptions={{ 
      headerShown: false,
      // --- CONFIGURAÇÃO DE ESTILO (DARK MODE) ---
      tabBarStyle: { 
        backgroundColor: '#1A1D2C', // Fundo Escuro igual ao app
        borderTopColor: '#333',     // Linha fina cinza em cima
        height: Platform.OS === 'ios' ? 90 : 65, // Ajuste de altura para não cortar em Androids
        paddingBottom: Platform.OS === 'ios' ? 28 : 10, // Espaço para a barra do iPhone
        paddingTop: 8,
      },
      tabBarActiveTintColor: '#A884F3', // Roxo Neon quando selecionado
      tabBarInactiveTintColor: '#666',  // Cinza quando apagado
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
      }
      // ------------------------------------------
    }}>
      
      <Tabs.Screen 
        name="home" 
        options={{
          title: 'Loja',
          tabBarIcon: ({ color, size, focused }) => (
            // Lógica: Se focado usa ícone cheio, se não, usa contorno
            <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
          ),
        }} 
      />

      <Tabs.Screen 
        name="cart" 
        options={{
          title: 'Carrinho',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "cart" : "cart-outline"} size={size} color={color} />
          ),
        }} 
      />

      <Tabs.Screen 
        name="profile" 
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
          ),
        }} 
      />
    </Tabs>
  );
}