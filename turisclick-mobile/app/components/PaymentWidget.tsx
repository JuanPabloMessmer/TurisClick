import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, Alert } from 'react-native';
import WebView from 'react-native-webview';
import { checkTransactionStatus } from '../api/paymentApi';
import { API_URL } from '../api/apiConfig';
import axios from 'axios';
import { useNavigation, StackActions } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

interface PaymentWidgetProps {
  paymentUrl: string;
  returnUrl: string;
  transactionId: string;
  onComplete: (transactionId: string) => void;
  onError: (errorMessage: string) => void;
  onCancel: () => void;
}

// Definir la estructura básica de las rutas para la navegación
type RootStackParamList = {
  Main: { screen: string };
};

/**
 * Función auxiliar para extraer el ID de transacción de una URL
 */
const extractTransactionId = (url: string): string | null => {
  // Si la URL contiene el parámetro id_transaccion, extraerlo
  if (url.includes('id_transaccion=')) {
    const idMatch = url.match(/id_transaccion=([^&]+)/);
    return idMatch ? idMatch[1] : null;
  }
  
  // Si es una URL de deep link con parámetro id
  if (url.includes('payment/complete?id=')) {
    const idMatch = url.match(/id=([^&]+)/);
    return idMatch ? idMatch[1] : null;
  }
  
  // Si contiene una estructura tipo TRN-XXXXX
  const trnMatch = url.match(/TRN-[a-zA-Z0-9-]+/);
  return trnMatch ? trnMatch[0] : null;
};

const PaymentWidget = ({
  paymentUrl,
  returnUrl,
  transactionId,
  onComplete,
  onError,
  onCancel,
}: PaymentWidgetProps) => {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingResponse, setProcessingResponse] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Función para verificar si la transacción fue exitosa
  const verifyTransaction = async (transactionId: string) => {
    try {
      setVerifyingPayment(true);
      console.log('==================== VERIFICANDO TRANSACCIÓN ====================');
      console.log('ID de transacción COMPLETO para verificar:', transactionId);
      
      // Mostrar un indicador visual para el usuario
      Alert.alert(
        'Verificando pago',
        'Por favor espere mientras verificamos el estado de su pago...'
      );
      
      // Usar el ID COMPLETO exactamente como viene de SCRUM PAY para la verificación
      const scrumPayResponse = await checkTransactionStatus(transactionId);
      console.log('Respuesta de verificación de SCRUM PAY:', scrumPayResponse);
      
      // Intento directo con el backend para verificar la transacción
      try {
        const verifyResponse = await axios.get(`${API_URL}/transactions/verify/${transactionId}`);
        console.log('Respuesta backend de verificación:', verifyResponse.data);
        
        if (verifyResponse.data && verifyResponse.data.status === 'success') {
          return await handleTicketCreation(verifyResponse.data.data, transactionId);
        }
      } catch (backendError) {
        console.error('Error al verificar con backend:', backendError);
        
        // Verificar si SCRUM PAY reporta un estado exitoso aunque el backend no tenga la transacción
        if (scrumPayResponse.error === '0' || 
            (scrumPayResponse.estatus && scrumPayResponse.estatus === '0')) {
          
          Alert.alert(
            'Pago posiblemente completado',
            'SCRUM PAY ha autorizado su pago, pero no pudimos verificarlo en nuestro sistema. ¿Desea verificar sus tickets disponibles?',
            [
              { text: 'No, seguir aquí', style: 'cancel' },
              { 
                text: 'Sí, ver mis tickets', 
                onPress: () => {
                  navigation.navigate('Main', { screen: 'Trips' });
                } 
              }
            ]
          );
          return false;
        }
        
        // Si también hay error en SCRUM PAY o no hay información clara, mostrar el error
        throw new Error('No se pudo verificar la transacción en nuestro sistema');
      }
      
      return false;
    } catch (err) {
      console.error('Error al verificar la transacción:', err);
      
      Alert.alert(
        'Error de verificación',
        'No pudimos verificar el estado de su pago. Es posible que su pago esté siendo procesado.',
        [
          { 
            text: 'Intentar de nuevo', 
            onPress: () => verifyTransaction(transactionId) 
          },
          { 
            text: 'Ver mis tickets', 
            onPress: () => {
              navigation.navigate('Main', { screen: 'Trips' });
            }
          }
        ]
      );
      
      return false;
    } finally {
      setVerifyingPayment(false);
    }
  };

  // Función para crear tickets basados en la transacción verificada
  const handleTicketCreation = async (transaction: any, transactionId: string) => {
    try {
      console.log('Creando tickets para transacción verificada:', transaction.id);
      
      // Enviar evento de transacción completada
      if (onComplete) {
        onComplete(transactionId);
      }
      
      return true;
    } catch (error) {
      console.error('Error al crear tickets:', error);
      
      if (onError) {
        onError('Error al generar tickets. Por favor contacte a soporte.');
      }
      
      return false;
    }
  };

  // Manejar la navegación en el WebView
  const handleNavigationStateChange = async (navState: any) => {
    console.log('==================== NAVEGACIÓN WEBVIEW ====================');
    console.log('WebView navegando a:', navState.url);
    
    // Si ya estamos procesando una respuesta, no continuamos
    if (processingResponse) return;

    // Verificar si estamos en la URL de retorno o en cualquier URL que contenga el parámetro id_transaccion
    if (navState.url.startsWith(returnUrl) || 
        navState.url.startsWith('turisclick://payment/complete') ||
        navState.url.includes('/payment-response') || 
        navState.url.includes('id_transaccion=') || 
        navState.url.includes('estado=')) {
      try {
        // Marcar que estamos procesando para prevenir múltiples llamadas
        setProcessingResponse(true);
        
        console.log('==================== DETECTADA URL DE RESPUESTA ====================');
        console.log('URL completa:', navState.url);
        
        // Extraer los parámetros de la URL
        let transactionIdFromUrl = null;
        let errorCode = null;
        
        if (navState.url.includes('?')) {
          // Parse query parameters
          const queryString = navState.url.split('?')[1];
          const params = new URLSearchParams(queryString);
          
          // Check for different possible parameter names
          transactionIdFromUrl = params.get('id_transaccion') || params.get('id') || null;
          errorCode = params.get('error') || params.get('estado') || null;
          
          console.log('Parámetros extraídos:', { transactionIdFromUrl, errorCode });
        }
        
        // Si no se pudo extraer el ID de la URL, intentar con el proporcionado al componente
        const effectiveTransactionId = transactionIdFromUrl || transactionId;
        
        // Si hay un ID de transacción, verificar su estado
        if (effectiveTransactionId) {
          console.log('Usando ID de transacción para verificación:', effectiveTransactionId);
          
          // IMPORTANTE: Usar el ID COMPLETO tal como viene, sin modificarlo
          await verifyTransaction(effectiveTransactionId);
        } else {
          const errorMsg = 'No se pudo obtener información de la transacción';
          console.error(errorMsg);
          setError(errorMsg);
          if (onError) onError(errorMsg);
        }
      } catch (err) {
        console.error('Error al procesar URL de respuesta:', err);
        const errorMsg = err instanceof Error ? err.message : 'Error al procesar la respuesta del pago';
        setError(errorMsg);
        if (onError) onError(errorMsg);
      } finally {
        // Resetear el estado de procesamiento después de un tiempo
        setTimeout(() => {
          setProcessingResponse(false);
        }, 2000);
      }
    }
  };

  const handleClosePayment = () => {
    if (onCancel) onCancel();
  };

  return (
    <View style={styles.container}>
      {(loading || verifyingPayment) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5A5F" />
          <Text style={styles.loadingText}>
            {verifyingPayment ? 'Verificando pago...' : 'Cargando...'}
          </Text>
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        source={{ uri: paymentUrl }}
        style={styles.webView}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={handleNavigationStateChange}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
      
      <TouchableOpacity style={styles.closeButton} onPress={handleClosePayment}>
        <Text style={styles.closeButtonText}>Cancelar</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.verifyButton} 
        onPress={() => {
          Alert.alert(
            'Verificar pago',
            '¿Desea verificar el estado de su pago?',
            [
              { text: 'Cancelar', style: 'cancel' },
              { 
                text: 'Verificar', 
                onPress: () => verifyTransaction(transactionId) 
              }
            ]
          );
        }}
      >
        <Text style={styles.verifyButtonText}>Verificar Pago</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 5,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5A5F',
  },
  verifyButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#FF5A5F',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 5,
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default PaymentWidget;
