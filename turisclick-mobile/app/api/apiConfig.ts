// Configuración base para todas las APIs
// Para dispositivos físicos, necesitas la IP de tu computadora en la red local
export const API_URL = 'http://192.168.0.14:3000'; // Dirección IP de tu computadora

export const ApiConfig = {
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
}; 