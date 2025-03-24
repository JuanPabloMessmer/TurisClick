// Configuración base para todas las APIs
// Para dispositivos físicos, necesitas la IP de tu computadora en la red local
export const API_URL = 'http://192.168.100.49:3000'; // Asegúrate de que esta IP corresponda a tu computadora en la red


// Función para elegir la URL adecuada según el entorno
export const getApiUrl = () => {
  // Si estás usando un dispositivo real, usa API_URL
  // Si estás en un emulador, considera usar EMULATOR_API_URL o LOCALHOST_API_URL
  return API_URL;
};

export const ApiConfig = {
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
}; 