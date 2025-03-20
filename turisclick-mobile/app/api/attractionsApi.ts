import apiClient from './apiClient';
import { Platform } from 'react-native';
import { ApiConfig, API_URL } from './apiConfig';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Attraction } from '../types/attraction';

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

// Función para obtener todas las atracciones
export const getAttractions = async () => {
  try {
    const response = await apiClient.get<ApiResponse<any[]>>('/attractions');
    console.log('Attractions API response:', response.data);
    
    // La respuesta correcta tiene estructura: { status, message, data: [] }
    if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
      return response.data;
    } else {
      console.error('Formato de respuesta inesperado:', response.data);
      return null;
    }
  } catch (error) {
    console.error('Error fetching attractions:', error);
    return null;
  }
};

// Función para obtener una atracción por su ID
export const getAttractionById = async (id: string) => {
  try {
    const response = await apiClient.get<ApiResponse<any>>(`/attractions/${id}`);
    console.log('Attraction details API response:', response.data);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching attraction with ID ${id}:`, error);
    return null;
  }
};

// Crear una nueva atracción
export interface CreateAttractionData {
  name: string;
  description: string;
  opening_time: string;
  closing_time: string;
  location: string;
  latitude: number;
  longitude: number;
  googleMapsUrl?: string;
  cityId: number;
  categoryIds: number[];
  adminId: number;
  images?: string[];
}

export const fetchAttractions = async (): Promise<ApiResponse<Attraction[]>> => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${API_URL}/attractions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching attractions:', error);
    throw error;
  }
};

export const fetchAttractionDetails = async (id: number): Promise<ApiResponse<Attraction>> => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${API_URL}/attractions/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching attraction with ID ${id}:`, error);
    throw error;
  }
};

export const createAttraction = async (attractionData: CreateAttractionData): Promise<ApiResponse<Attraction>> => {
  try {
    const token = await AsyncStorage.getItem('token');
    console.log('Token para crear atracción:', token ? 'Disponible' : 'No disponible');
    
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }
    
    const response = await axios.post(`${API_URL}/attractions`, attractionData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating attraction:', error);
    throw error;
  }
};

// Actualizar una atracción existente
export const updateAttraction = async (id: string, attractionData: Partial<CreateAttractionData>) => {
  try {
    const response = await apiClient.patch<ApiResponse<any>>(`/attractions/${id}`, attractionData);
    console.log('Update attraction API response:', response.data);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating attraction with ID ${id}:`, error);
    return null;
  }
};

// Eliminar una atracción
export const deleteAttraction = async (id: string) => {
  try {
    const response = await apiClient.delete<ApiResponse<any>>(`/attractions/${id}`);
    console.log('Delete attraction API response:', response.data);
    return response.data.status === 'success';
  } catch (error) {
    console.error(`Error deleting attraction with ID ${id}:`, error);
    return false;
  }
};

// Función para subir imágenes
export const uploadImages = async (attractionId: number, formData: FormData): Promise<ApiResponse<string[]>> => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    console.log(`Enviando imágenes a ${API_URL}/attractions/upload-images`);
    
    // La ruta correcta es /attractions/upload-images según el controlador
    const response = await axios.post(
      `${API_URL}/attractions/upload-images`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    console.log('Respuesta de subida:', response.data);
    
    // Si la subida es exitosa, actualizar la atracción con las URLs de las imágenes
    if (response.data.status === 'success' && attractionId && response.data.data.length > 0) {
      try {
        // Actualizar la atracción con las nuevas URLs de imágenes
        // El backend espera un array de strings para updateAttractionDto.images
        await axios.patch(
          `${API_URL}/attractions/${attractionId}`,
          { images: response.data.data }, // Enviar directamente el array de URLs
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log('Atracción actualizada con nuevas imágenes');
      } catch (updateError) {
        console.error('Error al actualizar la atracción con las imágenes:', updateError);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
};

export const fetchAttractionsByStatus = async (status: string): Promise<ApiResponse<Attraction[]>> => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${API_URL}/attractions/status/${status}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching attractions with status ${status}:`, error);
    throw error;
  }
};

export const updateAttractionStatus = async (
  id: number,
  status: string,
  rejectionReason?: string
): Promise<ApiResponse<Attraction>> => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.patch(
      `${API_URL}/attractions/${id}/status`,
      { status, rejectionReason },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating attraction status with ID ${id}:`, error);
    throw error;
  }
}; 