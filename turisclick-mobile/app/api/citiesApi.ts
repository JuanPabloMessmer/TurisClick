import apiClient from './apiClient';

export interface City {
  id: number;
  name: string;
  department?: {
    id: number;
    name: string;
  };
}

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

// Función para obtener todas las ciudades
export const getCities = async (): Promise<City[]> => {
  try {
    const response = await apiClient.get<ApiResponse<City[]>>('/cities');
    console.log('Cities API response:', response.data);
    
    if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
};

// Función para obtener una ciudad por su ID
export const getCityById = async (id: number): Promise<City | null> => {
  try {
    const response = await apiClient.get<ApiResponse<City>>(`/cities/${id}`);
    
    if (response.data && response.data.status === 'success') {
      return response.data.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching city:', error);
    return null;
  }
};

// Función para obtener las ciudades de un departamento
export const getCitiesByDepartment = async (departmentId: number): Promise<City[]> => {
  try {
    const response = await apiClient.get<ApiResponse<City[]>>(`/cities/department/${departmentId}`);
    console.log('Cities by department API response:', response.data);
    
    if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching cities for department ${departmentId}:`, error);
    return [];
  }
}; 