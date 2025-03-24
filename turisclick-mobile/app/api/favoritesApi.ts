import axios from 'axios';
import { API_URL } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse } from './attractionsApi';

// Interfaz para favoritos
export interface Favorite {
  id: number;
  userId: number;
  attractionId: number;
  attraction?: any; // Opcional, en caso de que la API devuelva la atracción completa
  createdAt: string;
}

// Añadir una atracción a favoritos
export const addToFavorites = async (attractionId: number): Promise<ApiResponse<Favorite>> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }

    const response = await axios.post(
      `${API_URL}/favorites`,
      { attractionId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

// Eliminar una atracción de favoritos
export const removeFromFavorites = async (attractionId: number): Promise<ApiResponse<any>> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }

    const response = await axios.delete(`${API_URL}/favorites/${attractionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

// Verificar si una atracción está en favoritos
export const checkIsFavorite = async (attractionId: number): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      return false; // Si no hay token, no puede ser favorito
    }

    const response = await axios.get(`${API_URL}/favorites/check/${attractionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.isFavorite;
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false; // Asumir que no es favorito en caso de error
  }
};

// Obtener todas las atracciones favoritas del usuario
export const getFavorites = async (): Promise<any[]> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }

    const response = await axios.get(`${API_URL}/favorites`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // Devolver directamente el array de favoritos
    return response.data;
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }
}; 