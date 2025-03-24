import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Dimensions, Share, Linking, Platform, Pressable, FlatList } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { getAttractionById } from '../api/attractionsApi';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../api/apiConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RFValue } from 'react-native-responsive-fontsize';
import { RootStackParamList } from '../navigation/AppNavigator';
import { addToFavorites, removeFromFavorites, checkIsFavorite } from '../api/favoritesApi';
import { useAuth } from '../context/AuthContext';
import { spacing, hasNotch } from '../utils/dimensions';
import MapView, { Marker } from 'react-native-maps';

// Define attraction data type with el nuevo campo allCategories
type AttractionType = {
  id: number;
  name: string;
  description: string;
  opening_time: string;
  closing_time: string;
  price: number | null;
  location: string;
  latitude?: number;
  longitude?: number;
  images: string;
  status: string;
  admin?: any;
  category?: any;
  city?: any;
  allCategories?: any[];
  attractionCategories?: any[];
};

const DetailsScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'Details'>>();
  const navigation = useNavigation<any>();
  const { itemId } = route.params || {};
  
  const [attraction, setAttraction] = useState<AttractionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [checkingFavorite, setCheckingFavorite] = useState<boolean>(true);
  const { isAuthenticated, user } = useAuth();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imagesList, setImagesList] = useState<string[]>([]);
  const carouselRef = useRef<FlatList>(null);
  const carouselTimer = useRef<NodeJS.Timeout | null>(null);
  const { width } = Dimensions.get('window');

  useEffect(() => {
    if (itemId) {
      fetchAttraction();
      checkFavoriteStatus();
    } else {
      setError('No se ha especificado una atracción');
      setLoading(false);
    }
  }, [itemId]);

  const fetchAttraction = async () => {
    try {
      setLoading(true);
      const response = await getAttractionById(String(itemId));
      console.log('Detalle de atracción recibido:', JSON.stringify(response, null, 2));
      
      if (response && response.data) {
        setAttraction(response.data);
        setError(null);
      } else {
        setError('No se pudo cargar la información de la atracción');
      }
    } catch (err) {
      console.error('Error fetching attraction:', err);
      setError('Error al cargar la atracción');
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    if (!isAuthenticated) {
      setCheckingFavorite(false);
      return;
    }
    
    try {
      setCheckingFavorite(true);
      const status = await checkIsFavorite(itemId);
      setIsFavorite(status);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    } finally {
      setCheckingFavorite(false);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Auth', { screen: 'Login' });
      return;
    }
    
    try {
      if (isFavorite) {
        await removeFromFavorites(itemId);
      } else {
        await addToFavorites(itemId);
      }
      
      // Actualizar el estado local
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Actualizar la función getImageUrl para manejar valores undefined
  const getImageUrl = (imagePath?: string): string => {
    if (!imagePath) {
      console.log('No hay imagen disponible');
      return 'https://via.placeholder.com/400x200?text=No+Image';
    }
    
    // If it's already a full URL
    if (imagePath.startsWith('http')) {
      console.log(`Imagen ya es URL completa: ${imagePath}`);
      return imagePath;
    }
    
    // Si la ruta ya comienza con 'uploads/', necesitamos añadir una barra
    const normalizedPath = imagePath.startsWith('uploads/') ? `/${imagePath}` : `/${imagePath}`;
    
    // Join the API base URL with the image path
    const fullUrl = `${API_URL}${normalizedPath}`;
    console.log(`Imagen en DetailsScreen cargada desde: ${fullUrl}`);
    return fullUrl;
  };

  // Procesar las imágenes de la atracción en un array
  useEffect(() => {
    if (attraction?.images) {
      let images: string[] = [];
      if (typeof attraction.images === 'string') {
        // Si las imágenes están separadas por comas
        if (attraction.images.includes(',')) {
          images = attraction.images.split(',').map(img => img.trim()).filter(img => img !== '');
        } else {
          images = [attraction.images];
        }
      } else if (Array.isArray(attraction.images)) {
        // Asegurarse de que cada elemento sea string y no esté vacío
        images = (attraction.images as string[]).filter((img): img is string => typeof img === 'string' && img !== '');
      }
      
      if (images.length === 0) {
        images = ['https://via.placeholder.com/400x200?text=No+Image'];
      }
      
      setImagesList(images);
    } else {
      setImagesList(['https://via.placeholder.com/400x200?text=No+Image']);
    }
  }, [attraction]);
  
  // Iniciar el temporizador para cambiar las imágenes automáticamente
  useEffect(() => {
    if (imagesList.length > 1) {
      startImageCarousel();
    }
    
    return () => {
      if (carouselTimer.current) {
        clearInterval(carouselTimer.current);
      }
    };
  }, [imagesList]);
  
  const startImageCarousel = () => {
    if (carouselTimer.current) {
      clearInterval(carouselTimer.current);
    }
    
    carouselTimer.current = setInterval(() => {
      if (imagesList.length > 1) {
        const nextIndex = (activeImageIndex + 1) % imagesList.length;
        setActiveImageIndex(nextIndex);
        carouselRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      }
    }, 3000);
  };
  
  const onScrollEnd = (e: any) => {
    const contentOffset = e.nativeEvent.contentOffset;
    const viewSize = e.nativeEvent.layoutMeasurement;
    const pageNum = Math.floor(contentOffset.x / viewSize.width);
    
    if (pageNum !== activeImageIndex) {
      setActiveImageIndex(pageNum);
      
      // Reiniciar el temporizador cuando el usuario cambia manualmente
      if (carouselTimer.current) {
        clearInterval(carouselTimer.current);
        startImageCarousel();
      }
    }
  };
  
  const renderCarouselItem = ({ item }: { item: string }) => {
    return (
      <Image 
        source={{ uri: getImageUrl(item) }} 
        style={{ width, height: 300 }}
        resizeMode="cover" 
      />
    );
  };

  const navigateToSectors = (attractionId: number) => {
    // Logs de depuración
    console.log('===== NAVEGACIÓN A SECTORES =====');
    console.log('Usuario actual:', user ? JSON.stringify(user, null, 2) : 'No autenticado');
    console.log('Es host?:', user?.isHost);
    console.log('ID del admin de la atracción:', attraction?.admin?.id);
    console.log('Coincide ID?:', user?.id === attraction?.admin?.id);
    console.log('Condición completa:', user && user.isHost && attraction?.admin?.id === user?.id);
    
    // Si el usuario es administrador de la atracción, abrir la pantalla de administración de sectores
    if (user && user.isHost && attraction?.admin?.id === user.id) {
      console.log('Navegando a SECTORS (pantalla de administración)');
      navigation.navigate('Sectors', { attractionId });
    } else {
      // Para usuarios normales, abrir la pantalla de compra
      console.log('Navegando a BUYSECTORS (pantalla de compra)');
      navigation.navigate('BuySectors', { attractionId });
    }
  };

  const handleShare = async () => {
    try {
      if (attraction) {
        await Share.share({
          message: `Echa un vistazo a ${attraction.name} en TurisClick! Es un lugar increíble para visitar en ${attraction.location}. ${attraction.description}`,
          title: `TurisClick - ${attraction.name}`,
        });
      }
    } catch (error) {
      console.error('Error sharing attraction:', error);
    }
  };

  if (loading) {
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
        <TouchableOpacity 
          style={styles.button} 
          onPress={fetchAttraction}
        >
          <Text style={styles.buttonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: 0 }]} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.imageContainer}>
          <FlatList
            ref={carouselRef}
            data={imagesList}
            renderItem={renderCarouselItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            keyExtractor={(item, index) => `image-${index}`}
          />
          
          {imagesList.length > 1 && (
            <View style={styles.paginationContainer}>
              {imagesList.map((_, index) => (
                <View 
                  key={`dot-${index}`} 
                  style={[
                    styles.paginationDot,
                    activeImageIndex === index ? styles.paginationDotActive : {}
                  ]} 
                />
              ))}
            </View>
          )}
          
          <View style={styles.headerButtonsContainer}>
            <TouchableOpacity 
              style={styles.circleButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={22} color="#222" />
            </TouchableOpacity>
            <View style={styles.rightButtons}>
              <TouchableOpacity 
                style={styles.circleButton}
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={22} color="#222" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.circleButton}
                onPress={toggleFavorite}
                disabled={checkingFavorite}
              >
                {checkingFavorite ? (
                  <ActivityIndicator size="small" color="#FF5A5F" />
                ) : (
                  <Ionicons 
                    name={isFavorite ? "heart" : "heart-outline"} 
                    size={22} 
                    color={isFavorite ? "#FF5A5F" : "#222"} 
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{attraction?.name}</Text>
          
          {/* Sección de descripción */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.description}>{attraction?.description}</Text>
          </View>
          
          {/* Línea divisoria */}
          <View style={styles.divider} />
          
          {/* Horario en formato horizontal */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={22} color="#FF5A5F" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Horario</Text>
                <Text style={styles.infoValue}>
                  {attraction?.opening_time} - {attraction?.closing_time}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Categorías debajo del horario */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="pricetags-outline" size={22} color="#FF5A5F" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Categorías</Text>
                <View style={styles.inlineCategories}>
                  {attraction?.category && (
                    <Text style={styles.categoryText}>{attraction.category.name}</Text>
                  )}
                  {attraction?.attractionCategories && attraction.attractionCategories.map((ac: any, index: number) => (
                    <Text key={ac.category.id} style={styles.categoryText}>
                      {index > 0 || attraction?.category ? ', ' : ''}{ac.category.name}
                    </Text>
                  ))}
                  {!attraction?.category && (!attraction?.attractionCategories || attraction.attractionCategories.length === 0) && (
                    <Text style={styles.infoValue}>No especificada</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Línea divisoria */}
          <View style={styles.divider} />

          {/* Sección de precio si existe */}
          {attraction?.price ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Precio</Text>
              <Text style={styles.description}>${attraction.price}</Text>
            </View>
          ) : null}

          {/* Ubicación en el mapa */}
          {attraction?.latitude && attraction?.longitude ? (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: attraction.latitude,
                  longitude: attraction.longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: attraction.latitude,
                    longitude: attraction.longitude,
                  }}
                  title={attraction.name}
                />
              </MapView>
              <Pressable 
                style={({ pressed }) => [
                  styles.mapDirectionsButton,
                  pressed && styles.mapDirectionsButtonPressed
                ]}
                onPress={() => {
                  if (attraction?.latitude && attraction?.longitude) {
                    const latitude = attraction.latitude;
                    const longitude = attraction.longitude;
                    
                    // URL para obtener indicaciones desde la ubicación actual
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
                    
                    Linking.canOpenURL(url)
                      .then(supported => {
                        if (supported) {
                          return Linking.openURL(url);
                        } else {
                          console.log('No se puede abrir la URL:', url);
                          Alert.alert('Error', 'No se pudo abrir Google Maps');
                        }
                      })
                      .catch(err => {
                        console.error('Error al abrir el mapa:', err);
                        Alert.alert('Error', 'No se pudo abrir Google Maps');
                      });
                  }
                }}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.3)', borderless: true }}
              >
                <View style={styles.mapDirectionsButtonContent}>
                  <View style={styles.mapDirectionsIconContainer}>
                    <Ionicons name="navigate" size={20} color="white" />
                  </View>
                  <Text style={styles.mapDirectionsButtonText}>Cómo llegar</Text>
                </View>
              </Pressable>
            </View>
          ) : attraction?.location ? (
            <View style={styles.mapContainer}>
              <Text style={[styles.location, {marginHorizontal: 24}]}>{attraction.location}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
      
      {attraction?.id && !attraction?.price && (
        <View style={styles.fixedButtonContainer}>
          <TouchableOpacity 
            style={styles.reserveButton}
            onPress={() => navigateToSectors(attraction.id)}
          >
            <Text style={styles.reserveButtonText}>Ver todos los sectores y precios</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  image: {
    width: '100%',
    height: 300,
  },
  headerButtonsContainer: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rightButtons: {
    flexDirection: 'row',
  },
  circleButton: {
    backgroundColor: 'white',
    borderRadius: 50,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoTextContainer: {
    marginLeft: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#777',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
  },
  inlineCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF5A5F',
  },
  reserveButton: {
    backgroundColor: '#FF5A5F',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  reserveButtonText: {
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
  map: {
    width: '100%',
    height: 300,
    borderRadius: 10,
  },
  mapContainer: {
    marginTop: 20,
    paddingHorizontal: 0,
    marginHorizontal: 0,
  },
  mapDirectionsButton: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: '#FF385C',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    minWidth: 130,
  },
  mapDirectionsButtonPressed: {
    backgroundColor: '#E0284E',
    transform: [{ scale: 0.97 }],
  },
  mapDirectionsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapDirectionsIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  mapDirectionsButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  paginationDotActive: {
    backgroundColor: 'white',
    width: 12,
    height: 8,
  },
});

export default DetailsScreen; 