import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RFValue } from 'react-native-responsive-fontsize';
import { getAttractions, AttractionType } from '../api/attractionsApi';
import { API_URL } from '../api/apiConfig';
import { useAuth } from '../context/AuthContext';
import { spacing, hasNotch } from '../utils/dimensions';
import { 
  getSectorsByAttraction, 
  createSector, 
  updateSector, 
  deleteSector,
  Sector,
  CreateSectorData
} from '../api/sectorsApi';

const AdminScreen = () => {
  const [myAttractions, setMyAttractions] = useState<AttractionType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para gestión de sectores
  const [selectedAttraction, setSelectedAttraction] = useState<AttractionType | null>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loadingSectors, setLoadingSectors] = useState<boolean>(false);
  const [showSectorsModal, setShowSectorsModal] = useState<boolean>(false);
  
  // Estados para el formulario de sectores
  const [showSectorForm, setShowSectorForm] = useState<boolean>(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [sectorName, setSectorName] = useState<string>('');
  const [sectorDescription, setSectorDescription] = useState<string>('');
  const [sectorPrice, setSectorPrice] = useState<string>('');
  const [sectorCapacity, setSectorCapacity] = useState<string>('');
  
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  useEffect(() => {
    fetchMyAttractions();
  }, []);

  const fetchMyAttractions = async () => {
    try {
      setLoading(true);
      // Obtenemos todas las atracciones y filtramos por las del usuario actual
      // En un caso ideal, habría un endpoint en la API para obtener solo las atracciones del usuario
      const response = await getAttractions();
      console.log('Atracciones obtenidas:', response);
      console.log('ID del usuario actual:', user?.id, 'tipo:', typeof user?.id);
      
      if (response && response.status === 'success' && Array.isArray(response.data)) {
        console.log('Total de atracciones:', response.data.length);
        
        // Mostrar información relevante de cada atracción para depuración
        response.data.forEach(attraction => {
          console.log('Atracción ID:', attraction.id, 
                     'adminId:', attraction.adminId, 'tipo:', typeof attraction.adminId,
                     'userId:', attraction.userId, 'tipo:', typeof attraction.userId,
                     'admin.id:', attraction.admin?.id, 'tipo:', typeof attraction.admin?.id);
        });
        
        // Filtrar las atracciones creadas por el usuario actual
        // Verificamos múltiples campos que podrían contener el ID del usuario
        const userAttractions = response.data.filter(attraction => {
          const adminId = attraction.adminId;
          const userId = attraction.userId;
          const adminObjId = attraction.admin?.id;
          
          // Convertir a números para comparación segura
          const adminIdNum = adminId ? Number(adminId) : null;
          const userIdNum = userId ? Number(userId) : null;
          const adminObjIdNum = adminObjId ? Number(adminObjId) : null;
          const currentUserId = user?.id ? Number(user.id) : null;
          
          // Comparar con el ID de usuario actual
          const isUserAttraction = 
            (adminIdNum && adminIdNum === currentUserId) || 
            (userIdNum && userIdNum === currentUserId) ||
            (adminObjIdNum && adminObjIdNum === currentUserId);
          
          console.log(`Atracción ${attraction.id} (${attraction.name}) pertenece al usuario: ${isUserAttraction}`);
          
          return isUserAttraction;
        });
        
        console.log('Atracciones filtradas del usuario:', userAttractions.length);
        setMyAttractions(userAttractions);
        setError(null);
      } else {
        console.log('Formato de respuesta inválido:', response);
        setError('Error al cargar las atracciones');
      }
    } catch (err) {
      console.error('Error al cargar atracciones:', err);
      setError('Error al cargar tus atracciones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para cargar los sectores de una atracción
  const fetchSectors = async (attractionId: number) => {
    setLoadingSectors(true);
    try {
      const data = await getSectorsByAttraction(attractionId);
      // Asegurar que los datos del sector tienen el formato correcto
      const formattedSectors = data.map(sector => ({
        ...sector,
        price: typeof sector.price === 'string' ? parseFloat(sector.price) : sector.price
      }));
      console.log('Sectores formateados:', formattedSectors);
      setSectors(formattedSectors);
    } catch (error) {
      console.error('Error al cargar sectores:', error);
      Alert.alert('Error', 'No se pudieron cargar los sectores de esta atracción');
    } finally {
      setLoadingSectors(false);
    }
  };

  // Función para abrir el modal de gestión de sectores
  const handleManageSectors = async (attraction: AttractionType) => {
    try {
      setSelectedAttraction(attraction);
      await fetchSectors(attraction.id);
      // Asegurar que el estado se actualiza antes de mostrar el modal
      setTimeout(() => {
        setShowSectorsModal(true);
      }, 100);
    } catch (error) {
      console.error('Error al abrir el modal de sectores:', error);
      Alert.alert('Error', 'No se pudo abrir la gestión de sectores');
    }
  };

  // Función para abrir el formulario de creación/edición de sector
  const openSectorForm = (sector?: Sector) => {
    console.log('Abriendo formulario de sector:', sector ? 'Editar' : 'Nuevo');
    
    if (sector) {
      // Estamos editando un sector existente
      setEditingSector(sector);
      setSectorName(sector.name);
      setSectorDescription(sector.description || '');
      setSectorPrice(sector.price.toString());
      setSectorCapacity(sector.maxCapacity?.toString() || '');
    } else {
      // Estamos creando un nuevo sector
      setEditingSector(null);
      setSectorName('');
      setSectorDescription('');
      setSectorPrice('');
      setSectorCapacity('');
    }
    
    // Mostrar el modal inmediatamente para pruebas
    setShowSectorForm(true);
    
    // Seguimos manteniendo el setTimeout como respaldo
    setTimeout(() => {
      console.log('SetTimeout: intentando mostrar el formulario de sector');
      setShowSectorForm(true);
    }, 300);
  };

  // Función para guardar un sector (crear o actualizar)
  const handleSaveSector = async () => {
    if (!sectorName || !sectorPrice) {
      Alert.alert('Error', 'Por favor completa los campos obligatorios');
      return;
    }

    if (!selectedAttraction) {
      Alert.alert('Error', 'No se pudo determinar la atracción');
      return;
    }

    try {
      const sectorData: CreateSectorData = {
        name: sectorName,
        description: sectorDescription || undefined,
        price: parseFloat(sectorPrice),
        maxCapacity: sectorCapacity ? parseInt(sectorCapacity) : undefined,
        attractionId: selectedAttraction.id
      };

      if (editingSector) {
        // Actualizar sector existente
        await updateSector(editingSector.id, sectorData);
        Alert.alert('Éxito', 'Sector actualizado correctamente');
      } else {
        // Crear nuevo sector
        await createSector(sectorData);
        Alert.alert('Éxito', 'Sector creado correctamente');
      }

      // Cerrar el formulario primero
      setShowSectorForm(false);
      
      // Esperar un momento antes de recargar los sectores
      setTimeout(async () => {
        // Recargar sectores
        if (selectedAttraction) {
          await fetchSectors(selectedAttraction.id);
        }
      }, 300);
    } catch (error) {
      console.error('Error al guardar sector:', error);
      Alert.alert('Error', 'No se pudo guardar el sector');
    }
  };

  // Función para eliminar un sector
  const handleDeleteSector = (sector: Sector) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que deseas eliminar el sector "${sector.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSector(sector.id);
              await fetchSectors(selectedAttraction?.id || 0);
              Alert.alert('Éxito', 'Sector eliminado correctamente');
            } catch (error) {
              console.error('Error al eliminar sector:', error);
              Alert.alert('Error', 'No se pudo eliminar el sector');
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyAttractions();
  };

  const navigateToCreateAttraction = () => {
    navigation.navigate('CreateAttraction');
  };

  const navigateToEditAttraction = (attractionId: number) => {
    // Por ahora solo navegamos a detalles, pero se podría crear una pantalla de edición
    navigation.navigate('Details', { itemId: attractionId });
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return 'https://via.placeholder.com/400x200?text=No+Image';
    
    if (imagePath.startsWith('http')) return imagePath;
    
    const firstImage = Array.isArray(imagePath) 
      ? imagePath[0] 
      : (imagePath.includes(',') ? imagePath.split(',')[0].trim() : imagePath);
    
    const normalizedPath = firstImage.startsWith('uploads/') ? `/${firstImage}` : `/${firstImage}`;
    
    return `${API_URL}${normalizedPath}`;
  };

  const renderAttractionItem = ({ item }: { item: AttractionType }) => (
    <View style={styles.attractionItem}>
      <TouchableOpacity 
        style={styles.attractionItemContent}
        onPress={() => navigateToEditAttraction(item.id)}
        activeOpacity={0.8}
      >
        <Image 
          source={{ uri: getImageUrl(item.images) }}
          style={styles.attractionImage}
          resizeMode="cover"
        />
        <View style={styles.attractionContent}>
          <Text style={styles.attractionName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.attractionLocation} numberOfLines={1}>{item.location}</Text>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: item.status === 'Active' ? '#e6f7ee' : '#fff9e6' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: item.status === 'Active' ? '#00a86b' : '#ffaa00' }
              ]}>
                {item.status || 'Pendiente'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => handleManageSectors(item)}
          activeOpacity={0.6}
        >
          <Ionicons name="ticket-outline" size={20} color="#555" />
          <Text style={styles.buttonText}>Sectores</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => navigateToEditAttraction(item.id)}
          activeOpacity={0.6}
        >
          <Ionicons name="create-outline" size={20} color="#555" />
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="business-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No tienes atracciones</Text>
      <Text style={styles.emptyStateSubtitle}>Crea tu primera atracción para comenzar</Text>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={navigateToCreateAttraction}
      >
        <Text style={styles.createButtonText}>Crear atracción</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5A5F" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMyAttractions}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={myAttractions}
        renderItem={renderAttractionItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF5A5F']}
            tintColor="#FF5A5F"
          />
        }
        ListEmptyComponent={renderEmptyState()}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Administra tus atracciones</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={navigateToCreateAttraction}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        }
      />
    );
  };

  // Renderizar el modal de gestión de sectores
  const renderSectorsModal = () => (
    <Modal
      visible={showSectorsModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowSectorsModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Sectores de {selectedAttraction?.name}
            </Text>
            <TouchableOpacity 
              onPress={() => setShowSectorsModal(false)}
              style={styles.closeButton}
              activeOpacity={0.6}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {loadingSectors ? (
              <ActivityIndicator size="large" color="#FF5A5F" />
            ) : (
              <>
                {sectors.length === 0 ? (
                  <View style={styles.emptySectors}>
                    <Ionicons name="ticket-outline" size={48} color="#ccc" />
                    <Text style={styles.emptySectorsText}>
                      No hay sectores definidos
                    </Text>
                    <Text style={styles.emptySectorsSubtitle}>
                      Los sectores te permiten definir diferentes tipos de entradas con precios específicos
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={sectors}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <View style={styles.sectorItem}>
                        <View style={styles.sectorInfo}>
                          <Text style={styles.sectorName}>{item.name}</Text>
                          {item.description && (
                            <Text style={styles.sectorDescription} numberOfLines={2}>
                              {item.description}
                            </Text>
                          )}
                          <Text style={styles.sectorPrice}>
                            ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
                          </Text>
                          {item.maxCapacity && (
                            <Text style={styles.sectorCapacity}>
                              Capacidad: {item.maxCapacity}
                            </Text>
                          )}
                        </View>
                        <View style={styles.sectorActions}>
                          <TouchableOpacity
                            style={styles.sectorAction}
                            onPress={() => openSectorForm(item)}
                            activeOpacity={0.6}
                          >
                            <Ionicons name="create-outline" size={18} color="#555" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.sectorAction}
                            onPress={() => handleDeleteSector(item)}
                            activeOpacity={0.6}
                          >
                            <Ionicons name="trash-outline" size={18} color="#FF5A5F" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  />
                )}

                <TouchableOpacity
                  style={[styles.addSectorButton, {marginBottom: 20}]}
                  onPress={() => {
                    console.log("Botón de añadir sector presionado");
                    // Primero cerrar el modal de sectores
                    setShowSectorsModal(false);
                    // Esperar un poco antes de abrir el formulario
                    setTimeout(() => {
                      console.log("Ejecutando openSectorForm después del timeout");
                      openSectorForm();
                    }, 500);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle-outline" size={18} color="white" style={{marginRight: 8}} />
                  <Text style={styles.addSectorButtonText}>Añadir sector</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  // Renderizar el formulario para crear/editar un sector
  const renderSectorForm = () => (
    <Modal
      visible={showSectorForm}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowSectorForm(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingSector ? 'Editar sector' : 'Nuevo sector'}
            </Text>
            <TouchableOpacity 
              onPress={() => setShowSectorForm(false)}
              style={styles.closeButton}
              activeOpacity={0.6}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <Text style={styles.inputLabel}>Nombre del sector *</Text>
            <TextInput
              style={styles.input}
              value={sectorName}
              onChangeText={setSectorName}
              placeholder="Ej: Adulto, Niño, VIP..."
              maxLength={50}
            />

            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={sectorDescription}
              onChangeText={setSectorDescription}
              placeholder="Descripción opcional del sector"
              multiline
              numberOfLines={4}
              maxLength={200}
            />

            <Text style={styles.inputLabel}>Precio *</Text>
            <TextInput
              style={styles.input}
              value={sectorPrice}
              onChangeText={setSectorPrice}
              placeholder="0.00"
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Capacidad máxima</Text>
            <TextInput
              style={styles.input}
              value={sectorCapacity}
              onChangeText={setSectorCapacity}
              placeholder="Dejar en blanco si no hay límite"
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveSector}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  useEffect(() => {
    console.log('Estado de showSectorForm cambió a:', showSectorForm);
  }, [showSectorForm]);

  useEffect(() => {
    console.log('Estado de showSectorsModal cambió a:', showSectorsModal);
  }, [showSectorsModal]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      {renderContent()}
      {renderSectorsModal()}
      {renderSectorForm()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.m,
  },
  errorText: {
    fontSize: RFValue(16),
    color: '#666',
    textAlign: 'center',
    marginBottom: spacing.s,
  },
  retryButton: {
    backgroundColor: '#FF5A5F',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.s,
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: hasNotch ? spacing.xl : spacing.m,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: RFValue(18),
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#FF5A5F',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attractionItem: {
    backgroundColor: 'white',
    marginHorizontal: spacing.m,
    marginVertical: spacing.xs,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  attractionItemContent: {
    flexDirection: 'row',
  },
  attractionImage: {
    width: 80,
    height: 80,
  },
  attractionContent: {
    flex: 1,
    padding: spacing.s,
    justifyContent: 'space-between',
  },
  attractionName: {
    fontSize: RFValue(14),
    fontWeight: 'bold',
    color: '#333',
  },
  attractionLocation: {
    fontSize: RFValue(12),
    color: '#666',
    marginBottom: spacing.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: RFValue(10),
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  iconButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s,
  },
  buttonText: {
    fontSize: RFValue(12),
    color: '#555',
    marginLeft: spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
    marginTop: 100,
  },
  emptyStateTitle: {
    fontSize: RFValue(18),
    fontWeight: 'bold',
    color: '#333',
    marginTop: spacing.m,
  },
  emptyStateSubtitle: {
    fontSize: RFValue(14),
    color: '#666',
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.m,
  },
  createButton: {
    backgroundColor: '#FF5A5F',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: RFValue(14),
  },
  // Estilos para el modal de sectores
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: RFValue(16),
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalBody: {
    padding: spacing.m,
    maxHeight: '70%',
  },
  emptySectors: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.l,
  },
  emptySectorsText: {
    fontSize: RFValue(16),
    fontWeight: 'bold',
    color: '#333',
    marginTop: spacing.m,
  },
  emptySectorsSubtitle: {
    fontSize: RFValue(14),
    color: '#666',
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.m,
  },
  sectorItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    padding: spacing.s,
    borderRadius: 8,
    marginBottom: spacing.s,
  },
  sectorInfo: {
    flex: 1,
  },
  sectorName: {
    fontSize: RFValue(14),
    fontWeight: 'bold',
    color: '#333',
  },
  sectorDescription: {
    fontSize: RFValue(12),
    color: '#666',
    marginTop: 2,
  },
  sectorPrice: {
    fontSize: RFValue(14),
    fontWeight: '600',
    color: '#00a86b',
    marginTop: spacing.xs,
  },
  sectorCapacity: {
    fontSize: RFValue(12),
    color: '#666',
  },
  sectorActions: {
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sectorAction: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  addSectorButton: {
    backgroundColor: '#FF5A5F',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: spacing.m + 4, // Extra padding for better alignment
    minWidth: 160, // Ensure minimum width for better touch target
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  addSectorButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: RFValue(14),
  },
  // Estilos para el formulario
  formContainer: {
    padding: spacing.m,
  },
  inputLabel: {
    fontSize: RFValue(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: spacing.s,
    fontSize: RFValue(14),
    marginBottom: spacing.m,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#00a86b',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: spacing.s,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: RFValue(14),
  },
});

export default AdminScreen; 