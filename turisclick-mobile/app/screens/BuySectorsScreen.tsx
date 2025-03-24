import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  Image,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getSectorsByAttraction, Sector } from '../api/sectorsApi';
import { getAttractionById } from '../api/attractionsApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, RFValue, hasNotch } from '../utils/dimensions';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../api/apiConfig';
import { requestPayment } from '../api/paymentApi';
import PaymentWidget from '../components/PaymentWidget';
import axios from 'axios';

type BuySectorsRouteParams = {
  attractionId: number;
};

// Generate a transaction code in your format (e.g. "TRN-1742794043583-767-1892874145")
const generateTransactionCode = (): string => {
  const timestamp = Date.now().toString();
  const randomPart = Math.floor(Math.random() * 1000).toString();
  const anotherPart = Math.floor(Math.random() * 1e10)
    .toString()
    .padStart(10, '0');
  return `TRN-${timestamp}-${randomPart}-${anotherPart}`;
};

const BuySectorsScreen = () => {
  const route = useRoute<RouteProp<Record<string, BuySectorsRouteParams>, string>>();
  const navigation = useNavigation<any>();
  const { attractionId } = route.params || {};
  const { user, token } = useAuth();
  
  const [attraction, setAttraction] = useState<any>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSectors, setSelectedSectors] = useState<{ [key: number]: number }>({});
  const { addToCart, removeFromCart, updateQuantity, items } = useCart();
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [fullTransactionId, setFullTransactionId] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  useEffect(() => {
    if (attractionId) {
      fetchData();
    } else {
      Alert.alert('Error', 'No se proporcionó ID de atracción');
      navigation.goBack();
    }
  }, [attractionId]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const attractionData = await getAttractionById(String(attractionId));
      if (attractionData?.data) {
        setAttraction(attractionData.data);
      }
      const sectorsData = await getSectorsByAttraction(Number(attractionId));
      if (sectorsData) {
        setSectors(sectorsData.filter(sector => sector.isActive));
        const newSelectedSectors = { ...selectedSectors };
        items.forEach(item => {
          if (item.attractionId === Number(attractionId)) {
            newSelectedSectors[item.sectorId] = item.quantity;
          }
        });
        setSelectedSectors(newSelectedSectors);
      }
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  const getImageUrl = (imagePath?: string): string => {
    if (!imagePath) {
      return 'https://via.placeholder.com/400x200?text=No+Image';
    }
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    const normalizedPath = imagePath.startsWith('uploads/') ? `/${imagePath}` : `/${imagePath}`;
    return `${API_URL}${normalizedPath}`;
  };
  
  const handleIncrement = (sector: Sector) => {
    const currentQty = selectedSectors[sector.id] || 0;
    if (sector.maxCapacity !== undefined && currentQty >= sector.maxCapacity) {
      Alert.alert('Límite alcanzado', 'No hay más entradas disponibles para este sector.');
      return;
    }
    const newQty = currentQty + 1;
    setSelectedSectors({ ...selectedSectors, [sector.id]: newQty });
    if (currentQty === 0) {
      addToCart({
        sectorId: sector.id,
        attractionId: Number(attractionId),
        sectorName: sector.name,
        attractionName: attraction?.name || 'Atracción',
        price: typeof sector.price === 'string' ? parseFloat(sector.price) : sector.price,
      });
    } else {
      updateQuantity(sector.id, newQty);
    }
  };
  
  const handleDecrement = (sector: Sector) => {
    const currentQty = selectedSectors[sector.id] || 0;
    if (currentQty <= 0) return;
    const newQty = currentQty - 1;
    setSelectedSectors({ ...selectedSectors, [sector.id]: newQty });
    if (newQty === 0) {
      removeFromCart(sector.id);
    } else {
      updateQuantity(sector.id, newQty);
    }
  };
  
  const getTotalSelectedItems = () => {
    return Object.values(selectedSectors).reduce((sum, qty) => sum + qty, 0);
  };
  
  const getTotalPrice = () => {
    return sectors.reduce((sum, sector) => {
      const qty = selectedSectors[sector.id] || 0;
      const sectorPrice =
        typeof sector.price === 'number'
        ? sector.price 
        : (typeof sector.price === 'string' ? parseFloat(sector.price) : 0);
      return sum + (sectorPrice * qty);
    }, 0);
  };
  
  const proceedToCheckout = async () => {
    if (getTotalSelectedItems() === 0) {
      Alert.alert('Aviso', 'Por favor seleccione al menos un sector para continuar');
      return;
    }
    setPaymentLoading(true);
    try {
      // Generate a simple transaction code for our request
      const transactionCode = `TRN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Preparar los datos para el pago
      const paymentData = {
        canal: 'M' as const,
        monto: getTotalPrice().toFixed(2),
        moneda: 'BOB' as const,
        descripcion: `Compra de entrada(s) para ${attraction?.name || 'Atracción'}`,
        nombreComprador: user?.firstName || 'Usuario',
        apellidoComprador: user?.lastName || 'TurisClick',
        documentoComprador: '12345678',
        correo: user?.email || 'usuario@turisclick.com',
        telefono: '71234567',
        modalidad: 'W' as const,
        codigoTransaccion: transactionCode,
        urlRespuesta: `turisclick://payment/complete`,
        extra1: `AttractionID:${attractionId}`,
        extra2: `Sectors:${Object.keys(selectedSectors).join(',')}`,
        extra3: `Quantities:${Object.values(selectedSectors).join(',')}`,
        ciudad: 'La Paz',
      };

      console.log('Iniciando proceso de pago con datos:', paymentData);

      // Solicitar el pago a SCRUM PAY
      const response = await requestPayment(paymentData);

      if ((response.error === '0' || response.error === '00') && response.url && response.id_transaccion) {
        console.log('==================== RESPUESTA DE SOLICITUD PAGO ====================');
        console.log('ID de transacción COMPLETO recibido:', response.id_transaccion);
        console.log('URL de pago recibida:', response.url);
        
        // Guardamos el ID de transacción COMPLETO exactamente como lo devuelve SCRUM PAY
        setPaymentUrl(response.url);
        setFullTransactionId(response.id_transaccion);
        
        // Ahora creamos la transacción pendiente con el ID completo de SCRUM PAY
        try {
          await axios.post(`${API_URL}/transactions/create-pending`, {
            scrumPayTransactionId: response.id_transaccion, // Usar el ID completo de SCRUM PAY
            internalTransactionCode: transactionCode,
            amount: parseFloat(getTotalPrice().toFixed(2)),
            currency: 'BOB',
            status: 'PENDING',
            userId: user?.id || 1,
            additionalData: JSON.stringify({
              attractionId: Number(attractionId),
              sectors: Object.keys(selectedSectors)
                .map(sectorId => ({
                  sectorId: Number(sectorId),
                  quantity: selectedSectors[Number(sectorId)],
                  price: sectors.find(s => s.id === Number(sectorId))?.price || 0,
                }))
                .filter(item => item.quantity > 0),
            }),
          });
          console.log('Transacción pendiente creada con ID completo de SCRUM PAY');
        } catch (createError) {
          console.error('Error al crear transacción pendiente:', createError);
          // Continuar de todos modos con el proceso de pago
        }
      } else {
        console.error('Error al iniciar el pago:', response.mensaje);
        Alert.alert(
          'Error al procesar el pago',
          response.mensaje || 'No se pudo iniciar el proceso de pago. Intente nuevamente.'
        );
      }
    } catch (error) {
      console.error('Error durante el proceso de pago:', error);
      Alert.alert(
        'Error',
        'Ocurrió un error inesperado al procesar el pago. Por favor intente nuevamente.'
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  // Use the full transaction ID from the payment API for verification.
  const handlePaymentComplete = async (transactionId: string) => {
    console.log('Pago completado con ID de transacción:', transactionId);
    try {
      setPaymentLoading(true);
      // Use the full transactionId as received
      console.log('Verificando con ID completo:', transactionId);

      const response = await axios.get(`${API_URL}/transactions/verify/${transactionId}`);

      if (response.data && response.data.status === 'success') {
        console.log('Transacción verificada:', response.data.data);
        const verifiedTransactionId = response.data.data.scrumPayTransactionId || transactionId;

        // Agregar token de autenticación para crear tickets si el usuario está autenticado
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        console.log('Creando tickets para transacción:', verifiedTransactionId);
        try {
          const ticketsResponse = await axios.post(
            `${API_URL}/transactions/create-tickets`,
            {
              transactionId: verifiedTransactionId,
              userId: user?.id || 1,
              items: Object.keys(selectedSectors)
                .map((sectorId) => {
                  const sector = sectors.find(s => s.id === Number(sectorId));
                  const quantity = selectedSectors[Number(sectorId)];
                  if (quantity <= 0) return null;
                  return {
                    attractionId: Number(attractionId),
                    sectorId: Number(sectorId),
                    quantity,
                    price: sector
                      ? (typeof sector.price === 'string' ? parseFloat(sector.price) : sector.price)
                      : undefined,
                    validFor: new Date(),
                  };
                })
                .filter(item => item !== null),
              notes: `Compra de entradas para ${attraction?.name || 'atracción'}`,
            },
            { headers }
          );

          console.log('Tickets generados:', ticketsResponse.data);
          setPaymentUrl(null);
          navigation.navigate('Main', { screen: 'Trips' });
        } catch (ticketsError) {
          console.error('Error al crear tickets:', ticketsError);
          
          // Si hay error 401, es posible que el usuario no esté autenticado o el token expiró
          if (axios.isAxiosError(ticketsError) && ticketsError.response?.status === 401) {
            Alert.alert(
              'Error de autenticación',
              'No pudimos crear sus tickets debido a un problema de autenticación. Por favor, inicie sesión nuevamente.',
              [
                { 
                  text: 'Ver tickets disponibles', 
                  onPress: () => navigation.navigate('Main', { screen: 'Trips' })
                }
              ]
            );
          } else {
            Alert.alert(
              'Error al generar tickets',
              'Su pago fue procesado, pero no pudimos generar sus tickets. Por favor contacte a soporte con el ID: ' + transactionId,
              [
                { 
                  text: 'Ver viajes', 
                  onPress: () => navigation.navigate('Main', { screen: 'Trips' })
                }
              ]
            );
          }
        }
      } else {
        console.error('Error al verificar la transacción:', response?.data);
        setPaymentUrl(null);
        Alert.alert('Error en la verificación', 'Hubo un problema al verificar su pago. Por favor, contacte a soporte.');
      }
    } catch (error) {
      console.error('Error al procesar tickets después del pago:', error);
      setPaymentUrl(null);
      Alert.alert(
        'Error en el proceso',
        'Su pago fue procesado, pero hubo un problema al generar sus entradas. Por favor contacte a soporte con el ID de transacción: ' + transactionId
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    console.error('Error en el proceso de pago:', errorMessage);
    Alert.alert(
      'Error en el pago',
      'No se pudo completar el pago: ' + errorMessage,
      [{ text: 'Intentar nuevamente', onPress: () => setPaymentUrl(null) }]
    );
  };

  const handleCancelPayment = () => {
    setPaymentUrl(null);
  };
  
  const renderSectorItem = ({ item }: { item: Sector }) => {
    const quantity = selectedSectors[item.id] || 0;
    return (
      <View style={styles.sectorCard}>
        <View style={styles.sectorInfo}>
          <Text style={styles.sectorName}>{item.name}</Text>
          <Text style={styles.sectorDescription}>{item.description || 'Sin descripción'}</Text>
          <Text style={styles.sectorPrice}>
            Bs {typeof item.price === 'number' ? item.price.toFixed(2) : (typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : '0.00')}
            </Text>
        </View>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={[styles.quantityButton, quantity === 0 && styles.quantityButtonDisabled]}
            onPress={() => handleDecrement(item)}
            disabled={quantity === 0}
          >
            <Ionicons name="remove" size={18} color={quantity === 0 ? '#ccc' : '#333'} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleIncrement(item)}
          >
            <Ionicons name="add" size={18} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5A5F" />
        <Text style={styles.loadingText}>Cargando sectores...</Text>
      </SafeAreaView>
    );
  }

  if (paymentUrl && fullTransactionId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <PaymentWidget
          paymentUrl={paymentUrl}
          returnUrl={`turisclick://payment/complete?id=${fullTransactionId}`}
          transactionId={fullTransactionId}
          onComplete={handlePaymentComplete}
          onError={handlePaymentError}
          onCancel={handleCancelPayment}
        />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seleccionar sectores</Text>
        <View style={{ width: 40 }}></View>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {attraction && (
          <View style={styles.attractionInfo}>
            <Image
              source={{ uri: getImageUrl(attraction.images) }}
              style={styles.attractionImage}
              resizeMode="cover"
            />
            <Text style={styles.attractionName}>{attraction.name}</Text>
            <Text style={styles.attractionLocation}>{attraction.location}</Text>
          </View>
        )}
        
        <View style={styles.sectionsContainer}>
          <Text style={styles.sectionTitle}>Sectores disponibles</Text>
          {sectors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="ticket-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No hay sectores disponibles</Text>
            </View>
          ) : (
            <FlatList
              data={sectors}
              renderItem={renderSectorItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.sectorsList}
            />
          )}
        </View>
      </ScrollView>
      
      {getTotalSelectedItems() > 0 && (
        <View style={styles.bottomContainer}>
          <View style={styles.summaryContainer}>
            <Text style={styles.totalItemsText}>
              {getTotalSelectedItems()} {getTotalSelectedItems() === 1 ? 'entrada' : 'entradas'}
            </Text>
            <Text style={styles.totalPriceText}>Bs {getTotalPrice().toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.checkoutButton,
              getTotalSelectedItems() === 0 && styles.disabledButton,
              paymentLoading && styles.loadingButton,
            ]}
            onPress={proceedToCheckout}
            disabled={getTotalSelectedItems() === 0 || paymentLoading}
          >
            {paymentLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
            <Text style={styles.checkoutButtonText}>Ir a pagar</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#888' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, textAlign: 'center' },
  scrollView: { flex: 1 },
  attractionInfo: { backgroundColor: '#fff', paddingBottom: 16, marginBottom: 8 },
  attractionImage: { width: '100%', height: 150 },
  attractionName: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 16, marginHorizontal: 16 },
  attractionLocation: { fontSize: 14, color: '#666', marginTop: 4, marginHorizontal: 16 },
  sectionsContainer: { backgroundColor: '#fff', paddingVertical: 16, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  sectorsList: { paddingBottom: 16 },
  sectorCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, marginBottom: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  sectorInfo: { flex: 1 },
  sectorName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  sectorDescription: { fontSize: 14, color: '#666', marginBottom: 8 },
  sectorPrice: { fontSize: 16, fontWeight: 'bold', color: '#FF5A5F' },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 16 },
  quantityButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  quantityButtonDisabled: { backgroundColor: '#f0f0f0', borderColor: '#e0e0e0' },
  quantityText: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 12, minWidth: 20, textAlign: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 16, textAlign: 'center' },
  bottomContainer: { backgroundColor: '#fff', paddingVertical: 16, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: hasNotch ? 34 : 20 },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalItemsText: { fontSize: 16, color: '#333' },
  totalPriceText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  checkoutButton: { backgroundColor: '#FF5A5F', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  checkoutButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  disabledButton: { backgroundColor: '#ccc' },
  loadingButton: { backgroundColor: '#ff8a8e' },
});

export default BuySectorsScreen; 
