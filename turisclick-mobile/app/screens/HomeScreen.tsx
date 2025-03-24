import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image, 
  RefreshControl,
  Dimensions,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getAttractions } from '../api/attractionsApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../api/apiConfig';
import { 
  SAFE_AREA_TOP, 
  spacing, 
  RFValue, 
  scale, 
  hasNotch 
} from '../utils/dimensions';
import { addToFavorites, removeFromFavorites, checkIsFavorite } from '../api/favoritesApi';
import { useAuth } from '../context/AuthContext';
import { getSectorsByAttraction, Sector } from '../api/sectorsApi';
// Get the server base URL from the API client
const API_BASE_URL = API_URL || 'http://192.168.0.14:3000';

// Define the navigation param list type
type RootStackParamList = {
  Home: undefined;
  Details: { itemId: number };
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

// Define attraction data type based on actual API response
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
};

type ApiResponse = {
  data: AttractionType[];
  message: string;
  status: string;
};

const { width } = Dimensions.get('window');
const cardWidth = (width - spacing.m * 3) / 2; // 2 columns with spacing in between

const HomeScreen = () => {
  const [attractions, setAttractions] = useState<AttractionType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Record<number, boolean>>({});
  const [attractionPrices, setAttractionPrices] = useState<Record<number, {min: number, max: number}>>({});
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchAttractions();
  }, []);

  const fetchAttractions = async () => {
    try {
      setLoading(true);
      const response = await getAttractions();
      console.log('Attractions data:', response);
      
      // Check if the response has the expected structure
      if (response && response.status === 'success' && Array.isArray(response.data)) {
        setAttractions(response.data);
        setError(null);
        
        // Verificar estado de favoritos para cada atracción
        if (isAuthenticated) {
          checkFavoritesStatus(response.data);
        }
        
        // Cargar precios de sectores para cada atracción
        loadSectorPrices(response.data);
      } else {
        console.log('Invalid response format:', response);
        setError('Invalid response format from API');
      }
    } catch (err) {
      console.error('Error fetching attractions:', err);
      setError('Error fetching attractions data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const checkFavoritesStatus = async (attractionsList: AttractionType[]) => {
    try {
      const favoritesStatus: Record<number, boolean> = {};
      
      // Verificar cada atracción individualmente
      for (const attraction of attractionsList) {
        if (attraction.id) {
          const isFavorite = await checkIsFavorite(attraction.id);
          favoritesStatus[attraction.id] = isFavorite;
        }
      }
      
      setFavorites(favoritesStatus);
    } catch (error) {
      console.error('Error checking favorites status:', error);
    }
  };

  const toggleFavorite = async (attractionId: number) => {
    if (!isAuthenticated) {
      navigation.navigate('Main' as any, { screen: 'Auth', params: { screen: 'Login' } });
      return;
    }
    
    try {
      const isFavorite = favorites[attractionId];
      
      if (isFavorite) {
        await removeFromFavorites(attractionId);
      } else {
        await addToFavorites(attractionId);
      }
      
      // Actualizar el estado local
      setFavorites(prev => ({
        ...prev,
        [attractionId]: !isFavorite
      }));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setError(null);
    fetchAttractions();
  };

  // Función para cargar los precios de los sectores de cada atracción
  const loadSectorPrices = async (attractionsList: AttractionType[]) => {
    try {
      const pricesData: Record<number, {min: number, max: number}> = {};
      
      // Para cada atracción, obtener sus sectores
      for (const attraction of attractionsList) {
        if (attraction.id) {
          const sectors = await getSectorsByAttraction(attraction.id);
          
          if (sectors && sectors.length > 0) {
            // Encontrar precio mínimo y máximo
            const prices = sectors.map(sector => sector.price);
            pricesData[attraction.id] = {
              min: Math.min(...prices),
              max: Math.max(...prices)
            };
          }
        }
      }
      
      setAttractionPrices(pricesData);
    } catch (error) {
      console.error('Error cargando precios de sectores:', error);
    }
  };

  const renderItem = ({ item }: { item: AttractionType }) => {
    // Function to format the image URL correctly
    const getImageUrl = (imagePath: string) => {
      if (!imagePath) return 'https://via.placeholder.com/400x200?text=No+Image';
      
      // If it's already a full URL
      if (imagePath.startsWith('http')) return imagePath;
      
      // If it's multiple images separated by commas, get the first one
      const firstImage = Array.isArray(imagePath) 
        ? imagePath[0] 
        : (imagePath.includes(',') ? imagePath.split(',')[0].trim() : imagePath);
      
      // Si la ruta ya comienza con 'uploads/', necesitamos añadir una barra
      const normalizedPath = firstImage.startsWith('uploads/') ? `/${firstImage}` : `/${firstImage}`;
      
      // Join the API base URL with the image path and log it for debugging
      const fullUrl = `${API_URL}${normalizedPath}`;
      console.log(`Imagen en HomeScreen cargada desde: ${fullUrl}`);
      return fullUrl;
    };

    const isFavorite = item.id ? favorites[item.id] : false;
    
    // Obtener rango de precios para esta atracción
    const priceRange = item.id ? attractionPrices[item.id] : null;

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => {
          if (item.id) {
            navigation.navigate('Details', { itemId: item.id });
          }
        }}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={{ 
              uri: getImageUrl(item.images)
            }} 
            style={styles.image} 
            resizeMode="cover" 
          />
          <TouchableOpacity 
            style={[
              styles.favoriteButton,
              isFavorite ? styles.favoritedButton : {}
            ]}
            onPress={() => item.id && toggleFavorite(item.id)}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? "#FF5A5F" : "white"} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.location} numberOfLines={1}>{item.location}</Text>
          <Text style={styles.hours}>{item.opening_time} - {item.closing_time}</Text>
          <Text style={styles.price}>
            {priceRange 
              ? priceRange.min === priceRange.max 
                ? `${priceRange.min} bs` 
                : `${priceRange.min} bs - ${priceRange.max} bs`
              : 'Precios no disponibles'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
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
          <TouchableOpacity style={styles.button} onPress={fetchAttractions}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={attractions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Discover the best attractions</Text>
            <Text style={styles.headerSubtitle}>Book tickets, explore local spots & more</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No attractions found</Text>
            <Text style={styles.emptyStateSubText}>Try refreshing the page</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF5A5F']}
            tintColor="#FF5A5F"
          />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.logo}>TurisClick</Text>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        {renderContent()}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logo: {
    fontSize: RFValue(22),
    fontWeight: 'bold',
    color: '#FF5A5F',
  },
  searchButton: {
    padding: spacing.xs,
  },
  headerContainer: {
    paddingHorizontal: spacing.m,
    paddingTop: spacing.m,
    paddingBottom: spacing.l,
  },
  headerTitle: {
    fontSize: RFValue(22),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: spacing.xs/2,
  },
  headerSubtitle: {
    fontSize: RFValue(14),
    color: '#666',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.m,
  },
  listContainer: {
    paddingBottom: hasNotch ? spacing.xl : spacing.m,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.m,
  },
  card: {
    width: cardWidth,
    marginBottom: spacing.m,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: cardWidth,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 50,
    padding: spacing.xs,
  },
  cardContent: {
    padding: spacing.s,
  },
  title: {
    fontSize: RFValue(14),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: spacing.xs/2,
  },
  location: {
    fontSize: RFValue(12),
    color: '#666',
    marginBottom: spacing.xs/2,
  },
  hours: {
    fontSize: RFValue(12),
    color: '#666',
    marginBottom: spacing.xs/2,
  },
  price: {
    fontSize: RFValue(14),
    fontWeight: 'bold',
    color: '#FF5A5F',
  },
  errorText: {
    color: '#FF5A5F',
    fontSize: RFValue(16),
    marginVertical: spacing.m,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: RFValue(16),
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
    paddingHorizontal: spacing.l,
  },
  emptyStateText: {
    fontSize: RFValue(18),
    fontWeight: 'bold',
    color: '#333',
    marginTop: spacing.m,
    marginBottom: spacing.xs/2,
  },
  emptyStateSubText: {
    fontSize: RFValue(14),
    color: '#666',
    textAlign: 'center',
  },
  favoritedButton: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
});

export default HomeScreen; 