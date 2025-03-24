import apiClient from './apiClient';

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

export interface Sector {
  id: number;
  name: string;
  description?: string;
  price: number | string;
  maxCapacity?: number;
  isActive: boolean;
  attractionId: number;
}

// Get all sectors for an attraction
export const getSectorsByAttraction = async (attractionId: number) => {
  try {
    console.log(`Fetching sectors for attraction ${attractionId}...`);
    const response = await apiClient.get<ApiResponse<Sector[]>>(`/sectors/attraction/${attractionId}`);
    console.log('Sectors data received (raw):', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
      // Verificar el tipo de datos de los precios
      const sectors = response.data.data;
      console.log(`Received ${sectors.length} sectors. Checking price types...`);
      
      sectors.forEach((sector, index) => {
        console.log(`Sector ${index} (${sector.name}) - Price: ${sector.price}, Type: ${typeof sector.price}`);
      });
      
      return sectors;
    } else {
      console.error('Unexpected response format:', response.data);
      return [];
    }
  } catch (error) {
    console.error(`Error fetching sectors for attraction ${attractionId}:`, error);
    return [];
  }
};

// Create a new sector
export interface CreateSectorData {
  name: string;
  description?: string;
  price: number;
  maxCapacity?: number;
  attractionId: number;
}

export const createSector = async (sectorData: CreateSectorData) => {
  try {
    const response = await apiClient.post<ApiResponse<Sector>>('/sectors', sectorData);
    console.log('Create sector API response:', response.data);
    
    if (response.data && response.data.status === 'success') {
      return response.data.data;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error creating sector:', error);
    throw error;
  }
};

// Update a sector
export const updateSector = async (id: number, sectorData: Partial<CreateSectorData>) => {
  try {
    const response = await apiClient.patch<ApiResponse<Sector>>(`/sectors/${id}`, sectorData);
    console.log('Update sector API response:', response.data);
    
    if (response.data && response.data.status === 'success') {
      return response.data.data;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error(`Error updating sector with ID ${id}:`, error);
    throw error;
  }
};

// Delete a sector
export const deleteSector = async (id: number) => {
  try {
    const response = await apiClient.delete<ApiResponse<null>>(`/sectors/${id}`);
    console.log('Delete sector API response:', response.data);
    
    return response.data && response.data.status === 'success';
  } catch (error) {
    console.error(`Error deleting sector with ID ${id}:`, error);
    return false;
  }
}; 