
import React, { createContext, useState, useContext, ReactNode } from 'react';

// Tipagem do Produto que vem da API
interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image?: string;
}

// Tipagem do Item no Carrinho (Produto + Quantidade)
export interface CartItem extends Product {
  quantity: number;
}

interface CartContextData {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  function addToCart(product: Product) {
    setCart((currentCart) => {
      // Verifica se o produto já está no carrinho
      const productExists = currentCart.find(item => item.id === product.id);

      if (productExists) {
        // Se já existe, aumenta a quantidade
        return currentCart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // Se não existe, adiciona com quantidade 1
        return [...currentCart, { ...product, quantity: 1 }];
      }
    });
  }

  function removeFromCart(productId: number) {
    setCart(currentCart => currentCart.filter(item => item.id !== productId));
  }

  function clearCart() {
    setCart([]);
  }

  // Cálculo automático do total
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);