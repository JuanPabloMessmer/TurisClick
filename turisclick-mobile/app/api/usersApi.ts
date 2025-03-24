import axios from 'axios';
import { API_URL } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse } from './attractionsApi';

// Actualizar el estado de host del usuario
export const updateHostStatus = async (): Promise<ApiResponse<any>> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      return {
        status: 'error',
        message: 'No hay token de autenticación disponible',
        data: null
      };
    }

    const response = await axios.patch(
      `${API_URL}/users/host-status`,
      { enabled: true },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('Respuesta de actualización a host (API):', JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.error('Error updating host status:', error);
    console.error('Error details:', error.response?.data || 'No response data');
    return {
      status: 'error',
      message: error.response?.data?.message || 'Error al actualizar el estado de host',
      data: null
    };
  }
}; 