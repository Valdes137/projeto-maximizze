import { Stack } from "expo-router";
import { CartProvider } from "../src/contexts/CartContext";
import { AuthProvider } from "../src/contexts/AuthContext";
import { useEffect } from "react";
import { initDB } from "../src/services/db";
import { Platform } from "react-native";


export default function RootLayout() {

  useEffect(() => {
    if (Platform.OS !== 'web') {
      initDB().catch(e => console.log(e));
    }
  }, []);

  return (
    // AuthProvider embrulha tudo
    <AuthProvider>
      <CartProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          
          {/* Tela de Login (index) */}
          <Stack.Screen name="index" />
          
          {/* Tela de Cadastro */}
          <Stack.Screen name="register" />
          <Stack.Screen name="forgot-password" />

          {/* Área do VENDEDOR (Pasta tabs) */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* Área do CLIENTE (Pasta customer) - ESTA LINHA FALTAVA! */}
          <Stack.Screen name="(customer)" options={{ headerShown: false }} />

          {/* Telas Modais / Extras */}
          <Stack.Screen name="add-product" />
          <Stack.Screen name="edit-product" />
          
          {/* Removi 'home', 'cart' e 'customer-orders' daqui porque 
              eles agora vivem dentro de (customer) e são gerenciados lá */}

        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}
