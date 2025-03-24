import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../api/apiConfig';
import { useAuth } from '../context/AuthContext';
import QRCode from 'react-native-qrcode-svg';
import { useFocusEffect } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import base64 from 'base64-js';

// Obtener dimensiones de la pantalla para el modal
const { width: screenWidth } = Dimensions.get('window');
const QR_SIZE = screenWidth * 0.7; // 70% del ancho de la pantalla

// Llave secreta para encriptar - leer desde el archivo .env
const SECRET_KEY = Constants.expoConfig?.extra?.TICKET_SECRET_KEY || 'default_secret_key';

/**
 * Encripta el código del ticket para mostrarlo en el QR
 * Formato: { code: "CODIGO", timestamp: Date.now() }
 */
const encryptTicketCode = async (code: string, ticketId: number): Promise<string> => {
  try {
    // Crear un objeto con el código y datos adicionales de seguridad
    const data = {
      code,
      id: ticketId,
      timestamp: Date.now(),
      // No incluir datos sensibles aquí
    };
    
    // Convertir a JSON
    const jsonData = JSON.stringify(data);
    
    // Método alternativo para codificar en base64
    // Convertir string a array de bytes
    const textEncoder = new TextEncoder();
    const bytes = textEncoder.encode(jsonData);
    
    // Codificar a base64 usando base64-js
    const encodedData = base64.fromByteArray(bytes);
    
    // Crear un hash para verificación de integridad
    const signature = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      encodedData + SECRET_KEY
    );
    
    // Formato final: datos_codificados.firma
    return `${encodedData}.${signature.substring(0, 16)}`;
  } catch (error) {
    console.error('Error al encriptar código de ticket:', error);
    // En caso de error, devolver un código de respaldo
    return code; // Como mínimo, el código original
  }
};

// Tipo para los tickets
interface Ticket {
  id: number;
  code: string;
  attractionId: number;
  sectorId: number;
  price: number;
  validFor: string;
  status: 'ACTIVE' | 'USED' | 'CANCELLED';
  notes?: string;
  usedDate?: string;
  purchaseDate: string;
  attraction: {
    id: number;
    name: string;
    images?: string;
    location?: string;
  };
  sector: {
    id: number;
    name: string;
  };
}

const TripsScreen = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [encryptedCodes, setEncryptedCodes] = useState<{[key: number]: string}>({});

  const fetchTickets = async () => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('Obteniendo tickets del usuario:', user?.id);
      
      // Obtener tickets del usuario actual
      const response = await axios.get(`${API_URL}/ticket/user/${user?.id}`);
      
      console.log('Respuesta de tickets:', JSON.stringify(response.data, null, 2));
      
      if (response.data) {
        // Verificar si los datos están en la propiedad 'data' de la respuesta
        const ticketsData = response.data.data || response.data;
        console.log('Total de tickets encontrados:', Array.isArray(ticketsData) ? ticketsData.length : 0);
        
        // Mostrar detalles de cada ticket para depuración
        if (Array.isArray(ticketsData) && ticketsData.length > 0) {
          ticketsData.forEach((ticket, index) => {
            console.log(`Ticket ${index+1}:`, {
              id: ticket.id,
              code: ticket.code,
              price: ticket.price,
              priceType: typeof ticket.price,
              attraction: ticket.attraction?.name,
              sector: ticket.sector?.name,
              status: ticket.status
            });
          });
        }
        
        const ticketsArray = Array.isArray(ticketsData) ? ticketsData : [];
        setTickets(ticketsArray);
        
        // Encriptar códigos de tickets activos
        await encryptAllTicketCodes(ticketsArray);
      } else {
        console.log('No se encontraron datos de tickets en la respuesta');
        setTickets([]);
      }
    } catch (error) {
      console.error('Error al obtener tickets:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.log('Detalles del error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      setError('No se pudieron cargar los tickets. Intente nuevamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Cargar tickets cada vez que la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      console.log('TripsScreen obtuvo el foco, recargando tickets...');
      fetchTickets();
      return () => {
        // Cleanup opcional al perder el foco
      };
    }, [])
  );

  // Mantener el useEffect original para la carga inicial
  useEffect(() => {
    fetchTickets();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Activo';
      case 'USED':
        return 'Usado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#4CAF50';
      case 'USED':
        return '#9E9E9E';
      case 'CANCELLED':
        return '#F44336';
      default:
        return '#333333';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (e) {
      return dateString;
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

  // Función para encriptar todos los códigos de tickets activos
  const encryptAllTicketCodes = async (ticketsData: Ticket[]) => {
    const codes: {[key: number]: string} = {};
    
    for (const ticket of ticketsData) {
      if (ticket.status === 'ACTIVE') {
        const encrypted = await encryptTicketCode(ticket.code, ticket.id);
        codes[ticket.id] = encrypted;
      }
    }
    
    setEncryptedCodes(codes);
  };

  // Mostrar el QR ampliado para un ticket específico
  const showQrCode = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setQrModalVisible(true);
  };

  // Cerrar el modal del QR
  const closeQrModal = () => {
    setQrModalVisible(false);
    setSelectedTicket(null);
  };

  const renderTicketItem = ({ item }: { item: Ticket }) => {
    // Obtener código encriptado o usar el código original como fallback
    const qrValue = encryptedCodes[item.id] || item.code;
    
    return (
      <TouchableOpacity 
        style={styles.ticketCard}
        onPress={() => {
          if (item.status === 'ACTIVE') {
            // Si el ticket está activo, mostrar el QR ampliado
            showQrCode(item);
          } else {
            // Para tickets no activos, mostrar solo la info
            Alert.alert(
              'Detalles del Ticket',
              `Código: ${item.code}\nAtracción: ${item.attraction.name}\nSector: ${item.sector.name}\nPrecio: Bs. ${typeof item.price === 'string' ? item.price : item.price?.toFixed(2) || '0.00'}\nFecha válida: ${formatDate(item.validFor)}\nEstado: ${getStatusLabel(item.status)}`,
              [{ text: 'Cerrar', style: 'cancel' }]
            );
          }
        }}
      >
        <View style={styles.ticketHeader}>
          <View style={styles.ticketInfo}>
            <Text style={styles.attractionName}>{item.attraction.name}</Text>
            <Text style={styles.sectorName}>{item.sector.name}</Text>
            
            {/* <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.dateText}>Válido para: {formatDate(item.validFor)}</Text>
            </View> */}
            
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
              </View>
              <Text style={styles.priceText}>Bs. {typeof item.price === 'string' ? item.price : item.price?.toFixed(2) || '0.00'}</Text>
            </View>
          </View>
          
          <View style={styles.imageContainer}>
            {item.status === 'ACTIVE' ? (
              <QRCode
                value={qrValue}
                size={60}
                color="#000"
                backgroundColor="#fff"
              />
            ) : (
              <Image
                source={{ uri: getImageUrl(item.attraction.images) }}
                style={styles.attractionImage}
                resizeMode="cover"
              />
            )}
          </View>
        </View>
        
        <View style={styles.ticketFooter}>
          <Text style={styles.ticketCode}>Ticket: {item.code}</Text>
          <Text style={styles.purchaseDate}>Comprado el {formatDate(item.purchaseDate)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="ticket-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No tienes tickets</Text>
      <Text style={styles.emptyText}>
        Aquí se mostrarán tus entradas cuando realices una compra.
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5A5F" />
        <Text style={styles.loadingText}>Cargando tus tickets...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Tickets</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchTickets}
        >
          <Ionicons name="refresh" size={24} color="#FF5A5F" />
        </TouchableOpacity>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchTickets}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Modal para mostrar el QR ampliado */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={qrModalVisible}
        onRequestClose={closeQrModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Escanea este QR</Text>
              <TouchableOpacity onPress={closeQrModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {selectedTicket && (
              <View style={styles.qrContainer}>
                <QRCode
                  value={encryptedCodes[selectedTicket.id] || selectedTicket.code}
                  size={QR_SIZE}
                  color="#000"
                  backgroundColor="#fff"
                />
                <Text style={styles.ticketDetailText}>
                  {selectedTicket.attraction.name} - {selectedTicket.sector.name}
                </Text>
                <Text style={styles.ticketCodeText}>
                  Código: {selectedTicket.code.substring(0, 4)}******
                </Text>
                <Text style={styles.ticketValidText}>
                  Válido para: {formatDate(selectedTicket.validFor)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
      
      <FlatList
        data={tickets}
        renderItem={renderTicketItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.ticketList}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF5A5F']}
            tintColor="#FF5A5F"
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  ticketList: {
    padding: 16,
    paddingBottom: 80,
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketInfo: {
    flex: 1,
    marginRight: 12,
  },
  attractionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectorName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5A5F',
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  attractionImage: {
    width: '100%',
    height: '100%',
  },
  ticketFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketCode: {
    fontSize: 12,
    color: '#888',
  },
  purchaseDate: {
    fontSize: 12,
    color: '#888',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
  },
  // Estilos para el modal del QR
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 10,
  },
  ticketDetailText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333',
    textAlign: 'center',
  },
  ticketCodeText: {
    fontSize: 14,
    marginTop: 10,
    color: '#666',
  },
  ticketValidText: {
    fontSize: 14,
    marginTop: 5,
    color: '#666',
    marginBottom: 10,
  },
});

export default TripsScreen; 