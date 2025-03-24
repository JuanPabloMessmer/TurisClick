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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RFValue } from 'react-native-responsive-fontsize';
import { getFavorites, removeFromFavorites } from '../api/favoritesApi';
import { API_URL } from '../api/apiConfig';
import { AttractionType } from '../api/attractionsApi';
import { useAuth } from '../context/AuthContext';
import { spacing, hasNotch } from '../utils/dimensions';

const screenWidth = Dimensions.get('window').width;
const cardWidth = (screenWidth - spacing.m * 3) / 2;

type FavoritesScreenNavigationProp = any;

const FavoritesScreen = () => {
  const [favorites, setFavorites] = useState<AttractionType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<FavoritesScreenNavigationProp>();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    } else {
      setLoading(false);
      setError('Inicia sesión para ver tus favoritos');
    }
  }, [isAuthenticated]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await getFavorites();
      console.log('Favorites response:', response);
      
      if (response && Array.isArray(response)) {
        // Mapear directamente las atracciones desde la respuesta de la API
        const attractionsFromFavorites = response.map(fav => fav.attraction);
        setFavorites(attractionsFromFavorites);
        setError(null);
      } else {
        console.log('Invalid response format:', response);
        setError('Formato de respuesta inválido desde la API');
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Error al cargar tus favoritos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setError(null);
    fetchFavorites();
  };

  const handleRemoveFavorite = async (attractionId: number) => {
    try {
      await removeFromFavorites(attractionId);
      // Actualizar la lista de favoritos eliminando la atracción
      setFavorites(prev => prev.filter(attr => attr.id !== attractionId));
    } catch (error) {
      console.error('Error removing favorite:', error);
      // Opcionalmente mostrar algún mensaje de error al usuario
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
      return fullUrl;
    };

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
            style={styles.favoriteButton}
            onPress={() => handleRemoveFavorite(item.id)}
          >
            <Ionicons name="heart" size={24} color="#FF5A5F" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.location} numberOfLines={1}>{item.location}</Text>
          <Text style={styles.hours}>{item.opening_time} - {item.closing_time}</Text>
          <Text style={styles.price}>
            {item.price ? `$${item.price}` : 'Ver sectores y precios'}
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
          {isAuthenticated && (
            <TouchableOpacity style={styles.button} onPress={fetchFavorites}>
              <Text style={styles.buttonText}>Reintentar</Text>
            </TouchableOpacity>
          )}
          {!isAuthenticated && (
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => navigation.navigate('Main' as any, { screen: 'Auth', params: { screen: 'Login' } })}
            >
              <Text style={styles.buttonText}>Iniciar sesión</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Tus favoritos</Text>
            <Text style={styles.headerSubtitle}>Atracciones que has guardado</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No tienes favoritos aún</Text>
            <Text style={styles.emptyStateSubText}>Guarda atracciones favoritas para verlas aquí</Text>
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
          <Text style={styles.logo}>Favoritos</Text>
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
    fontSize: RFValue(20),
    fontWeight: 'bold',
    color: '#FF5A5F',
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
  errorText: {
    fontSize: RFValue(16),
    color: '#666',
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  button: {
    backgroundColor: '#FF5A5F',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: RFValue(14),
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
    backgroundColor: 'rgba(255,255,255,0.8)',
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
    marginBottom: 2,
  },
  location: {
    fontSize: RFValue(12),
    color: '#666',
    marginBottom: 2,
  },
  hours: {
    fontSize: RFValue(11),
    color: '#888',
    marginBottom: 2,
  },
  price: {
    fontSize: RFValue(12),
    fontWeight: 'bold',
    color: '#FF5A5F',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    padding: spacing.m,
  },
  emptyStateText: {
    fontSize: RFValue(16),
    fontWeight: 'bold',
    color: '#333',
    marginTop: spacing.s,
  },
  emptyStateSubText: {
    fontSize: RFValue(14),
    color: '#666',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

export default FavoritesScreen; 