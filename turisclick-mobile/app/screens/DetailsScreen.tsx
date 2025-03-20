import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getAttractionById } from '../api/attractionsApi';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../api/apiConfig';

// Define attraction data type with el nuevo campo allCategories
type AttractionType = {
  id: number;
  name: string;
  description: string;
  opening_time: string;
  closing_time: string;
  price: number | null;
  location: string;
  images: string;
  status: string;
  admin?: any;
  category?: any;
  city?: any;
  allCategories?: any[];
  attractionCategories?: any[];
};

const DetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { itemId } = route.params || {};
  
  const [attraction, setAttraction] = useState<AttractionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (itemId) {
      fetchAttractionDetails(itemId);
    } else {
      setError('No attraction ID provided');
      setLoading(false);
    }
  }, [itemId]);

  const fetchAttractionDetails = async (id) => {
    try {
      setLoading(true);
      const response = await getAttractionById(id);
      console.log('Attraction details:', response);
      
      if (response) {
        setAttraction(response);
        setError(null);
      } else {
        console.log('Invalid response format:', response);
        setError('Could not load attraction details');
      }
    } catch (err) {
      console.error('Error fetching attraction details:', err);
      setError('Error fetching attraction details');
    } finally {
      setLoading(false);
    }
  };

  // Actualizar la función getImageUrl 
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return 'https://via.placeholder.com/400x200?text=No+Image';
    
    // If it's already a full URL
    if (imagePath.startsWith('http')) return imagePath;
    
    // If it's an array or multiple images separated by commas, get the first one
    const firstImage = Array.isArray(imagePath) 
      ? imagePath[0] 
      : (imagePath.includes(',') ? imagePath.split(',')[0].trim() : imagePath);
    
    // Si la ruta ya comienza con 'uploads/', necesitamos añadir una barra
    const normalizedPath = firstImage.startsWith('uploads/') ? `/${firstImage}` : `/${firstImage}`;
    
    // Join the API base URL with the image path
    const fullUrl = `${API_URL}${normalizedPath}`;
    console.log(`Imagen en DetailsScreen cargada desde: ${fullUrl}`);
    return fullUrl;
  };

  const navigateToSectors = () => {
    if (attraction?.id) {
      navigation.navigate('Sectors', { attractionId: attraction.id });
    } else {
      Alert.alert('Error', 'No se pudo obtener el ID de la atracción');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF5A5F" />
      </View>
    );
  }

  if (error || !attraction) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Attraction not found'}</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image 
        source={{ uri: getImageUrl(attraction.images) }} 
        style={styles.image} 
        resizeMode="cover" 
      />
      
      <View style={styles.content}>
        <Text style={styles.title}>{attraction.name}</Text>
        
        {attraction.city && (
          <Text style={styles.location}>{attraction.city.name}</Text>
        )}
        
        <View style={styles.infoRow}>
          {attraction.price ? (
            <View style={styles.priceContainer}>
              <Text style={styles.price}>
                ${attraction.price}
              </Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.sectorsButton}
              onPress={navigateToSectors}
            >
              <Text style={styles.sectorsButtonText}>Ver sectores y precios</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.timeContainer}>
            <Text style={styles.time}>
              {attraction.opening_time.substring(0, 5)} - {attraction.closing_time.substring(0, 5)}
            </Text>
          </View>
          
          {attraction.status && (
            <View style={[
              styles.statusContainer, 
              { backgroundColor: attraction.status === 'Active' ? '#e6f7ee' : '#fff9e6' }
            ]}>
              <Text style={[
                styles.status,
                { color: attraction.status === 'Active' ? '#00a86b' : '#ffaa00' }
              ]}>
                {attraction.status}
              </Text>
            </View>
          )}
        </View>
        
        {attraction.category && (
          <View style={styles.infoRow}>
            {/* Mostrar categoría principal */}
            <View style={styles.categoryContainer}>
              <Text style={styles.category}>{attraction.category.name}</Text>
            </View>
            
            {/* Mostrar categorías adicionales si existen */}
            {attraction.allCategories && attraction.allCategories.length > 0 ? 
              attraction.allCategories
                .filter(cat => cat.id !== attraction.category.id) // Filtrar la categoría principal
                .map(cat => (
                  <View key={cat.id} style={styles.categoryContainer}>
                    <Text style={styles.category}>{cat.name}</Text>
                  </View>
                ))
              : attraction.attractionCategories && attraction.attractionCategories.length > 0 ?
                attraction.attractionCategories
                  .filter(ac => ac.category.id !== attraction.category.id) // Filtrar la categoría principal
                  .map(ac => (
                    <View key={ac.category.id} style={styles.categoryContainer}>
                      <Text style={styles.category}>{ac.category.name}</Text>
                    </View>
                  ))
              : null
            }
          </View>
        )}
        
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{attraction.description}</Text>
        
        {attraction.location && (
          <>
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.locationLink}>{attraction.location}</Text>
            </TouchableOpacity>
          </>
        )}

        {attraction.price === null && (
          <View style={styles.sectorsInfoContainer}>
            <Text style={styles.sectionTitle}>Precios por Sectores</Text>
            <Text style={styles.sectorInfo}>
              Esta atracción tiene precios diferenciados según el tipo de visitante.
              Consulta los sectores disponibles para conocer las tarifas.
            </Text>
            <TouchableOpacity 
              style={styles.createSectorButton}
              onPress={navigateToSectors}
            >
              <Ionicons name="add-circle" size={24} color="white" style={styles.buttonIcon} />
              <Text style={styles.createSectorButtonText}>Gestionar Sectores</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Reservar Ahora</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  image: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  priceContainer: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  sectorsButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  sectorsButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  timeContainer: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  time: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  categoryContainer: {
    backgroundColor: '#f3f3f3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  category: {
    fontSize: 14,
    color: '#444',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  locationLink: {
    fontSize: 16,
    color: '#0066cc',
    textDecorationLine: 'underline',
  },
  sectorsInfoContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  sectorInfo: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 14,
  },
  createSectorButton: {
    backgroundColor: '#FF5A5F',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  createSectorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 8,
  },
  bookButton: {
    backgroundColor: '#FF5A5F',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  bookButtonText: {
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

export default DetailsScreen; 