// Polyfill para crypto.getRandomValues
import 'react-native-get-random-values';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Linking,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import { getCategories, Category } from '../api/categoriesApi';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  GooglePlacesAutocomplete,
  GooglePlaceData,
  GooglePlaceDetail,
} from 'react-native-google-places-autocomplete';
import { createAttraction, uploadImages, CreateAttractionData } from '../api/attractionsApi';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { getCitiesByDepartment } from '../api/citiesApi';
import { getDepartments } from '../api/departmentsApi';
import { updateHostStatus } from '../api/usersApi';

type CreateAttractionScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type AttractionFormData = {
  title: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string;
  categoryIds: number[];
  images: { uri: string; name: string; type: string }[]; // Guardamos objetos de imagen
  openingTime: string;
  closingTime: string;
  departmentId: number | null;
  cityId: number | null;
};

const initialFormData: AttractionFormData = {
  title: '',
  description: '',
  location: '',
  latitude: null,
  longitude: null,
  googleMapsUrl: '',
  categoryIds: [],
  images: [],
  openingTime: '',
  closingTime: '',
  departmentId: null,
  cityId: null,
};

const GOOGLE_PLACES_API_KEY =
    Constants.expoConfig?.extra?.googlePlacesApiKey || '';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375 || height < 667;

type FormErrors = {
  title?: string;
  description?: string;
  location?: string;
  googleMapsUrl?: string;
  categoryIds?: string;
  images?: string;
  openingTime?: string;
  closingTime?: string;
  departmentId?: string;
  cityId?: string;
  categories?: string;
};

// Helper function to handle category selection - defined outside the main component
const handleCategorySelection = (
  categoryId: number, 
  selectedCategories: number[], 
  setSelectedCategories: React.Dispatch<React.SetStateAction<number[]>>
) => {
  setSelectedCategories(prev => {
    if (prev.includes(categoryId)) {
      return prev.filter(id => id !== categoryId);
    } else {
      return [...prev, categoryId];
    }
  });
};

const CreateAttractionScreen = () => {
  const navigation = useNavigation<CreateAttractionScreenNavigationProp>();
  const { user, updateProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AttractionFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [showOpeningTimePicker, setShowOpeningTimePicker] = useState(false);
  const [showClosingTimePicker, setShowClosingTimePicker] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  const totalSteps = 4;

  const fetchCitiesByDepartment = async (departmentId: number) => {
    try {
      setLoadingCities(true);
      const fetchedCities = await getCitiesByDepartment(departmentId);
      setCities(fetchedCities || []);
    } catch (error) {
      console.error('Error fetching cities:', error);
      Alert.alert(
        'Error',
        'No se pudieron cargar las ciudades. Comprueba tu conexión a internet.'
      );
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const fetchedCategories = await getCategories(true);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        Alert.alert(
            'Error',
            'No se pudieron cargar las categorías. Comprueba tu conexión a internet.'
        );
      } finally {
        setLoadingCategories(false);
      }
    };

    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);
        // Obtener departamentos desde la API
        const fetchedDepartments = await getDepartments();
        
        if (fetchedDepartments && fetchedDepartments.length > 0) {
          setDepartments(fetchedDepartments);
        } else {
          // Fallback a datos estáticos si la API falla
          setDepartments([
            { id: 1, name: 'La Paz' },
            { id: 2, name: 'Cochabamba' },
            { id: 3, name: 'Santa Cruz' },
            { id: 4, name: 'Oruro' },
            { id: 5, name: 'Potosí' },
            { id: 6, name: 'Chuquisaca' },
            { id: 7, name: 'Tarija' },
            { id: 8, name: 'Beni' },
            { id: 9, name: 'Pando' }
          ]);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        // Fallback a datos estáticos si ocurre un error
        setDepartments([
          { id: 1, name: 'La Paz' },
          { id: 2, name: 'Cochabamba' },
          { id: 3, name: 'Santa Cruz' },
          { id: 4, name: 'Oruro' },
          { id: 5, name: 'Potosí' },
          { id: 6, name: 'Chuquisaca' },
          { id: 7, name: 'Tarija' },
          { id: 8, name: 'Beni' },
          { id: 9, name: 'Pando' }
        ]);
        Alert.alert(
          'Error',
          'No se pudieron cargar los departamentos desde el servidor. Se han cargado datos locales.'
        );
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchCategories();
    fetchDepartments();
    requestLocationPermission();
  }, []);

  useEffect(() => {
    // Mantener formData.categoryIds sincronizado con selectedCategories
    updateFormField('categoryIds', selectedCategories);
  }, [selectedCategories]);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setLocationPermissionGranted(true);
      try {
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        setMapRegion({
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } catch (error) {
        console.error('Error getting current location:', error);
      }
    } else {
      Alert.alert(
          'Permiso de ubicación',
          'No se concedió el permiso para acceder a tu ubicación. Algunas funciones estarán limitadas.'
      );
    }
  };

  const updateFormField = (field: keyof AttractionFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field in errors) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateField = (field: keyof AttractionFormData) => {
    const newErrors: FormErrors = { ...errors };
    if (field === 'title') {
      if (!formData.title.trim()) {
        newErrors.title = 'El título es requerido';
      } else {
        delete newErrors.title;
      }
    } else if (field === 'description') {
      if (!formData.description.trim()) {
        newErrors.description = 'La descripción es requerida';
      } else {
        delete newErrors.description;
      }
    } else if (field === 'location') {
      if (!formData.location.trim()) {
        newErrors.location = 'La ubicación es requerida';
      } else {
        delete newErrors.location;
      }
    } else if (field === 'googleMapsUrl') {
      if (!formData.googleMapsUrl.trim()) {
        newErrors.googleMapsUrl = 'La URL de Google Maps es requerida';
      } else {
        delete newErrors.googleMapsUrl;
      }
    } else if (field === 'openingTime') {
      if (!formData.openingTime.trim()) {
        newErrors.openingTime = 'La hora de apertura es requerida';
      } else {
        delete newErrors.openingTime;
      }
    } else if (field === 'closingTime') {
      if (!formData.closingTime.trim()) {
        newErrors.closingTime = 'La hora de cierre es requerida';
      } else {
        delete newErrors.closingTime;
      }
    } else if (field === 'departmentId') {
      if (!formData.departmentId) {
        newErrors.departmentId = 'El departamento es requerido';
      } else {
        delete newErrors.departmentId;
      }
    } else if (field === 'cityId') {
      if (!formData.cityId) {
        newErrors.cityId = 'La ciudad es requerida';
      } else {
        delete newErrors.cityId;
      }
    }
    setErrors(newErrors);
  };

  const validate = () => {
    const newErrors: FormErrors = {};
    let isValid = true;
    if (currentStep === 1) {
      if (!formData.title.trim()) {
        newErrors.title = 'El título es requerido';
        isValid = false;
      }
      if (!formData.description.trim()) {
        newErrors.description = 'La descripción es requerida';
        isValid = false;
      }
    } else if (currentStep === 2) {
      if (selectedCategories.length === 0) {
        newErrors.categories = 'Selecciona al menos una categoría';
        isValid = false;
      }
      if (!formData.location.trim()) {
        newErrors.location = 'La ubicación es requerida';
        isValid = false;
      }
      if (!formData.googleMapsUrl.trim()) {
        newErrors.googleMapsUrl = 'La URL de Google Maps es requerida';
        isValid = false;
      }
    } else if (currentStep === 3) {
      if (!formData.departmentId) {
        newErrors.departmentId = 'El departamento es requerido';
        isValid = false;
      }
      if (!formData.cityId) {
        newErrors.cityId = 'La ciudad es requerida';
        isValid = false;
      }
    } else if (currentStep === 4) {
      if (!formData.openingTime.trim()) {
        newErrors.openingTime = 'La hora de apertura es requerida';
        isValid = false;
      }
      if (!formData.closingTime.trim()) {
        newErrors.closingTime = 'La hora de cierre es requerida';
        isValid = false;
      }
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleNextStep = () => {
    if (!validate()) return;
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para subir imágenes');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        if (!uri) {
          Alert.alert('Error', 'No se pudo obtener la URI de la imagen');
          return;
        }
        const fileName = uri.split('/').pop() || `image-${Date.now()}.jpg`;
        const fileObj = { uri, name: fileName, type: 'image/jpeg' };
        console.log('Archivo seleccionado:', fileObj);
        updateFormField('images', [...formData.images, fileObj]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo acceder a la galería de imágenes');
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    updateFormField('images', newImages);
  };

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    updateCoordinates(
        coordinate.latitude,
        coordinate.longitude,
        `Ubicación: ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`
    );
    if (formData.googleMapsUrl) {
      updateFormField('googleMapsUrl', '');
    }
  };

  // Actualiza coordenadas y región del mapa
  const updateCoordinates = (
      latitude: number,
      longitude: number,
      locationStr: string
  ) => {
    updateFormField('latitude', latitude);
    updateFormField('longitude', longitude);
    updateFormField('location', locationStr);
    setMapRegion({
      latitude,
      longitude,
      // Ajusta estos valores para controlar el nivel de zoom
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  // Fallback si no se pueden extraer coordenadas
  const fallbackCoordinates = (url: string) => {
    updateCoordinates(4.710989, -74.07209, 'Ubicación aproximada (fallback)');
    Alert.alert(
        'Ubicación no detectada',
        'No se pudieron extraer las coordenadas exactas. Se usará una ubicación aproximada.'
    );
  };

  // Extrae coordenadas de la URL de Google Maps; permite tanto URLs completas como cortas
  const extractCoordsFromUrl = async (url: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('Procesando URL:', url);
      const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const placeRegex = /place\/[^\/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const mapsRegex = /google\.com\/maps\?q=(-?\d+\.\d+),(-?\d+\.\d+)/;
      const shortUrlRegex = /(maps\.app\.goo\.gl|goo\.gl)/;
      // Intentar extraer directamente
      let match = url.match(regex) || url.match(placeRegex) || url.match(mapsRegex);
      if (match && match.length >= 3) {
        const latitude = parseFloat(match[1]);
        const longitude = parseFloat(match[2]);
        if (!isNaN(latitude) && !isNaN(longitude)) {
          console.log('Coordenadas encontradas directamente:', latitude, longitude);
          updateCoordinates(
              latitude,
              longitude,
              `Ubicación desde Maps: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          );
          setIsLoading(false);
          return true;
        }
      }
      if (shortUrlRegex.test(url)) {
        console.log('URL corta detectada, intentando expandir...');
        try {
          const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
          const expandedUrl = response.url;
          console.log('URL expandida:', expandedUrl);
          let expandedMatch =
              expandedUrl.match(regex) ||
              expandedUrl.match(placeRegex) ||
              expandedUrl.match(mapsRegex);
          if (expandedMatch && expandedMatch.length >= 3) {
            const latitude = parseFloat(expandedMatch[1]);
            const longitude = parseFloat(expandedMatch[2]);
            if (!isNaN(latitude) && !isNaN(longitude)) {
              console.log('Coordenadas encontradas en URL expandida:', latitude, longitude);
              updateCoordinates(
                  latitude,
                  longitude,
                  `Ubicación desde Maps: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
              );
              setIsLoading(false);
              return true;
            }
          }
          console.warn('No se extrajeron coordenadas de la URL expandida.');
          fallbackCoordinates(url);
          setIsLoading(false);
          return false;
        } catch (error) {
          console.error('Error al expandir URL corta:', error);
          fallbackCoordinates(url);
          setIsLoading(false);
          return false;
        }
      }
      console.log('No se pudieron extraer coordenadas de:', url);
      fallbackCoordinates(url);
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Error extracting coordinates from URL:', error);
      setIsLoading(false);
      return false;
    }
  };

  const handleGoogleMapsUrl = (url: string) => {
    updateFormField('googleMapsUrl', url);
  };

  const openGoogleMaps = async () => {
    const url = 'https://www.google.com/maps';
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'No se puede abrir Google Maps');
    }
  };

  const handleConfirmTimePicker = (date: Date, field: 'openingTime' | 'closingTime') => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    updateFormField(field, `${hours}:${minutes}`);
    if (field === 'openingTime') {
      setShowOpeningTimePicker(false);
    } else {
      setShowClosingTimePicker(false);
    }
  };

  const handleCancelTimePicker = (field: 'openingTime' | 'closingTime') => {
    if (field === 'openingTime') {
      setShowOpeningTimePicker(false);
    } else {
      setShowClosingTimePicker(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      // Validar que al menos una categoría esté seleccionada
      if (selectedCategories.length === 0) {
        setErrors(prev => ({ ...prev, categories: 'Debe seleccionar al menos una categoría' }));
        setIsLoading(false);
        return;
      }
      
      // Crea el objeto con los datos de la atracción
      const attractionData: CreateAttractionData = {
        name: formData.title,
        description: formData.description,
        opening_time: formData.openingTime,
        closing_time: formData.closingTime,
        location: formData.location,
        latitude: parseFloat(formData.latitude?.toString() || '0'),
        longitude: parseFloat(formData.longitude?.toString() || '0'),
        googleMapsUrl: formData.googleMapsUrl,
        cityId: formData.cityId || 1,
        categoryIds: selectedCategories,
        adminId: user?.id || 1,
        // Las imágenes se manejarán por separado después de crear la atracción
      };
      
      console.log('Enviando categorías:', selectedCategories);
      
      let attractionCreated = false;
      let attractionId: number | null = null;
      
      try {
        // Creamos la atracción usando la función API que ya hace el mapeo correcto
        const newAttraction = await createAttraction(attractionData);
        console.log('Atracción creada:', newAttraction);
        attractionCreated = true;
        attractionId = newAttraction?.data?.id || null;
        
        // Si hay imágenes para subir y la atracción se creó correctamente
        if (formData.images && formData.images.length > 0 && attractionId) {
          try {
            console.log('Preparando para subir imágenes...');
            const formDataImg = new FormData();
            
            // Añadir cada imagen al FormData
            formData.images.forEach((image, index) => {
              console.log(`Añadiendo imagen ${index + 1}:`, image);
              formDataImg.append('images', {
                uri: image.uri,
                name: image.name || `image-${index}.jpg`,
                type: image.type || 'image/jpeg',
              } as any);
            });
            
            // Subir las imágenes
            console.log('Subiendo imágenes para atracción ID:', attractionId);
            const uploadResponse = await uploadImages(attractionId, formDataImg);
            console.log('Respuesta de subida de imágenes:', uploadResponse);
          } catch (uploadError) {
            console.error('Error al subir imágenes:', uploadError);
            // No mostrar error crítico, ya que la atracción ya se creó
            Alert.alert(
              'Advertencia', 
              'La atracción se creó correctamente, pero hubo un problema al subir las imágenes.'
            );
          }
        }
      } catch (attractionError) {
        console.error('Error al crear la atracción:', attractionError);
        attractionCreated = false;
        Alert.alert('Error', 'No se pudo crear la atracción. Por favor, intenta nuevamente.');
        setIsLoading(false);
        return;
      }
      
      // Solo intentar actualizar estado de host si la atracción se creó correctamente
      let hostUpdateSuccess = false;
      if (attractionCreated) {
        try {
          const hostResponse = await updateHostStatus();
          console.log('Respuesta de actualización a host:', hostResponse);
          hostUpdateSuccess = hostResponse?.status === 'success';
          
          // Si la actualización de host fue exitosa, actualizar el contexto del usuario
          if (hostUpdateSuccess && user) {
            console.log('Actualizando contexto de usuario con isHost=true');
            // Actualizar el contexto de usuario para reflejar el cambio inmediatamente
            updateProfile({ ...user, isHost: true });
          }
        } catch (hostError) {
          console.error('Error al actualizar estado de host:', hostError);
          hostUpdateSuccess = false;
        }
      }
      
      setIsLoading(false);
      
      // Mensaje de éxito basado en los resultados
      if (attractionCreated) {
        if (hostUpdateSuccess) {
          Alert.alert(
            '¡Atracción creada!', 
            'Tu atracción ha sido creada exitosamente y ahora eres un host.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          Alert.alert(
            '¡Atracción creada!', 
            'Tu atracción ha sido creada exitosamente, pero hubo un problema al actualizar tu estado de host. Intenta actualizar la aplicación o contacta a soporte.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      }
    } catch (error: any) {
      console.error('Error general en handleSubmit:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Ocurrió un error inesperado. Por favor, intenta nuevamente.');
    }
  };

  const renderStepIndicator = () => {
    return (
        <View style={styles.stepIndicator}>
          {Array.from({ length: totalSteps }).map((_, index) => (
              <View
                  key={index}
                  style={[
                    styles.stepDot,
                    { backgroundColor: index < currentStep ? '#FF385C' : '#D3D3D3' },
                  ]}
              />
          ))}
        </View>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Título</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ingresa el título de la atracción"
                    value={formData.title}
                    onChangeText={(text) => updateFormField('title', text)}
                    onBlur={() => validateField('title')}
                />
                {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Ingresa la descripción de la atracción"
                    value={formData.description}
                    onChangeText={(text) => updateFormField('description', text)}
                    multiline
                    numberOfLines={4}
                    onBlur={() => validateField('description')}
                />
                {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
              </View>
            </>
        );
      case 2:
        return (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Categorías</Text>
                {loadingCategories ? (
                    <ActivityIndicator size="small" color="#2196F3" />
                ) : (
                    <View style={styles.categoriesContainer}>
                      {categories.map(category => renderCategoryItem({ item: category }))}
                    </View>
                )}
                {errors.categories ? <Text style={styles.errorText}>{errors.categories}</Text> : (errors.categoryIds ? <Text style={styles.errorText}>{errors.categoryIds}</Text> : null)}
              </View>
              <View style={styles.separator} />
              <View style={styles.inputContainer}>
                <Text style={styles.label}>URL de Google Maps</Text>
                <View style={styles.urlInputContainer}>
                  <TextInput
                      style={[styles.input, styles.urlInput]}
                      placeholder="Ingresa la URL de Google Maps"
                      value={formData.googleMapsUrl}
                      onChangeText={(text) => updateFormField('googleMapsUrl', text)}
                      onBlur={async () => {
                        validateField('googleMapsUrl');
                        if (formData.googleMapsUrl) {
                          const success = await extractCoordsFromUrl(formData.googleMapsUrl);
                          if (!success && formData.googleMapsUrl.trim().length > 0) {
                            setErrors((prev) => ({
                              ...prev,
                              googleMapsUrl: 'No se pudieron extraer las coordenadas de la URL',
                            }));
                          } else {
                            setErrors((prev) => ({
                              ...prev,
                              googleMapsUrl: '',
                            }));
                          }
                        }
                      }}
                  />
                  <TouchableOpacity style={styles.openMapsButton} onPress={openGoogleMaps}>
                    <Ionicons name="open-outline" size={24} color="#2196F3" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.helperText}>
                  Comparte la URL de Google Maps para mostrar automáticamente la ubicación
                </Text>
                {errors.googleMapsUrl ? <Text style={styles.errorText}>{errors.googleMapsUrl}</Text> : null}
              </View>
              {(formData.latitude !== null &&
                  formData.longitude !== null &&
                  formData.latitude !== 0 &&
                  formData.longitude !== 0) ? (
                  <>
                    <Text style={styles.mapInstructions}>Vista previa de la ubicación</Text>
                    <View style={styles.mapContainer}>
                      <MapView
                          style={styles.map}
                          region={mapRegion}
                          scrollEnabled={true}
                          zoomEnabled={true}
                          pitchEnabled={false}
                          rotateEnabled={false}
                          onPress={handleMapPress}
                      >
                        <Marker
                            coordinate={{
                              latitude: formData.latitude,
                              longitude: formData.longitude,
                            }}
                            title={formData.title || 'Ubicación seleccionada'}
                        />
                      </MapView>
                    </View>
                    <View style={styles.selectedLocationContainer}>
                      <Text style={styles.selectedLocationText}>{formData.location}</Text>
                    </View>
                  </>
              ) : formData.googleMapsUrl && !errors.googleMapsUrl ? (
                  <View style={styles.processingContainer}>
                    <Text style={styles.processingText}>
                      {formData.location || 'Procesando la URL de Google Maps...'}
                    </Text>
                    <ActivityIndicator size="small" color="#2196F3" />
                  </View>
              ) : null}
            </>
        );
      case 3:
        return (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Departamento</Text>
              {loadingDepartments ? (
                <ActivityIndicator size="small" color="#2196F3" />
              ) : (
                <View style={styles.categoriesContainer}>
                  {departments.map((department) => (
                    <TouchableOpacity
                      key={department.id}
                      style={[
                        styles.categoryButton,
                        formData.departmentId === department.id && styles.categoryButtonSelected,
                      ]}
                      onPress={() => {
                        updateFormField('departmentId', department.id);
                        updateFormField('cityId', null); // Reset city when department changes
                        fetchCitiesByDepartment(department.id);
                      }}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          formData.departmentId === department.id && styles.categoryButtonTextSelected,
                        ]}
                      >
                        {department.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {errors.departmentId ? <Text style={styles.errorText}>{errors.departmentId}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Ciudad</Text>
              {loadingCities || !formData.departmentId ? (
                formData.departmentId ? (
                  <ActivityIndicator size="small" color="#2196F3" />
                ) : (
                  <Text style={styles.helperText}>Selecciona un departamento primero</Text>
                )
              ) : (
                <View style={styles.categoriesContainer}>
                  {cities.length > 0 ? (
                    cities.map((city) => (
                      <TouchableOpacity
                        key={city.id}
                        style={[
                          styles.categoryButton,
                          formData.cityId === city.id && styles.categoryButtonSelected,
                        ]}
                        onPress={() => {
                          updateFormField('cityId', city.id);
                        }}
                      >
                        <Text
                          style={[
                            styles.categoryButtonText,
                            formData.cityId === city.id && styles.categoryButtonTextSelected,
                          ]}
                        >
                          {city.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.helperText}>No hay ciudades disponibles para este departamento</Text>
                  )}
                </View>
              )}
              {errors.cityId ? <Text style={styles.errorText}>{errors.cityId}</Text> : null}
            </View>
          </>
        );
      case 4:
        return (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Hora de apertura</Text>
                <TouchableOpacity
                    style={styles.timeInputContainer}
                    onPress={() => setShowOpeningTimePicker(true)}
                >
                  <Text style={[styles.timeInputText, !formData.openingTime && styles.timeInputPlaceholder]}>
                    {formData.openingTime || 'Selecciona la hora de apertura'}
                  </Text>
                  <Ionicons name="time-outline" size={24} color="#2196F3" />
                </TouchableOpacity>
                <DateTimePickerModal
                    isVisible={showOpeningTimePicker}
                    mode="time"
                    onConfirm={(date) => handleConfirmTimePicker(date, 'openingTime')}
                    onCancel={() => handleCancelTimePicker('openingTime')}
                    date={formData.openingTime ? new Date(`2000-01-01T${formData.openingTime}`) : new Date()}
                    is24Hour={true}
                />
                {errors.openingTime ? <Text style={styles.errorText}>{errors.openingTime}</Text> : null}
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Hora de cierre</Text>
                <TouchableOpacity
                    style={styles.timeInputContainer}
                    onPress={() => setShowClosingTimePicker(true)}
                >
                  <Text style={[styles.timeInputText, !formData.closingTime && styles.timeInputPlaceholder]}>
                    {formData.closingTime || 'Selecciona la hora de cierre'}
                  </Text>
                  <Ionicons name="time-outline" size={24} color="#2196F3" />
                </TouchableOpacity>
                <DateTimePickerModal
                    isVisible={showClosingTimePicker}
                    mode="time"
                    onConfirm={(date) => handleConfirmTimePicker(date, 'closingTime')}
                    onCancel={() => handleCancelTimePicker('closingTime')}
                    date={formData.closingTime ? new Date(`2000-01-01T${formData.closingTime}`) : new Date()}
                    is24Hour={true}
                />
                {errors.closingTime ? <Text style={styles.errorText}>{errors.closingTime}</Text> : null}
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Imágenes</Text>
                <TouchableOpacity style={styles.imagePickerButton} onPress={handleImagePicker}>
                  <Text style={styles.imagePickerButtonText}>Seleccionar imágenes</Text>
                </TouchableOpacity>
                {formData.images.length > 0 && (
                    <ScrollView horizontal style={styles.imagePreviewContainer}>
                        {formData.images.map((file, index) => (
                            <View key={index} style={styles.imagePreview}>
                                <Image source={{ uri: file.uri }} style={styles.previewImage} />
                                <TouchableOpacity
                                    style={styles.removeImageButton}
                                    onPress={() => removeImage(index)}
                                >
                                    <Text style={styles.removeImageButtonText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                )}
                {errors.images ? <Text style={styles.errorText}>{errors.images}</Text> : null}
              </View>
            </>
        );
      default:
        return null;
    }
  };

  const handlePlaceSelected = (
      data: GooglePlaceData,
      details: GooglePlaceDetail | null
  ) => {
    const location = details?.formatted_address || details?.name || '';
    updateFormField('location', location);
    if (details?.geometry?.location) {
      const { lat, lng } = details.geometry.location;
      updateFormField('latitude', lat);
      updateFormField('longitude', lng);
      setMapRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  };

  // Añadir esta función para renderizar cada categoría
  const renderCategoryItem = ({ item }: { item: Category }) => {
    const isCategorySelected = selectedCategories.includes(item.id);
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.categoryButton,
          isCategorySelected && styles.categoryButtonSelected,
        ]}
        onPress={() => {
          if (isCategorySelected) {
            // Deseleccionar categoría
            setSelectedCategories(selectedCategories.filter(id => id !== item.id));
          } else {
            // Seleccionar categoría
            setSelectedCategories([...selectedCategories, item.id]);
          }
        }}
      >
        <Text
          style={[
            styles.categoryButtonText,
            isCategorySelected && styles.categoryButtonTextSelected,
          ]}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Crear atracción</Text>
            <View style={{ width: 24 }} />
          </View>
          {renderStepIndicator()}
          <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {renderStepContent()}
            <View style={{ height: 80 }} />
          </ScrollView>
          <View style={styles.footerContainer}>
            <View style={styles.buttonsContainer}>
              {currentStep > 1 && (
                  <TouchableOpacity style={styles.backButton} onPress={handlePrevStep}>
                    <Text style={styles.backButtonText}>Atrás</Text>
                  </TouchableOpacity>
              )}
              {currentStep < totalSteps ? (
                  <TouchableOpacity
                      style={[styles.nextButton, currentStep === 1 && !isSmallDevice && { flex: 1 }]}
                      onPress={handleNextStep}
                  >
                    <Text style={styles.nextButtonText}>Siguiente</Text>
                  </TouchableOpacity>
              ) : (
                  <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Publicar</Text>}
                  </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  contentContainer: { paddingBottom: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: isSmallDevice ? 12 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: isSmallDevice ? 16 : 18, fontWeight: 'bold', color: '#333' },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: isSmallDevice ? 12 : 16,
  },
  stepDot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
  inputContainer: { marginBottom: isSmallDevice ? 16 : 20, width: '100%', paddingHorizontal: 10 },
  label: {
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: isSmallDevice ? 6 : 8,
    paddingLeft: 10,
    width: '95%',
    alignSelf: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: isSmallDevice ? 10 : 12,
    paddingHorizontal: isSmallDevice ? 12 : 15,
    fontSize: isSmallDevice ? 14 : 16,
    backgroundColor: '#f9f9f9',
    width: '95%',
    alignSelf: 'center',
  },
  textArea: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: isSmallDevice ? 10 : 12, fontSize: isSmallDevice ? 14 : 16, minHeight: isSmallDevice ? 100 : 120, backgroundColor: '#f9f9f9', width: '95%', alignSelf: 'center' },
  errorText: { color: '#FF385C', fontSize: isSmallDevice ? 12 : 14, marginTop: 4, width: '95%', alignSelf: 'center', paddingLeft: 10 },
  categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  categoryButton: { paddingHorizontal: isSmallDevice ? 12 : 16, paddingVertical: isSmallDevice ? 6 : 8, backgroundColor: '#f0f0f0', borderRadius: 20, marginRight: 8, marginBottom: 8 },
  categoryButtonSelected: { backgroundColor: '#FF385C' },
  categoryButtonText: { color: '#333', fontSize: isSmallDevice ? 12 : 14 },
  categoryButtonTextSelected: { color: '#fff' },
  imagePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: isSmallDevice ? 20 : 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  imagePickerButtonText: { marginTop: 8, fontSize: isSmallDevice ? 14 : 16, color: '#2196F3' },
  imagePreviewContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 },
  imagePreview: { width: '31%', marginRight: '2%', marginBottom: 8, position: 'relative' },
  previewImage: { width: '100%', height: isSmallDevice ? 80 : 100, borderRadius: 8 },
  removeImageButtonText: { position: 'absolute', top: -10, right: -10, color: '#FF385C', fontSize: 16 },
  removeImageButton: { position: 'absolute', top: -10, right: -10, backgroundColor: '#fff', borderRadius: 12, padding: 4 },
  urlInputContainer: { flexDirection: 'row', alignItems: 'center', width: '95%', alignSelf: 'center' },
  urlInput: { flex: 1, marginRight: 8 },
  openMapsButton: { padding: isSmallDevice ? 8 : 10, marginLeft: 8 },
  helperText: { fontSize: isSmallDevice ? 11 : 12, color: '#666', marginTop: 4, width: '95%', alignSelf: 'center', paddingLeft: 10 },
  separator: { height: 1, backgroundColor: '#e0e0e0', marginVertical: isSmallDevice ? 16 : 20, marginHorizontal: 10 },
  mapContainer: { height: isSmallDevice ? 200 : 250, borderRadius: 12, overflow: 'hidden', marginVertical: isSmallDevice ? 12 : 16, borderWidth: 1, borderColor: '#e0e0e0', marginHorizontal: 10, backgroundColor: '#fff' },
  map: { width: '100%', height: '100%' },
  mapInstructions: { fontSize: isSmallDevice ? 12 : 14, color: '#555', marginBottom: isSmallDevice ? 6 : 8, marginTop: isSmallDevice ? 10 : 12, fontStyle: 'italic', textAlign: 'center' },
  selectedLocationContainer: { marginTop: isSmallDevice ? 10 : 12, padding: isSmallDevice ? 8 : 10, backgroundColor: '#f0f7ff', borderRadius: 8, borderWidth: 1, borderColor: '#d0e3ff', marginHorizontal: 10, marginBottom: 20 },
  selectedLocationText: { fontSize: isSmallDevice ? 13 : 14, color: '#333', textAlign: 'center' },
  processingContainer: { marginTop: isSmallDevice ? 10 : 14, padding: isSmallDevice ? 16 : 20, backgroundColor: '#f0f7ff', borderRadius: 8, borderWidth: 1, borderColor: '#d0e3ff', marginHorizontal: 10, marginBottom: 20, alignItems: 'center' },
  processingText: { fontSize: isSmallDevice ? 13 : 14, color: '#2196F3', textAlign: 'center', marginBottom: 8 },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: isSmallDevice ? 10 : 12,
    paddingHorizontal: isSmallDevice ? 12 : 15,
    backgroundColor: '#f9f9f9',
    width: '95%',
    alignSelf: 'center',
  },
  timeInputText: { fontSize: isSmallDevice ? 14 : 16, color: '#333' },
  timeInputPlaceholder: { color: '#999' },
  nextButton: { backgroundColor: '#2196F3', paddingHorizontal: isSmallDevice ? 20 : 24, paddingVertical: isSmallDevice ? 10 : 12, borderRadius: 8, flex: 2, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontWeight: 'bold', fontSize: isSmallDevice ? 14 : 16 },
  submitButton: { backgroundColor: '#FF385C', paddingHorizontal: isSmallDevice ? 20 : 24, paddingVertical: isSmallDevice ? 10 : 12, borderRadius: 8, flex: 1, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: isSmallDevice ? 14 : 16 },
  backButton: { paddingHorizontal: isSmallDevice ? 16 : 20, paddingVertical: isSmallDevice ? 10 : 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginRight: 12 },
  backButtonText: { color: '#333', fontWeight: '500', fontSize: isSmallDevice ? 14 : 16 },
  footerContainer: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', position: 'absolute', bottom: 0, left: 0, right: 0, paddingVertical: 10 },
  buttonsContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: isSmallDevice ? 12 : 16 },
});

export default CreateAttractionScreen;
