import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getSectorsByAttraction, createSector, updateSector, deleteSector, Sector } from '../api/sectorsApi';
import { getAttractionById } from '../api/attractionsApi';
import { spacing, RFValue, hasNotch, getStatusBarHeight } from '../utils/dimensions';
import { SafeAreaView } from 'react-native-safe-area-context';

// Definir tipo para parámetros de ruta
type SectorsRouteParams = {
  attractionId: number;
};

const SectorsScreen = () => {
  const route = useRoute<RouteProp<Record<string, SectorsRouteParams>, string>>();
  const navigation = useNavigation();
  const { attractionId } = route.params || {};
  
  const [attraction, setAttraction] = useState<any>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for sector modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [sectorName, setSectorName] = useState('');
  const [sectorDescription, setSectorDescription] = useState('');
  const [sectorPrice, setSectorPrice] = useState('');
  const [sectorCapacity, setSectorCapacity] = useState('');

  useEffect(() => {
    if (attractionId) {
      fetchData();
    } else {
      setError('No se proporcionó ID de atracción');
      setLoading(false);
    }
  }, [attractionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch attraction details
      const attractionData = await getAttractionById(attractionId.toString());
      if (attractionData && attractionData.data) {
        setAttraction(attractionData.data);
      } else {
        setError('No se pudieron cargar los detalles de la atracción');
        setLoading(false);
        return;
      }
      
      // Fetch sectors for the attraction
      const sectorsData = await getSectorsByAttraction(attractionId);
      setSectors(sectorsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const openAddSectorModal = () => {
    // Reset form fields
    setEditingSector(null);
    setSectorName('');
    setSectorDescription('');
    setSectorPrice('');
    setSectorCapacity('');
    setModalVisible(true);
  };

  const openEditSectorModal = (sector: Sector) => {
    setEditingSector(sector);
    setSectorName(sector.name);
    setSectorDescription(sector.description || '');
    setSectorPrice(sector.price.toString());
    setSectorCapacity(sector.maxCapacity?.toString() || '');
    setModalVisible(true);
  };

  const handleSaveSector = async () => {
    // Validate fields
    if (!sectorName.trim()) {
      Alert.alert('Error', 'El nombre del sector es obligatorio');
      return;
    }

    if (!sectorPrice.trim() || isNaN(Number(sectorPrice)) || Number(sectorPrice) < 0) {
      Alert.alert('Error', 'Ingrese un precio válido');
      return;
    }

    try {
      const sectorData = {
        name: sectorName.trim(),
        description: sectorDescription.trim() || undefined,
        price: Number(sectorPrice),
        maxCapacity: sectorCapacity ? Number(sectorCapacity) : undefined,
        attractionId: Number(attractionId),
      };

      let updatedSector: Sector;

      if (editingSector) {
        // Update existing sector
        updatedSector = await updateSector(editingSector.id, sectorData);
        
        // Update the local state
        setSectors(sectors.map(s => s.id === editingSector.id ? updatedSector : s));
        Alert.alert('Éxito', 'Sector actualizado correctamente');
      } else {
        // Create new sector
        updatedSector = await createSector(sectorData);
        
        // Add to the local state
        setSectors([...sectors, updatedSector]);
        Alert.alert('Éxito', 'Sector creado correctamente');
      }

      // Close the modal
      setModalVisible(false);
    } catch (err) {
      console.error('Error saving sector:', err);
      Alert.alert('Error', 'Hubo un problema al guardar el sector');
    }
  };

  const handleDeleteSector = (sector: Sector) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que deseas eliminar el sector "${sector.name}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteSector(sector.id);
              if (success) {
                // Remove from local state
                setSectors(sectors.filter(s => s.id !== sector.id));
                Alert.alert('Éxito', 'Sector eliminado correctamente');
              } else {
                Alert.alert('Error', 'No se pudo eliminar el sector');
              }
            } catch (err) {
              console.error('Error deleting sector:', err);
              Alert.alert('Error', 'Hubo un problema al eliminar el sector');
            }
          },
        },
      ]
    );
  };

  const renderSectorItem = ({ item }: { item: Sector }) => (
    <View style={styles.sectorCard}>
      <View style={styles.sectorHeader}>
        <Text style={styles.sectorName}>{item.name}</Text>
        <View style={styles.priceBadge}>
          <Text style={styles.sectorPrice}>Bs {typeof item.price === 'number' 
            ? item.price.toFixed(2) 
            : (typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : '0.00')}</Text>
        </View>
      </View>
      
      {item.description && (
        <Text style={styles.sectorDescription}>{item.description}</Text>
      )}
      
      {item.maxCapacity && (
        <View style={styles.capacityContainer}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.sectorCapacity}>
            Capacidad: {item.maxCapacity} personas
          </Text>
        </View>
      )}
      
      <View style={styles.sectorActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditSectorModal(item)}
        >
          <Ionicons name="pencil-outline" size={16} color="white" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteSector(item)}
        >
          <Ionicons name="trash-outline" size={16} color="white" />
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF5A5F" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sectores y Precios</Text>
          <View style={{ width: 24 }} />
        </View>
        
        {attraction && (
          <View style={styles.attractionInfo}>
            <Text style={styles.attractionName}>{attraction.name}</Text>
            <Text style={styles.attractionLocation}>
              <Ionicons name="location-outline" size={16} color="#666" />
              {' '}{attraction.location || 'Ubicación no especificada'}
            </Text>
          </View>
        )}
        
        {sectors.length === 0 ? (
          // Vista cuando no hay sectores - sin scroll
          <View style={styles.emptyFullContainer}>
            <View style={styles.emptyTopSpace} />
            <Ionicons name="ticket-outline" size={64} color="#f0f0f0" />
            <Text style={styles.emptyText}>No hay sectores definidos</Text>
            <Text style={styles.emptySubText}>
              Los sectores permiten definir diferentes tipos de entrada con precios específicos
            </Text>
            <View style={styles.emptyBottomSpace} />
            <TouchableOpacity 
              style={styles.emptyAddButton}
              onPress={openAddSectorModal}
            >
              <Text style={styles.emptyAddButtonText}>Añadir Sector</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Vista cuando hay sectores - con scroll solo si hay más de 3
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[
              styles.contentContainer,
              // Si hay 3 o menos sectores, expandir para llenar el espacio
              sectors.length <= 3 && styles.expandContent
            ]}
            scrollEnabled={sectors.length > 3} // Solo habilitar scroll cuando hay más de 3 sectores
          >
            <View style={styles.sectorsGrid}>
              {sectors.map(item => (
                <View key={item.id.toString()} style={styles.sectorCard}>
                  <View style={styles.sectorHeader}>
                    <Text style={styles.sectorName}>{item.name}</Text>
                    <View style={styles.priceBadge}>
                      <Text style={styles.sectorPrice}>Bs {typeof item.price === 'number' 
                        ? item.price.toFixed(2) 
                        : (typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : '0.00')}</Text>
                    </View>
                  </View>
                  
                  {item.description && (
                    <Text style={styles.sectorDescription}>{item.description}</Text>
                  )}
                  
                  {item.maxCapacity && (
                    <View style={styles.capacityContainer}>
                      <Ionicons name="people-outline" size={16} color="#666" />
                      <Text style={styles.sectorCapacity}>
                        Capacidad: {item.maxCapacity} personas
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.sectorActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => openEditSectorModal(item)}
                    >
                      <Ionicons name="pencil-outline" size={16} color="white" />
                      <Text style={styles.actionButtonText}>Editar</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteSector(item)}
                    >
                      <Ionicons name="trash-outline" size={16} color="white" />
                      <Text style={styles.actionButtonText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
        
        {sectors.length > 0 && (
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={openAddSectorModal}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        )}
        
        {/* Sector Edit/Add Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingSector ? 'Editar Sector' : 'Añadir Nuevo Sector'}
                </Text>
                <TouchableOpacity 
                  onPress={() => setModalVisible(false)}
                  style={styles.closeModalButton}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                style={styles.modalBody}
                contentContainerStyle={styles.modalBodyContent}
              >
                <View style={styles.formContainer}>
                  <Text style={styles.inputLabel}>Nombre del Sector *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={sectorName}
                    onChangeText={setSectorName}
                    placeholder="Ej: Adulto, Niño, VIP, Estudiante"
                    placeholderTextColor="#aaa"
                  />
                  
                  <Text style={styles.inputLabel}>Descripción</Text>
                  <TextInput
                    style={[styles.textInput, styles.textAreaInput]}
                    value={sectorDescription}
                    onChangeText={setSectorDescription}
                    placeholder="Describe brevemente este sector o tipo de entrada"
                    placeholderTextColor="#aaa"
                    multiline
                    numberOfLines={3}
                  />
                  
                  <Text style={styles.inputLabel}>Precio *</Text>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.currencySymbol}>Bs</Text>
                    <TextInput
                      style={styles.priceInput}
                      value={sectorPrice}
                      onChangeText={setSectorPrice}
                      placeholder="0.00"
                      placeholderTextColor="#aaa"
                      keyboardType="decimal-pad"
                    />
                  </View>
                  
                  <Text style={styles.inputLabel}>Capacidad Máxima</Text>
                  <View style={styles.capacityInputContainer}>
                    <TextInput
                      style={styles.capacityInput}
                      value={sectorCapacity}
                      onChangeText={setSectorCapacity}
                      placeholder="Sin límite"
                      placeholderTextColor="#aaa"
                      keyboardType="number-pad"
                    />
                    <Text style={styles.capacityLabel}>personas</Text>
                  </View>
                </View>
              </ScrollView>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveSector}
                >
                  <Text style={styles.saveButtonText}>
                    {editingSector ? 'Actualizar Sector' : 'Crear Sector'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: RFValue(18),
    fontWeight: 'bold',
    color: '#333',
  },
  attractionInfo: {
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  attractionName: {
    fontSize: RFValue(20),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  attractionLocation: {
    fontSize: RFValue(14),
    color: '#666',
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80, // Espacio para el botón flotante
  },
  expandContent: {
    flexGrow: 1,
  },
  sectorsGrid: {
    flexDirection: 'column',
    gap: 16,
  },
  sectorCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectorName: {
    fontSize: RFValue(16),
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  priceBadge: {
    backgroundColor: '#F5F8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E6F2',
  },
  sectorPrice: {
    fontSize: RFValue(16),
    fontWeight: 'bold',
    color: '#FF5A5F',
  },
  sectorDescription: {
    fontSize: RFValue(14),
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectorCapacity: {
    fontSize: RFValue(14),
    color: '#666',
    marginLeft: 6,
  },
  sectorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 4,
    fontSize: RFValue(12),
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#FF5A5F',
  },
  emptyFullContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTopSpace: {
    flex: 0.2, // 20% del espacio superior
  },
  emptyBottomSpace: {
    flex: 0.5, // 50% del espacio inferior (empuja el botón hacia abajo)
  },
  emptyText: {
    fontSize: RFValue(18),
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: RFValue(14),
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  emptyAddButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 24,
    marginBottom: 50, // Espacio fijo en la parte inferior
  },
  emptyAddButtonText: {
    color: 'white',
    fontSize: RFValue(14),
    fontWeight: 'bold',
  },
  floatingButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF5A5F',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: RFValue(18),
    fontWeight: 'bold',
    color: '#333',
  },
  closeModalButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    paddingBottom: 0, // Quitar padding inferior porque ahora tendremos un footer
  },
  modalBodyContent: {
    paddingBottom: 20,
  },
  formContainer: {
    flex: 1,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  inputLabel: {
    fontSize: RFValue(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: RFValue(15),
    backgroundColor: '#f9f9f9',
  },
  textAreaInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  currencySymbol: {
    paddingHorizontal: 12,
    fontSize: RFValue(16),
    color: '#666',
  },
  priceInput: {
    flex: 1,
    padding: 12,
    fontSize: RFValue(15),
  },
  capacityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  capacityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: RFValue(15),
    backgroundColor: '#f9f9f9',
    marginRight: 10,
  },
  capacityLabel: {
    fontSize: RFValue(15),
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#FF5A5F',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: RFValue(16),
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF5A5F',
    fontSize: RFValue(16),
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: RFValue(16),
    fontWeight: 'bold',
  },
});

export default SectorsScreen; 