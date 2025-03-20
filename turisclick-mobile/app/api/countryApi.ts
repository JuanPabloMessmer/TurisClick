import apiClient from './apiClient';

// Test different endpoints to see what's available
export const getCountries = async () => {
  try {
    // First try the expected endpoint
    const response = await apiClient.get('/countries');
    console.log('Country API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching countries:', error);
    return null;
  }
};

// Try getting a specific country
export const getCountryById = async (id: number) => {
  try {
    const response = await apiClient.get(`/countries/${id}`);
    console.log('Country by ID response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching country with ID ${id}:`, error);
    return null;
  }
};

// Check the API structure by trying common endpoints
export const probeApi = async () => {
  const endpoints = [
    '/countries',
    '/api/countries',
    '/v1/countries',
    '/country'
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      const response = await apiClient.get(endpoint);
      results[endpoint] = {
        status: 'success',
        data: response.data
      };
    } catch (error) {
      results[endpoint] = {
        status: 'error',
        message: error.message
      };
    }
  }
  
  console.log('API probe results:', results);
  return results;
}; 