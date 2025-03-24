import axios from 'axios';
import { API_URL } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Crear una instancia de cliente axios con la URL base
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para logs de respuesta
apiClient.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa, simplemente devolvemos la respuesta
    return response;
  },
  (error) => {
    // Si hay un error, lo registramos antes de rechazar la promesa
    console.error('API Error:', error.response ? {
      status: error.response.status,
      data: error.response.data,
      url: error.config.url,
      method: error.config.method
    } : error.message);
    
    return Promise.reject(error);
  }
);

// Interceptor para agregar el token a todas las peticiones
apiClient.interceptors.request.use(
  async (config) => {
    // Intentar obtener el token usando 'authToken' primero (es el usado en AuthContext)
    let token = await AsyncStorage.getItem('authToken');
    
    // Si no se encuentra, intentar con 'token' como respaldo
    if (!token) {
      token = await AsyncStorage.getItem('token');
    }
    
    if (token) {
      // Solo registramos logs para URLs importantes para evitar spam
      if (config.url && !config.url.includes('users/profile')) {
        console.log('Añadiendo token a la petición:', config.url);
      }
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Solo registramos logs para URLs importantes para evitar spam
      if (config.url && !config.url.includes('users/profile')) {
        console.log('No hay token disponible para la petición:', config.url);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient; 