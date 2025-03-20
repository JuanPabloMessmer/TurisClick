import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';

// Define the User type
export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  isHost?: boolean;
  profile_image?: string | null;
};

// Define the context type
type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

// Create the context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
  isAuthenticated: false,
});

// Hook for easy access to the context
export const useAuth = () => useContext(AuthContext);

// Variables de control para logs
let lastLogMessage = '';
let lastLogTime = 0;
const LOG_COOLDOWN = 1000; // milisegundos entre logs idénticos

// Function to print logs nicely
const logInfo = (message: string, data?: any) => {
  // Evitar mensajes duplicados en corto tiempo
  const now = Date.now();
  if (message === lastLogMessage && now - lastLogTime < LOG_COOLDOWN) {
    return;
  }
  
  lastLogMessage = message;
  lastLogTime = now;
  
  console.log(`🟢 ${message}`);
  if (data) {
    try {
      if (typeof data === 'object') {
        // Para tokens, mostrar solo una parte por seguridad
        if (data.token && typeof data.token === 'string') {
          data = { ...data, token: data.token.substring(0, 15) + '...' };
        }
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log(data);
      }
    } catch (e) {
      console.log('Data:', data);
    }
  }
};

const logError = (message: string, error?: any) => {
  // Evitar mensajes duplicados en corto tiempo
  const now = Date.now();
  if (message === lastLogMessage && now - lastLogTime < LOG_COOLDOWN) {
    return;
  }
  
  lastLogMessage = message;
  lastLogTime = now;
  
  console.log(`🔴 ${message}`);
  if (error) {
    if (typeof error === 'object' && error !== null) {
      // Extraer información relevante
      const details = {
        message: error.message,
        code: error.code,
        response: error.response?.data,
      };
      console.log(JSON.stringify(details, null, 2));
    } else {
      console.log('Error details:', error);
    }
  }
};

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on startup
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        logInfo('Cargando datos de sesión');
        
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUser = await AsyncStorage.getItem('userData');

        if (storedToken && storedUser) {
          logInfo('Sesión encontrada', { token: storedToken });
          
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Set token in API client headers
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } else {
          logInfo('No se encontró sesión guardada');
        }
      } catch (error) {
        logError('Error cargando datos de autenticación', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredData();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      logInfo('Iniciando sesión', { email });
      
      const response = await apiClient.post('/auth/login', { email, password });
      
      if (response.data.status === 'success') {
        // Extract the access_token from the response data structure
        const accessToken = response.data.data.access_token;
        
        if (!accessToken) {
          logError('No se encontró access_token en la respuesta');
          return false;
        }
        
        logInfo('Token obtenido', { token: accessToken });
        
        // Create a simplified user object since we don't have complete user data
        const userData: User = {
          id: 0,
          firstName: '',
          lastName: '',
          email: email,
        };
        
        logInfo('Guardando datos de sesión');
        
        // Store token and user data - ensure we have valid values
        if (accessToken) {
          await AsyncStorage.setItem('token', accessToken);  // Cambiar a 'token' para que coincida con las API calls
          await AsyncStorage.setItem('authToken', accessToken); // Mantener el original por compatibilidad
        }
        
        const userDataString = JSON.stringify(userData);
        if (userDataString) {
          await AsyncStorage.setItem('userData', userDataString);
        }
        
        // Update state
        setToken(accessToken);
        setUser(userData);
        
        // Set token in API client headers
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        logInfo('Inicio de sesión exitoso');
        return true;
      }
      
      logError('Inicio de sesión fallido', response.data);
      return false;
    } catch (error: any) {
      logError('Error de inicio de sesión', error);
      return false;
    }
  };

  // Register function
  const register = async (
    firstName: string, 
    lastName: string, 
    email: string, 
    password: string
  ): Promise<boolean> => {
    try {
      logInfo('Registrando usuario', { email });
      
      const response = await apiClient.post('/auth/signup', {
        firstName,
        lastName,
        email,
        password,
      });
      
      if (response.data.status === 'success') {
        logInfo('Registro exitoso');
        return true;
      }
      
      logError('Registro fallido', response.data);
      return false;
    } catch (error: any) {
      logError('Error de registro', error);
      return false;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      logInfo('Cerrando sesión');
      
      // Clear stored data
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userData');
      
      // Clear state
      setUser(null);
      setToken(null);
      
      // Clear authorization header
      delete apiClient.defaults.headers.common['Authorization'];
      
      logInfo('Sesión cerrada');
    } catch (error) {
      logError('Error al cerrar sesión', error);
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 