import axios from 'axios';
import { Platform } from 'react-native';
import base64 from 'react-native-base64';

const SCRUM_PAY_TEST_API = 'https://pay.scrum-technology.com/api/v2test/solicitud_pago.php';
const SCRUM_PAY_TEST_CONSULTA_API = 'https://pay.scrum-technology.com/api/v2test/consulta_transaccion_v2.php';

const USERNAME = 'test_BeeRentBeeRentBeeRentB';
const PASSWORD = 'dd23de5_789789uu';
const ID_COMERCIO = 'BeeRentBeeRentBeeRentBeeRentBeeRent';

export type PaymentChannel = 'W' | 'M';
export type Currency = 'BOB' | 'USD';
export type PaymentMode = 'W' | 'R';

export interface PaymentRequest {
  canal: PaymentChannel;
  monto: string;
  moneda: Currency;
  descripcion: string;
  nombreComprador: string;
  apellidoComprador: string;
  documentoComprador: string;
  correo: string;
  telefono: string;
  modalidad: PaymentMode;
  extra1?: string;
  extra2?: string;
  extra3?: string;
  direccionComprador?: string;
  ciudad?: string;
  codigoTransaccion: string;
  urlRespuesta: string;
  token?: string;
  id_comercio?: string;
}

export interface PaymentResponse {
  error: '0' | '00' | '1';
  id_transaccion?: string;
  url?: string;
  mensaje?: string;
}

export interface TransactionStatusResponse {
  error: '0' | '1';
  id_transaccion?: string;
  estatus?: string;
  fop?: string;
  numeroTarjeta?: string;
  codigoAutorizacion?: string;
  codigoTransaccion?: string;
  expiracion?: string;
  token?: string;
  monto_cobrado?: string;
  moneda?: Currency;
  mensaje?: string;
}

export const requestPayment = async (paymentData: Omit<PaymentRequest, 'id_comercio'>): Promise<PaymentResponse> => {
  try {
    const requestData: PaymentRequest = {
      ...paymentData,
      canal: Platform.OS === 'web' ? 'W' : 'M',
      id_comercio: ID_COMERCIO,
    };

    const auth = base64.encode(`${USERNAME}:${PASSWORD}`);
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    };

    console.log('==================== SOLICITUD DE PAGO ====================');
    console.log('URL:', SCRUM_PAY_TEST_API);
    console.log('Datos enviados:', JSON.stringify(requestData, null, 2));

    const response = await axios.post(SCRUM_PAY_TEST_API, requestData, { headers });

    console.log('==================== RESPUESTA DE SOLICITUD DE PAGO ====================');
    console.log('Respuesta completa:', JSON.stringify(response.data, null, 2));

    if (response.data.error === '111111') {
      return {
        error: '1',
        mensaje: 'Error de autenticación con SCRUM PAY. Verifique credenciales.',
      };
    }

    return response.data;
  } catch (error) {
    console.error('==================== ERROR AL SOLICITAR PAGO ====================');
    console.error('Error:', error);
    return {
      error: '1',
      mensaje: error instanceof Error ? error.message : 'Error desconocido al procesar el pago',
    };
  }
};

/**
 * Consulta el estado de una transacción en SCRUM PAY
 * @param transactionId ID completo de la transacción en SCRUM PAY
 */
export const checkTransactionStatus = async (transactionId: string): Promise<TransactionStatusResponse> => {
  try {
    console.log('==================== CONSULTA DE TRANSACCIÓN ====================');
    console.log('ID de transacción enviado para consulta:', transactionId);

    // Usar el ID completo que devolvió SCRUM PAY en solicitud_pago
    const requestData = {
      id_comercio: ID_COMERCIO,
      id_transaccion: transactionId
    };
    
    // Crear autenticación básica
    const authString = `${USERNAME}:${PASSWORD}`;
    const auth = base64.encode(authString);
    
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };
    
    console.log('URL de consulta:', SCRUM_PAY_TEST_CONSULTA_API);
    console.log('Datos enviados a consulta:', JSON.stringify(requestData, null, 2));
    
    // Realizar la petición HTTP
    const response = await axios.post(SCRUM_PAY_TEST_CONSULTA_API, requestData, { headers });
    
    console.log('==================== RESPUESTA DE CONSULTA ====================');
    console.log('Status:', response.status, response.statusText);
    console.log('Respuesta completa:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('==================== ERROR EN CONSULTA DE TRANSACCIÓN ====================');
    console.error('Error:', error);
    
    // Obtener detalles específicos del error de Axios
    if (axios.isAxiosError(error) && error.response) {
      console.log('Detalles del error Axios:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    return {
      error: '1',
      mensaje: error instanceof Error ? error.message : 'Error desconocido al consultar el estado de la transacción'
    };
  }
};

export default {
  requestPayment,
  checkTransactionStatus,
};
