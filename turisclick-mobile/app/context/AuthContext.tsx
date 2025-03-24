import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';
import { Alert } from 'react-native';

// Define the User type
export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  isHost?: boolean;
  profile_image?: string | null;
  preferences?: string[]; // Añadir campo de preferencias (categorías)
};

// Define the context type
type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (firstName: string, lastName: string, email: string, password: string, preferences?: string[]) => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
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
  updateProfile: async () => false,
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

  // Define logout function first
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

  // Check for existing session on startup
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        logInfo('Cargando datos de sesión');
        
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUser = await AsyncStorage.getItem('userData');

        if (storedToken && storedUser) {
          logInfo('Sesión encontrada', { token: storedToken });
          
          const userData = JSON.parse(storedUser);
          console.log('DATOS GUARDADOS DEL USUARIO:', JSON.stringify(userData, null, 2));
          
          // Set token in API client headers
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Actualizar estados después de configurar el token
          setToken(storedToken);
          setUser(userData);
          
          try {
            // Verificar si hay información actualizada del usuario
            console.log('Actualizando datos del perfil...');
            const userProfileResponse = await apiClient.get('/users/profile');
            
            if (userProfileResponse.data) {
              let updatedUserData;
              
              // Comprobar la estructura de los datos según la respuesta
              if (userProfileResponse.data.data) {
                updatedUserData = userProfileResponse.data.data;
              } else if (Array.isArray(userProfileResponse.data) && userProfileResponse.data.length > 0) {
                updatedUserData = userProfileResponse.data[0]; // Si la respuesta es un array
              } else {
                updatedUserData = userProfileResponse.data; // Si la respuesta es el objeto directamente
              }
              
              // Normalizar isHost a un valor booleano
              if (updatedUserData.isHost === true || updatedUserData.isHost === 'true' || updatedUserData.isHost === 1) {
                updatedUserData.isHost = true;
              } else {
                updatedUserData.isHost = false;
              }
              
              // Actualizar datos del usuario
              const userDataString = JSON.stringify(updatedUserData);
              if (userDataString) {
                await AsyncStorage.setItem('userData', userDataString);
              }
              
              // Actualizar estado
              setUser(updatedUserData);
            }
          } catch (profileError: any) {
            logError('Error actualizando perfil del usuario', profileError);
            
            // Comprobar si el error es de autenticación (401)
            if (profileError?.response?.status === 401) {
              console.log('La sesión parece haber expirado. Cerrando sesión...');
              
              // Cerrar sesión y mostrar mensaje
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('userData');
              delete apiClient.defaults.headers.common['Authorization'];
              setUser(null);
              setToken(null);
              
              // Mostrar alerta después de un pequeño retraso para asegurar que la UI está lista
              setTimeout(() => {
                Alert.alert(
                  "Oops, sesión expirada",
                  "Debes hacer Log In antes de continuar",
                  [{ text: "OK" }]
                );
              }, 500);
            }
          }
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
  }, []); // Sin dependencias

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      logInfo('Iniciando sesión', { email });
      console.log('Realizando petición de login...');
      
      const response = await apiClient.post('/auth/login', { email, password });
      console.log('Respuesta completa del login:', JSON.stringify(response.data, null, 2));
      
      if (response.data.status === 'success') {
        // Extract the access_token from the response data structure
        const accessToken = response.data.data.access_token;
        
        if (!accessToken) {
          logError('No se encontró access_token en la respuesta');
          return false;
        }
        
        logInfo('Token obtenido', { token: accessToken });
        
        // Store token
        if (accessToken) {
          await AsyncStorage.setItem('token', accessToken);  // Cambiar a 'token' para que coincida con las API calls
          await AsyncStorage.setItem('authToken', accessToken); // Mantener el original por compatibilidad
          
          // Set token in API client headers
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          
          try {
            // Fetch user profile with the token
            console.log('Obteniendo perfil de usuario con el token...');
            const userProfileResponse = await apiClient.get('/users/profile');
            console.log('RESPUESTA COMPLETA DEL PERFIL:', JSON.stringify(userProfileResponse.data, null, 2));
            
            if (userProfileResponse.data) {
              let userData;
              
              // Comprobar la estructura de los datos según la respuesta
              if (userProfileResponse.data.data) {
                userData = userProfileResponse.data.data;
                console.log('Usando datos desde response.data.data');
              } else if (Array.isArray(userProfileResponse.data) && userProfileResponse.data.length > 0) {
                userData = userProfileResponse.data[0]; // Si la respuesta es un array
                console.log('Usando datos desde array[0]');
              } else {
                userData = userProfileResponse.data; // Si la respuesta es el objeto directamente
                console.log('Usando datos directamente desde response.data');
              }
              
              console.log('DATOS DE USUARIO PROCESADOS ANTES DE NORMALIZAR:', JSON.stringify(userData, null, 2));
              
              // Verificar y asegurar que isHost esté correctamente asignado (conversión explícita a boolean)
              console.log('Valor original de isHost:', userData.isHost, 'tipo:', typeof userData.isHost);
              if (userData.isHost === true || userData.isHost === 'true' || userData.isHost === 1) {
                userData.isHost = true;
              } else {
                userData.isHost = false;
              }
              
              console.log('ESTADO DE HOST DESPUÉS DE NORMALIZAR:', userData.isHost, 'tipo:', typeof userData.isHost);
              
              // Store user data
              const userDataString = JSON.stringify(userData);
              if (userDataString) {
                await AsyncStorage.setItem('userData', userDataString);
              }
              
              // Update state
              setToken(accessToken);
              setUser(userData);
              
              logInfo('Inicio de sesión exitoso con isHost:', userData.isHost);
              return true;
            }
          } catch (profileError) {
            console.error('Error obteniendo el perfil:', profileError);
            logError('Error al obtener el perfil del usuario', profileError);
            
            // Si falla obtener el perfil, creamos un usuario básico
            const basicUserData: User = {
              id: 0,
              firstName: '',
              lastName: '',
              email: email,
              isHost: false
            };
            
            await AsyncStorage.setItem('userData', JSON.stringify(basicUserData));
            setToken(accessToken);
            setUser(basicUserData);
            
            return true;
          }
        }
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
    password: string,
    preferences?: string[]
  ): Promise<boolean> => {
    try {
      logInfo('Registrando usuario', { email, firstName, lastName, hasPreferences: preferences?.length > 0 });
      
      // Mostrar preferencias para debug
      if (preferences && preferences.length > 0) {
        console.log('Preferencias enviadas al registro:', preferences);
      }
      
      const response = await apiClient.post('/auth/signup', {
        firstName,
        lastName,
        email,
        password,
        preferences,
      });
      
      console.log('Respuesta de registro:', JSON.stringify(response.data, null, 2));
      
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

  // Update profile function
  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      logInfo('Actualizando perfil del usuario');
      
      const response = await apiClient.patch('/users/profile', userData);
      
      console.log('Respuesta de actualización de perfil:', JSON.stringify(response.data, null, 2));
      
      // Verificar si tenemos datos válidos en la respuesta, independientemente del campo status
      const responseData = response.data;
      
      if (responseData) {
        // Si tenemos datos de usuario y coinciden con el ID actual, considerar éxito
        if (responseData.id || 
            (responseData.firstName !== undefined) || 
            (responseData.lastName !== undefined) || 
            (responseData.email !== undefined) || 
            (responseData.preferences !== undefined)) {
          
          logInfo('Perfil actualizado exitosamente basado en los datos recibidos');
          
          // Update state if user exists
          if (user) {
            // Usar los datos recibidos del servidor si están disponibles, o los enviados
            const updatedUser = { 
              ...user, 
              ...userData,
              // Sobrescribir con datos del servidor si están disponibles
              ...(responseData.firstName !== undefined && { firstName: responseData.firstName }),
              ...(responseData.lastName !== undefined && { lastName: responseData.lastName }),
              ...(responseData.email !== undefined && { email: responseData.email }),
              ...(responseData.preferences !== undefined && { preferences: responseData.preferences }),
              ...(responseData.isHost !== undefined && { isHost: responseData.isHost }),
            };
            
            setUser(updatedUser);
            
            // Update user data in storage
            await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
          }
          
          return true;
        }
      }
      
      // Si llegamos aquí, tenemos respuesta pero no datos válidos
      if (response.data && response.data.status === 'success') {
        logInfo('Perfil actualizado exitosamente');
        
        // Update state if user exists
        if (user) {
          const updatedUser = { ...user, ...userData };
          setUser(updatedUser);
          
          // Update user data in storage
          await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        }
        
        return true;
      }
      
      logError('Error al actualizar el perfil del usuario', response.data);
      return false;
    } catch (error: any) {
      console.log('Error completo:', error);
      
      // Verificar si es un error 401 (Unauthorized)
      if (error.response && error.response.status === 401) {
        Alert.alert(
          "Oops, sesión expirada",
          "Debes hacer Log In antes de continuar",
          [
            { text: "OK", onPress: () => logout() }
          ]
        );
        return false;
      }
      
      // Verificar si existe response en el error (error de Axios)
      if (error.response) {
        console.log('Respuesta de error:', error.response.data);
      }
      
      logError('Error al actualizar el perfil del usuario', error);
      return false;
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    updateProfile,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 