import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false, // Esconde o cabeçalho padrão (já temos o nosso personalizado nas telas)
      tabBarShowLabel: true, // Mostra o nome embaixo do ícone
      
      // Estilo da Barra de Fundo
      tabBarStyle: {
        backgroundColor: '#25293A', // Cor dos cards (Azul Petróleo)
        borderTopWidth: 0,          // Remove a linha fina cinza de cima
        height: 70,                 // Mais alta para ficar moderna
        paddingBottom: 10,
        paddingTop: 10,
        elevation: 10,              // Sombra no Android
        shadowColor: '#000',        // Sombra no iOS
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: -5 },
        shadowRadius: 10,
      },
      
      // Cores dos Ícones
      tabBarActiveTintColor: '#AF8EFA', // Roxo quando selecionado
      tabBarInactiveTintColor: '#666666', // Cinza escuro quando não selecionado
      
      // Estilo do Texto
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
      }
    }}>
      
      {/* ABA 1: INÍCIO (DASHBOARD) */}
      <Tabs.Screen 
        name="index" 
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => (
            // Dica visual: Ícone preenchido se focado, contorno se não
            <MaterialCommunityIcons name={focused ? "view-dashboard" : "view-dashboard-outline"} size={28} color={color} />
          )
        }} 
      />

      {/* ABA 2: PEDIDOS */}
      <Tabs.Screen 
        name="orders" 
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "clipboard-list" : "clipboard-list-outline"} size={28} color={color} />
          )
        }} 
      />

      {/* ABA 3: CLIENTES */}
      <Tabs.Screen 
        name="customers" 
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "account-group" : "account-group-outline"} size={28} color={color} />
          )
        }} 
      />

      {/* ABA 4: PERFIL (Aonde fica o botão de sair) */}
      <Tabs.Screen 
        name="profile" 
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "account-circle" : "account-circle-outline"} size={28} color={color} />
          )
        }} 
      />

    </Tabs>
  );
}