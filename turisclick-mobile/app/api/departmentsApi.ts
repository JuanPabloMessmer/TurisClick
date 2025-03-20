import apiClient from './apiClient';

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

export interface Department {
  id: number;
  name: string;
  country?: any;
}

// Función para obtener todos los departamentos
export const getDepartments = async () => {
  try {
    const response = await apiClient.get<ApiResponse<Department[]>>('/departments');
    console.log('Departments API response:', response.data);
    
    if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
      return response.data.data;
    } else {
      console.error('Formato de respuesta inesperado:', response.data);
      return [
        { id: 1, name: 'La Paz' },
        { id: 2, name: 'Cochabamba' },
        { id: 3, name: 'Santa Cruz' },
        { id: 4, name: 'Oruro' },
        { id: 5, name: 'Potosí' },
        { id: 6, name: 'Chuquisaca' },
        { id: 7, name: 'Tarija' },
        { id: 8, name: 'Beni' },
        { id: 9, name: 'Pando' }
      ];
    }
  } catch (error) {
    console.error('Error fetching departments:', error);
    // Si ocurre un error, devolvemos los 9 departamentos de Bolivia como datos locales de respaldo
    return [
      { id: 1, name: 'La Paz' },
      { id: 2, name: 'Cochabamba' },
      { id: 3, name: 'Santa Cruz' },
      { id: 4, name: 'Oruro' },
      { id: 5, name: 'Potosí' },
      { id: 6, name: 'Chuquisaca' },
      { id: 7, name: 'Tarija' },
      { id: 8, name: 'Beni' },
      { id: 9, name: 'Pando' }
    ];
  }
};

// Función para obtener un departamento por su ID
export const getDepartmentById = async (id: number) => {
  try {
    const response = await apiClient.get<ApiResponse<Department>>(`/departments/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching department with ID ${id}:`, error);
    return null;
  }
}; 