# Guía de Integración con SCRUM PAY

Esta guía explica cómo integrar la pasarela de pago SCRUM PAY en la aplicación móvil TurisClick.

## Acerca de SCRUM PAY

SCRUM PAY es una pasarela de pago multicanal – multipago, de fácil y rápida integración, que utiliza API REST. Permite procesar pagos tanto en Web como en Mobile, siendo full responsive y personalizable al look and feel del Cliente.

### Funcionalidades disponibles
- **Autorización de pagos** mediante:
  - Tarjeta de crédito
  - Tarjeta de débito
  - Código QR
  - Tigo Money
  - Transferencia Bancaria
- **Tokenización de tarjetas**
- **Pagos recurrentes**
- **3D Secure V2**

## Integración en TurisClick Mobile

### 1. Servicio de API

El servicio para interactuar con SCRUM PAY está implementado en el archivo `paymentApi.ts`. Este servicio proporciona las siguientes funcionalidades:

- `requestPayment`: Solicita un pago a través de SCRUM PAY y devuelve la URL para el widget o redirect.
- `checkTransactionStatus`: (Pendiente de implementación) Verificará el estado de una transacción.

### 2. Modalidades de Integración

SCRUM PAY ofrece dos modalidades para integrar la pasarela de pago:

1. **Widget (modalidad='W')**: Puede ser embebido dentro de un WebView. Ideal para aplicaciones móviles.
2. **Redirect (modalidad='R')**: Redirecciona a una página co-brandeada. Requiere una URL de retorno.

Para nuestra aplicación móvil, recomendamos usar la modalidad **Widget**.

### 3. Componente PaymentWidget

El componente `PaymentWidget.tsx` permite mostrar el widget de SCRUM PAY dentro de un WebView. Este componente se debe usar después de recibir una respuesta exitosa del servicio `requestPayment()`.

## Ejemplo de Uso

```typescript
import React, { useState } from 'react';
import { View, Button, Alert } from 'react-native';
import { requestPayment } from '../api/paymentApi';
import PaymentWidget from '../components/PaymentWidget';

const PaymentScreen = () => {
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const initiatePayment = async () => {
    setLoading(true);
    
    try {
      // Datos del pago
      const paymentData = {
        monto: '100.00',
        moneda: 'BOB',
        descripcion: 'Compra de entrada al Parque Nacional',
        nombreComprador: 'Juan',
        apellidoComprador: 'Pérez',
        documentoComprador: '12345678',
        correo: 'juan.perez@ejemplo.com',
        telefono: '71234567',
        modalidad: 'W',
        codigoTransaccion: `TRN-${Date.now()}`,
        urlRespuesta: 'https://localhost:8081/payment-response',
      };
      
      // Solicitar el pago
      const response = await requestPayment(paymentData);
      
      if (response.error === '0' && response.url) {
        setPaymentUrl(response.url);
      } else {
        Alert.alert('Error', response.mensaje || 'Error al iniciar el pago');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePaymentComplete = (transactionId: string) => {
    Alert.alert('Pago exitoso', `ID de transacción: ${transactionId}`);
    setPaymentUrl(null);
    // Aquí puedes hacer algo con el ID de transacción, como registrarlo en tu backend
  };
  
  const handlePaymentError = (message: string) => {
    Alert.alert('Error en el pago', message);
    setPaymentUrl(null);
  };
  
  const handleCancel = () => {
    setPaymentUrl(null);
  };
  
  return (
    <View style={{ flex: 1 }}>
      {paymentUrl ? (
        <PaymentWidget
          paymentUrl={paymentUrl}
          returnUrl="http://localhost:8081/payment-response"
          onComplete={handlePaymentComplete}
          onError={handlePaymentError}
          onCancel={handleCancel}
        />
      ) : (
        <Button
          title={loading ? 'Procesando...' : 'Pagar ahora'}
          onPress={initiatePayment}
          disabled={loading}
        />
      )}
    </View>
  );
};

export default PaymentScreen;
```

## Consideraciones importantes

1. **Ambiente de Pruebas vs. Producción**: Actualmente el servicio está configurado para usar el ambiente de pruebas. Para cambiar a producción, modifica la constante `IS_PRODUCTION` a `true` en `paymentApi.ts`.

2. **Credenciales**: Las credenciales actuales son para el ambiente de pruebas. Antes de pasar a producción, actualiza las credenciales con las proporcionadas por SCRUM PAY.

3. **WebView**: Es necesario instalar el paquete `react-native-webview` para que funcione el componente `PaymentWidget`.

```bash
npm install react-native-webview
```

4. **URL de Respuesta**: Es importante configurar correctamente la `urlRespuesta` en la solicitud de pago y el mismo valor en el componente `PaymentWidget` para que pueda detectar cuando se completa el pago.

## Próximos pasos

1. Implementar el servicio de consulta de estado de transacciones.
2. Integrar la funcionalidad de tokenización de tarjetas para pagos recurrentes si se requiere.
3. Implementar una pantalla completa de pago con selección de método de pago.

Para más información, consulta la documentación oficial de SCRUM PAY. 