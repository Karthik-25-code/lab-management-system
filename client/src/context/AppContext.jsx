import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load user from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('lab_user');
    const storedToken = localStorage.getItem('lab_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (authData) => {
    if (authData && authData.token) {
      setUser(authData.user);
      localStorage.setItem('lab_user', JSON.stringify(authData.user));
      localStorage.setItem('lab_token', authData.token);
    } else if (authData) {
      setUser(authData);
      localStorage.setItem('lab_user', JSON.stringify(authData));
    }
  };

  const logout = () => {
    setUser(null);
    setCart([]);
    localStorage.removeItem('lab_user');
    localStorage.removeItem('lab_token');
  };

  const addToCart = (item, quantity, hours) => {
    setCart(prev => {
      const existing = prev.find(i => i.componentId === item.id);
      if (existing) {
        return prev.map(i => i.componentId === item.id 
          ? { ...i, quantity: i.quantity + quantity, hours } 
          : i
        );
      }
      return [...prev, { componentId: item.id, item, quantity, hours }];
    });
    toast.success('Added to cart!');
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.componentId !== id));
  };

  const clearCart = () => setCart([]);

  return (
    <AppContext.Provider value={{ 
      user, login, logout, 
      cart, addToCart, removeFromCart, clearCart,
      isCartOpen, setIsCartOpen 
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
