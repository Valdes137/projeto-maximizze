import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const loadStorage = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const role = await AsyncStorage.getItem('role');

        if (token) {
          setUserToken(token);
          setUserRole(role);
        }
      } catch (e) {
        console.log("Erro ao carregar storage", e);
      } finally {
        setTimeout(() => setIsLoading(false), 300);
      }
    };

    loadStorage();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const root = segments[0]; // Primeiro nível da URL

    const isSellerArea = root === '(tabs)';
    const isCustomerArea = root === '(customer)';
    const publicAllowed = ['index', undefined, 'register', 'forgot-password'];

    if (!userToken) {
      if (!publicAllowed.includes(root)) {
        router.replace('/');
      }
      return;
    }

    // Admin: vai sempre para /good
    if (userRole === 'admin') {
      if (root !== 'good') {
        router.replace('/good');
      }
      return;
    }

    const sellerAllowed = ['(tabs)', 'products', 'add-product', 'edit-product'];
    if (userRole === 'seller' && !sellerAllowed.includes(root)) {
      router.replace('/(tabs)');
      return;
    }

    // 🔥 SE FOR CLIENTE → / (customer) / home
    if (userRole !== 'seller' && !isCustomerArea) {
      router.replace('/(customer)/home');
      return;
    }

  }, [userToken, userRole, segments, isLoading, router]);

  const signIn = async (token, role) => {
    setIsLoading(true);
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('role', role);
    setUserToken(token);
    setUserRole(role);
    setIsLoading(false);
  };

  const signOut = async () => {
    setIsLoading(true);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('role');
    setUserToken(null);
    setUserRole(null);
    router.replace('/');
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1D2C' }}>
        <ActivityIndicator size="large" color="#AF8EFA" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ signIn, signOut, userToken }}>
      {children}
    </AuthContext.Provider>
  );
}
