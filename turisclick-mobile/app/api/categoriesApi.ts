import apiClient from './apiClient';

export interface Category {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

/**
 * Obtiene todas las categorías disponibles
 * @param onlyActive Si es true, solo devuelve categorías activas
 * @returns Lista de categorías
 */
export const getCategories = async (onlyActive: boolean = true): Promise<Category[]> => {
  try {
    const response = await apiClient.get(`/categories?active=${onlyActive}`);
    
    if (response.data && response.data.status === 'success') {
      console.log('Categories API response:', response.data);
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

/**
 * Obtiene una categoría por su ID
 * @param id ID de la categoría
 * @returns La categoría o null si no se encuentra
 */
export const getCategoryById = async (id: number): Promise<Category | null> => {
  try {
    const response = await apiClient.get(`/categories/${id}`);
    
    if (response.data && response.data.status === 'success') {
      return response.data.data;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching category with id ${id}:`, error);
    return null;
  }
};

/**
 * Crea una nueva categoría (solo admin)
 * @param categoryData Datos de la categoría a crear
 * @returns La categoría creada o null si hay error
 */
export const createCategory = async (
  categoryData: { name: string; description?: string }
): Promise<Category | null> => {
  try {
    const response = await apiClient.post('/categories', categoryData);
    
    if (response.data && response.data.status === 'success') {
      return response.data.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error creating category:', error);
    return null;
  }
};

/**
 * Actualiza una categoría existente (solo admin)
 * @param id ID de la categoría a actualizar
 * @param categoryData Datos a actualizar
 * @returns La categoría actualizada o null si hay error
 */
export const updateCategory = async (
  id: number,
  categoryData: { name?: string; description?: string; isActive?: boolean }
): Promise<Category | null> => {
  try {
    const response = await apiClient.patch(`/categories/${id}`, categoryData);
    
    if (response.data && response.data.status === 'success') {
      return response.data.data;
    }
    
    return null;
  } catch (error) {
    console.error(`Error updating category with id ${id}:`, error);
    return null;
  }
};

/**
 * Elimina una categoría (solo admin)
 * @param id ID de la categoría a eliminar
 * @returns true si se eliminó correctamente, false en caso contrario
 */
export const deleteCategory = async (id: number): Promise<boolean> => {
  try {
    const response = await apiClient.delete(`/categories/${id}`);
    
    return response.data && response.data.status === 'success';
  } catch (error) {
    console.error(`Error deleting category with id ${id}:`, error);
    return false;
  }
};

export default {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
}; 