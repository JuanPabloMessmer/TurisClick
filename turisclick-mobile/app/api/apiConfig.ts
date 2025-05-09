// Configuración base para todas las APIs
// Para dispositivos físicos, necesitas la IP de tu computadora en la red local
export const API_URL = 'http://172.16.41.229:3000'; // Asegúrate de que esta IP corresponda a tu computadora en la red


// Función para elegir la URL adecuada según el entorno
export const getApiUrl = () => {

  return API_URL;
};

export const ApiConfig = {
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
}; 