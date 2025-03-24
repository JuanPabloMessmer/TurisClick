import React, { useEffect } from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, View, StyleSheet, Platform, Text, Linking, Alert } from 'react-native';

// Screen imports
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DetailsScreen from '../screens/DetailsScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import CreateAttractionScreen from '../screens/CreateAttractionScreen';
import SectorsScreen from '../screens/SectorsScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import AdminScreen from '../screens/AdminScreen';
import BuySectorsScreen from '../screens/BuySectorsScreen';
import TripsScreen from '../screens/TripsScreen';

// Auth context
import { useAuth } from '../context/AuthContext';

// Define types for our navigation
export type RootStackParamList = {
  Main: { screen?: string } | undefined;
  Auth: undefined;
  Details: { itemId: number };
  CreateAttraction: undefined;
  Sectors: { attractionId: number };
  BuySectors: { attractionId: number };
  Favorites: undefined;
  Admin: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type TabParamList = {
  Explore: undefined;
  Favorites: undefined;
  Trips: undefined;
  Profile: undefined;
  Admin: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Authentication navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
};

// Placeholder para pantallas que aún no existen
const PlaceholderScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>En desarrollo</Text>
    <Text style={styles.placeholderSubText}>Esta sección estará disponible pronto</Text>
  </View>
);

// Bottom tab navigator
const TabNavigator = () => {
  const { user } = useAuth();
  
  // Debug para ver la información completa del usuario
  console.log('INFO USUARIO COMPLETO EN NAVIGATOR:', JSON.stringify(user, null, 2));
  
  // Verificación estricta del estado de host
  const isHost = user?.isHost === true;
  console.log('¿ES HOST?:', isHost, 'Tipo:', typeof user?.isHost, 'Valor exacto de isHost:', user?.isHost);
  
  // Definir las tabs disponibles
  const getTabs = () => {
    const tabs = [
      {
        name: "Explore",
        component: HomeScreen,
        title: "Explorar",
        icon: (focused: boolean) => focused ? 'search' : 'search-outline'
      },
      {
        name: "Favorites",
        component: FavoritesScreen,
        title: "Favoritos",
        icon: (focused: boolean) => focused ? 'heart' : 'heart-outline'
      },
      {
        name: "Trips",
        component: TripsScreen,
        title: "Tickets",
        icon: (focused: boolean) => focused ? 'calendar' : 'calendar-outline'
      },
      
      {
        name: "Profile",
        component: ProfileScreen,
        title: "Perfil",
        icon: (focused: boolean) => focused ? 'person' : 'person-outline'
      }
    ];
    
    // Añadir la pestaña Admin solo si el usuario es host
    if (isHost) {
      tabs.push({
        name: "Admin",
        component: AdminScreen,
        title: "Admin",
        icon: (focused: boolean) => focused ? 'business' : 'business-outline'
      });
    }
    
    return tabs;
  };
  
  const tabs = getTabs();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const currentTab = tabs.find(tab => tab.name === route.name);
          let iconName = currentTab?.icon(focused);
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF5A5F',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        headerShown: false,
      })}
    >
      {tabs.map(tab => (
        <Tab.Screen 
          key={tab.name}
          name={tab.name} 
          component={tab.component} 
          options={{ title: tab.title }}
        />
      ))}
    </Tab.Navigator>
  );
};

// Main navigator
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Configure deep linking
  const linking: LinkingOptions<RootStackParamList> = {
    prefixes: ['turisclick://', 'https://turisclick.com'],
    config: {
      screens: {
        Main: {
          screens: {
            Trips: 'trips',
          },
        },
        BuySectors: 'buy/:attractionId',
      },
    },
    async getInitialURL() {
      // First, you might want to handle any initial URL that launched the app
      const url = await Linking.getInitialURL();
      if (url != null) {
        // Check if it's a payment completion URL
        if (url.includes('payment/complete')) {
          // Extract transaction ID from the URL
          const match = url.match(/id=([^&]+)/);
          const transactionId = match ? match[1] : null;
          
          if (transactionId) {
            // Show confirmation to user
            setTimeout(() => {
              Alert.alert(
                '¡Pago Completado!',
                'Tu pago ha sido procesado. Puedes ver tus tickets en la sección de Viajes.',
                [{ text: 'OK' }]
              );
            }, 1000);
            
            // Return a URL that will navigate to the Trips screen
            return 'turisclick://trips';
          }
        }
        return url;
      }
      return null;
    },
    subscribe(listener) {
      // Listen to incoming links from deep linking
      const subscription = Linking.addEventListener('url', ({ url }) => {
        // Check if it's a payment completion URL
        if (url.includes('payment/complete')) {
          // Extract transaction ID from the URL
          const match = url.match(/id=([^&]+)/);
          const transactionId = match ? match[1] : null;
          
          if (transactionId) {
            // Show confirmation to user
            Alert.alert(
              '¡Pago Completado!',
              'Tu pago ha sido procesado. Puedes ver tus tickets en la sección de Viajes.',
              [{ text: 'OK' }]
            );
            
            // Navigate to the Trips screen
            listener('turisclick://trips');
            return;
          }
        }
        listener(url);
      });
      
      return () => {
        subscription.remove();
      };
    },
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF5A5F" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen 
              name="Details" 
              component={DetailsScreen}
              options={{
                headerShown: false,
                title: 'Detalles',
              }}
            />
            <Stack.Screen 
              name="CreateAttraction" 
              component={CreateAttractionScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="Sectors" 
              component={SectorsScreen}
              options={{
                headerShown: false,
                title: 'Sectores y Precios',
              }}
            />
            <Stack.Screen 
              name="BuySectors" 
              component={BuySectorsScreen}
              options={{
                headerShown: false,
                title: 'Comprar Entradas',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  placeholderSubText: {
    fontSize: 14,
    color: '#666',
  },
  tabBar: {
    height: Platform.OS === 'ios' ? 90 : 70,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    paddingTop: 10,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AppNavigator; 