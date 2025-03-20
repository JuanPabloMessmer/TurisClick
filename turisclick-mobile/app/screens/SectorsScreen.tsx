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
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getSectorsByAttraction, createSector, updateSector, deleteSector, Sector } from '../api/sectorsApi';
import { getAttractionById } from '../api/attractionsApi';
import { spacing, RFValue } from '../utils/dimensions';

const SectorsScreen = () => {
  const route = useRoute();
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
      setError('No attraction ID provided');
      setLoading(false);
    }
  }, [attractionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch attraction details
      const attractionData = await getAttractionById(attractionId);
      if (attractionData) {
        setAttraction(attractionData);
      } else {
        setError('Could not load attraction details');
        setLoading(false);
        return;
      }
      
      // Fetch sectors for the attraction
      const sectorsData = await getSectorsByAttraction(attractionId);
      setSectors(sectorsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error loading data');
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

      let updatedSector;

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
        <Text style={styles.sectorPrice}>${item.price.toFixed(2)}</Text>
      </View>
      
      {item.description && <Text style={styles.sectorDescription}>{item.description}</Text>}
      
      {item.maxCapacity && (
        <Text style={styles.sectorCapacity}>Capacidad máxima: {item.maxCapacity}</Text>
      )}
      
      <View style={styles.sectorActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditSectorModal(item)}
        >
          <Ionicons name="pencil" size={16} color="white" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteSector(item)}
        >
          <Ionicons name="trash" size={16} color="white" />
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF5A5F" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sectores</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {attraction && (
        <View style={styles.attractionInfo}>
          <Text style={styles.attractionName}>{attraction.name}</Text>
        </View>
      )}
      
      <FlatList
        data={sectors}
        renderItem={renderSectorItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No hay sectores definidos</Text>
            <Text style={styles.emptySubText}>
              Crea sectores para definir diferentes precios
            </Text>
          </View>
        )}
      />
      
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={openAddSectorModal}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
      
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
                {editingSector ? 'Editar Sector' : 'Nuevo Sector'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nombre del Sector *</Text>
              <TextInput
                style={styles.textInput}
                value={sectorName}
                onChangeText={setSectorName}
                placeholder="Ej: Adulto, Niño, Estudiante"
              />
              
              <Text style={styles.inputLabel}>Descripción</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                value={sectorDescription}
                onChangeText={setSectorDescription}
                placeholder="Descripción opcional del sector"
                multiline
                numberOfLines={3}
              />
              
              <Text style={styles.inputLabel}>Precio *</Text>
              <TextInput
                style={styles.textInput}
                value={sectorPrice}
                onChangeText={setSectorPrice}
                placeholder="Precio en Bs."
                keyboardType="decimal-pad"
              />
              
              <Text style={styles.inputLabel}>Capacidad Máxima</Text>
              <TextInput
                style={styles.textInput}
                value={sectorCapacity}
                onChangeText={setSectorCapacity}
                placeholder="Capacidad máxima (opcional)"
                keyboardType="number-pad"
              />
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveSector}
              >
                <Text style={styles.saveButtonText}>
                  {editingSector ? 'Actualizar Sector' : 'Crear Sector'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  attractionInfo: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  attractionName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Space for the floating button
  },
  sectorCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sectorPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5A5F',
  },
  sectorDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  sectorCapacity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  sectorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 12,
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
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
    borderRadius: 8,
    width: '90%',
    maxHeight: '80%',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textAreaInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#FF5A5F',
    padding: 16,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SectorsScreen; 