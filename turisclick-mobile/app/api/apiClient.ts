import axios from 'axios';
import { API_URL, ApiConfig } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create an instance of axios with the API configuration
const apiClient = axios.create({
  ...ApiConfig,
  baseURL: API_URL // Asegurar que la baseURL sea la correcta
});

// Interceptor para agregar el token a todas las peticiones
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    if (error.response) {
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor');
    } else {
      console.error('Error de configuración');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 