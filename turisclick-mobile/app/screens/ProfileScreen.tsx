import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../api/apiConfig';
import { 
  SAFE_AREA_TOP, 
  spacing, 
  RFValue, 
  scale, 
  hasNotch,
  SCREEN_WIDTH,
  getStatusBarHeight
} from '../utils/dimensions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCategories, Category } from '../api/categoriesApi';

// Definir los tipos para la navegación
type RootStackParamList = {
  Home: undefined;
  CreateAttraction: undefined;
  Favorites: undefined;
  Auth: { screen: string };
};

const ProfileScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { logout, user, isAuthenticated, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingPersonalInfo, setEditingPersonalInfo] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [preferencesExpanded, setPreferencesExpanded] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    profile_image: user?.profile_image || null,
    preferences: user?.preferences || []
  });

  // Cargar categorías disponibles
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const categoriesData = await getCategories(true);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error al obtener categorías:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Actualizar formData cuando cambia el usuario
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        profile_image: user.profile_image || null,
        preferences: user.preferences || []
      });
    }
  }, [user]);

  const getFullName = () => {
    if (!user) return '';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  };

  const getProfileImage = () => {
    if (!formData.profile_image) return null;
    
    // Si ya es una URL completa
    if (formData.profile_image.startsWith('http')) {
      return formData.profile_image;
    }
    
    // Construir URL completa
    return `${API_URL}/${formData.profile_image}`;
  };

  const handleEditPersonalInfo = () => {
    setEditingPersonalInfo(true);
    setEditingPreferences(false);
  };

  const handleEditPreferences = () => {
    setEditingPreferences(true);
    setEditingPersonalInfo(false);
  };

  const handleCancel = () => {
    setEditingPersonalInfo(false);
    setEditingPreferences(false);
    // Restaurar datos originales
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        profile_image: user.profile_image || null,
        preferences: user.preferences || []
      });
    }
  };

  const toggleInfoSection = () => {
    if (editingPersonalInfo) return;
    setInfoExpanded(!infoExpanded);
    if (!infoExpanded && preferencesExpanded) {
      setPreferencesExpanded(false);
    }
  };

  const togglePreferencesSection = () => {
    if (editingPreferences) return;
    setPreferencesExpanded(!preferencesExpanded);
    if (!preferencesExpanded && infoExpanded) {
      setInfoExpanded(false);
    }
  };

  const togglePreference = (categoryId: string) => {
    setFormData(prev => {
      // Verificar si la categoría ya está seleccionada
      const isSelected = prev.preferences?.includes(categoryId);
      let updatedPreferences = prev.preferences || [];

      if (isSelected) {
        // Eliminar de las preferencias
        updatedPreferences = updatedPreferences.filter(id => id !== categoryId);
      } else {
        // Agregar a las preferencias
        updatedPreferences = [...updatedPreferences, categoryId];
      }

      return {
        ...prev,
        preferences: updatedPreferences
      };
    });
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Crear un objeto con solo los campos que han cambiado
      const updateData: any = {};
      
      // Solo incluir datos personales si estábamos editando esa sección
      if (editingPersonalInfo) {
        if (formData.firstName !== user?.firstName) {
          updateData.firstName = formData.firstName;
        }
        
        if (formData.lastName !== user?.lastName) {
          updateData.lastName = formData.lastName;
        }
      }
      
      // Solo incluir preferencias si estábamos editando esa sección
      if (editingPreferences) {
        // Verificar si las preferencias han cambiado
        const currentPrefs = user?.preferences || [];
        const newPrefs = formData.preferences || [];
        
        // Verificar si los arrays son diferentes
        const prefsChanged = currentPrefs.length !== newPrefs.length || 
          newPrefs.some(pref => !currentPrefs.includes(pref));
        
        if (prefsChanged) {
          updateData.preferences = formData.preferences;
        }
      }
      
      // Solo hacer la petición si hay cambios
      if (Object.keys(updateData).length > 0) {
        console.log('Enviando datos de actualización:', updateData);
        
        // Usar updateProfile del contexto que es más seguro
        const success = await updateProfile(updateData);
        
        if (success) {
          // Cerrar el modo de edición para ambas secciones
          setEditingPersonalInfo(false);
          setEditingPreferences(false);
          
          // Actualizar el usuario local con los cambios
          if (user) {
            const updatedUser = {...user, ...updateData};
            // Esta línea no actualiza el contexto, solo muestra los datos actualizados
            console.log('Usuario actualizado localmente:', updatedUser);
          }
          Alert.alert('Éxito', 'Perfil actualizado correctamente');
        } else {
          // No mostrar mensaje aquí, ya que el AuthContext mostrará una alerta para errores 401
          // y para otros errores podemos mostrar un mensaje genérico
          setEditingPersonalInfo(false);
          setEditingPreferences(false);
        }
      } else {
        // No hay cambios, simplemente salir del modo edición
        setEditingPersonalInfo(false);
        setEditingPreferences(false);
        Alert.alert('Información', 'No se detectaron cambios en tu perfil');
      }
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      // Salir del modo edición de todas formas
      setEditingPersonalInfo(false);
      setEditingPreferences(false);
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBecomeHost = () => {
    // Mostrar un diálogo de confirmación antes de navegar a la pantalla de creación
    Alert.alert(
      'Convertirse en anfitrión',
      '¿Estás listo para comenzar a ofrecer tus propias atracciones turísticas?',
      [
        {
          text: 'No ahora',
          style: 'cancel',
        },
        {
          text: 'Sí, vamos a empezar',
          onPress: () => {
            // Navegar a la pantalla de creación de atracciones
            navigation.navigate('CreateAttraction');
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sí, cerrar sesión',
          onPress: async () => {
            try {
              await logout();
              console.log('Sesión cerrada exitosamente');
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              Alert.alert('Error', 'No se pudo cerrar la sesión.');
            }
          },
        },
      ],
    );
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderField = (label: string, value: string, field: string, editable: boolean = true) => {
    if (editingPersonalInfo && editable) {
      return (
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={(text) => handleChange(field, text)}
            placeholder={`Ingresa tu ${label.toLowerCase()}`}
          />
        </View>
      );
    }
    
    return (
      <View style={styles.fieldContainer}>
        <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
          {editingPersonalInfo && !editable && (
            <Text style={styles.nonEditableTag}>No editable</Text>
          )}
        </View>
        <Text style={styles.value}>{value || 'No especificado'}</Text>
      </View>
    );
  };

  // Renderizar cada categoría como un chip seleccionable
  const renderCategoryItem = (category: Category) => {
    const isSelected = formData.preferences?.includes(category.id.toString());
    
    if (editingPreferences) {
      return (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryChip,
            isSelected && styles.selectedCategoryChip
          ]}
          onPress={() => togglePreference(category.id.toString())}
        >
          <Text style={[
            styles.categoryChipText,
            isSelected && styles.selectedCategoryChipText
          ]}>
            {category.name}
          </Text>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={16} color="#ffffff" style={styles.checkIcon} />
          )}
        </TouchableOpacity>
      );
    } else if (isSelected) {
      return (
        <View
          key={category.id}
          style={styles.selectedCategoryChip}
        >
          <Text style={styles.selectedCategoryChipText}>
            {category.name}
          </Text>
        </View>
      );
    }
    
    return null;
  };

  if (!isAuthenticated) {
    // Si no está autenticado, mostrar un mensaje
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerContent]}>
        <Text style={styles.notAuthenticatedText}>Inicia sesión para ver tu perfil</Text>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
        >
          <Text style={styles.loginButtonText}>Iniciar sesión</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Mi Perfil</Text>
          {/* Botón de cerrar sesión en la esquina superior derecha */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#FF385C" />
              </TouchableOpacity>
        </View>

        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            {getProfileImage() ? (
              <Image 
                source={{ uri: getProfileImage() as string }} 
                style={styles.profileImage} 
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderInitial}>{getFullName()[0] || '?'}</Text>
            </View>
          )}
          </View>
          <Text style={styles.profileName}>{getFullName() || 'Usuario'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'sin correo'}</Text>
        </View>

        {/* Botón prominente "Convertirse en host" estilo Airbnb */}
        {!user?.isHost && (
        <TouchableOpacity style={styles.becomeHostButton} onPress={handleBecomeHost}>
          <View style={styles.becomeHostContent}>
            <View style={styles.becomeHostTextContainer}>
              <Text style={styles.becomeHostTitle}>¿Quieres ofrecer tus atracciones?</Text>
              <Text style={styles.becomeHostSubtitle}>Comienza compartiendo tus experiencias turísticas</Text>
            </View>
            <View style={styles.becomeHostIconContainer}>
              <Ionicons name="add-circle" size={24} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
        )}

        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeaderContainer} 
            onPress={toggleInfoSection}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>Información Personal</Text>
            <View style={styles.dropdownIconContainer}>
              {infoExpanded && !editingPersonalInfo && (
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation(); 
                    handleEditPersonalInfo();
                  }} 
                  style={styles.sectionEditButton}
                >
                  <Ionicons name="pencil-outline" size={20} color="#FF385C" />
                </TouchableOpacity>
              )}
              {editingPersonalInfo ? (
                <View style={styles.editActionButtons}>
                  <TouchableOpacity 
                    style={styles.cancelIconButton} 
                    onPress={(e) => {
                      e.stopPropagation();
                      handleCancel();
                    }}
                  >
                    <Ionicons name="close-outline" size={22} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.saveIconButton, isLoading && styles.disabledButton]} 
                    onPress={(e) => {
                      e.stopPropagation();
                      handleSave();
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Ionicons name="checkmark-outline" size={22} color="white" />
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <Ionicons 
                  name={infoExpanded ? "chevron-up-outline" : "chevron-down-outline"} 
                  size={20} 
                  color="#666" 
                />
              )}
            </View>
          </TouchableOpacity>
          
          {(infoExpanded || editingPersonalInfo) && (
            <View style={styles.sectionContent}>
              {renderField('Nombre', formData.firstName, 'firstName')}
              {renderField('Apellido', formData.lastName, 'lastName')}
              {renderField('Email', formData.email, 'email', false)}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeaderContainer} 
            onPress={togglePreferencesSection}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>Preferencias</Text>
            <View style={styles.dropdownIconContainer}>
              {preferencesExpanded && !editingPreferences && (
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation(); 
                    handleEditPreferences();
                  }} 
                  style={styles.sectionEditButton}
                >
                  <Ionicons name="pencil-outline" size={20} color="#FF385C" />
                </TouchableOpacity>
              )}
              {editingPreferences ? (
                <View style={styles.editActionButtons}>
                  <TouchableOpacity 
                    style={styles.cancelIconButton} 
                    onPress={(e) => {
                      e.stopPropagation();
                      handleCancel();
                    }}
                  >
                    <Ionicons name="close-outline" size={22} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.saveIconButton, isLoading && styles.disabledButton]} 
                    onPress={(e) => {
                      e.stopPropagation();
                      handleSave();
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Ionicons name="checkmark-outline" size={22} color="white" />
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <Ionicons 
                  name={preferencesExpanded ? "chevron-up-outline" : "chevron-down-outline"} 
                  size={20} 
                  color="#666" 
                />
              )}
            </View>
          </TouchableOpacity>
          
          {(preferencesExpanded || editingPreferences) && (
            <View style={styles.sectionContent}>
              {loadingCategories ? (
                <ActivityIndicator size="small" color="#FF385C" style={styles.categoryLoader} />
              ) : (
                <View style={styles.preferencesContainer}>
                  {editingPreferences ? (
                    <Text style={styles.preferencesHint}>
                      Selecciona las categorías que te interesan:
                    </Text>
                  ) : formData.preferences && formData.preferences.length > 0 ? (
                    <Text style={styles.preferencesHint}>
                      Tus categorías favoritas:
                    </Text>
                  ) : (
                    <Text style={styles.noPreferencesText}>
                      No has seleccionado preferencias aún. Edita tu perfil para añadir las categorías que te interesan.
                    </Text>
                  )}
                  
                  <View style={styles.categoriesContainer}>
                    {categories.map(category => renderCategoryItem(category))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu</Text>
          {user?.isHost && (
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => navigation.navigate('CreateAttraction')}
            >
              <Ionicons name="add-circle-outline" size={24} color="#FF385C" />
              <Text style={styles.optionButtonText}>Crear nueva atracción</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.optionButton, styles.lastOption]}
            onPress={() => {
              // Implementar la funcionalidad para ir a favoritos
              navigation.navigate('Favorites');
            }}
          >
            <Ionicons name="heart-outline" size={24} color="#FF385C" />
            <Text style={styles.optionButtonText}>Mis Favoritos</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  contentContainer: {
    paddingBottom: hasNotch ? spacing.xl : spacing.l,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.m,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: RFValue(22),
    fontWeight: 'bold',
    color: '#333',
  },
  profileHeader: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  profileImageContainer: {
    marginBottom: spacing.m,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF385C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderInitial: {
    fontSize: RFValue(36),
    fontWeight: 'bold',
    color: 'white',
  },
  profileName: {
    fontSize: RFValue(20),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: spacing.xs,
  },
  profileEmail: {
    fontSize: RFValue(14),
    color: '#666',
  },
  section: {
    margin: spacing.m,
    padding: spacing.m,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  becomeHostButton: {
    margin: spacing.m,
    padding: 0,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: '#FF385C', // Color rojo de Airbnb
    overflow: 'hidden',
  },
  becomeHostContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
  },
  becomeHostTextContainer: {
    flex: 1,
  },
  becomeHostTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: RFValue(16),
    marginBottom: 4,
  },
  becomeHostSubtitle: {
    color: 'white',
    fontSize: RFValue(13),
    opacity: 0.9,
  },
  becomeHostIconContainer: {
    marginLeft: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  sectionTitle: {
    fontSize: RFValue(18),
    fontWeight: 'bold',
    marginBottom: spacing.m,
    color: '#333',
  },
  fieldContainer: {
    marginBottom: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingBottom: spacing.s,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: RFValue(13),
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: RFValue(15),
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: spacing.s,
    fontSize: RFValue(15),
  },
  editButton: {
    backgroundColor: '#FF385C',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 8,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: RFValue(14),
  },
  actionButtons: {
    flexDirection: 'row',
  },
  saveButton: {
    backgroundColor: '#FF385C',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 8,
    marginLeft: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: RFValue(14),
  },
  cancelButton: {
    backgroundColor: '#eeeeee',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: RFValue(14),
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  optionButtonText: {
    fontSize: RFValue(15),
    color: '#333',
    marginLeft: spacing.m,
  },
  notAuthenticatedText: {
    fontSize: RFValue(16),
    color: '#666',
    marginBottom: spacing.m,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#FF385C',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderRadius: 8,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: RFValue(16),
  },
  nonEditableTag: {
    fontSize: RFValue(10),
    color: '#999',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  preferencesContainer: {
    marginTop: spacing.s,
  },
  preferencesHint: {
    color: '#666',
    fontSize: RFValue(14),
    marginBottom: spacing.s,
  },
  noPreferencesText: {
    color: '#999',
    fontSize: RFValue(14),
    fontStyle: 'italic',
    marginBottom: spacing.m,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: spacing.s,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
  },
  selectedCategoryChip: {
    backgroundColor: '#FF385C',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
  },
  selectedCategoryChipText: {
    color: '#fff',
    fontSize: 14,
  },
  checkIcon: {
    marginLeft: 4,
  },
  categoryLoader: {
    marginVertical: 16,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.s,
  },
  sectionEditButton: {
    padding: 8,
  },
  editActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelIconButton: {
    backgroundColor: '#eeeeee',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  saveIconButton: {
    backgroundColor: '#FF385C',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    padding: 8,
  },
  dropdownIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionContent: {
    marginTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: spacing.m,
  },
});

export default ProfileScreen; 