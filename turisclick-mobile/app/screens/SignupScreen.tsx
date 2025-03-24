import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  FlatList 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getCategories, Category } from '../api/categoriesApi';
import { Ionicons } from '@expo/vector-icons';

const SignupScreen = () => {
  const navigation = useNavigation();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    preferences: [] as string[],
  });
  
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    preferences: '',
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

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePreference = (categoryId: string) => {
    setFormData(prev => {
      // Verificar si la categoría ya está seleccionada
      const isSelected = prev.preferences.includes(categoryId);
      let updatedPreferences;

      if (isSelected) {
        // Eliminar de las preferencias
        updatedPreferences = prev.preferences.filter(id => id !== categoryId);
      } else {
        // Agregar a las preferencias
        updatedPreferences = [...prev.preferences, categoryId];
      }

      return {
        ...prev,
        preferences: updatedPreferences
      };
    });

    // Limpiar error de preferencias si hay
    if (errors.preferences) {
      setErrors(prev => ({
        ...prev,
        preferences: ''
      }));
    }
  };

  const validate = () => {
    let isValid = true;
    const newErrors = { ...errors };
    
    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
      isValid = false;
    }
    
    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
      isValid = false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Correo electrónico inválido';
      isValid = false;
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      isValid = false;
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
      isValid = false;
    }
    
    // Preferences validation
    if (formData.preferences.length === 0) {
      newErrors.preferences = 'Selecciona al menos una preferencia';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSignup = async () => {
    if (!validate()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const { confirmPassword, ...signupData } = formData;
      
      // Verificar las preferencias antes de enviar
      console.log('Preferencias antes de enviar al registro:', signupData.preferences);
      
      // Asegurarnos de que las preferencias sean strings y no números
      const preferencesArray = signupData.preferences.map(pref => pref.toString());
      console.log('Preferencias convertidas a string:', preferencesArray);
      
      const success = await register(
        signupData.firstName,
        signupData.lastName,
        signupData.email,
        signupData.password,
        preferencesArray  // Enviamos el array de strings
      );
      
      if (success) {
        Alert.alert(
          'Registro exitoso',
          'Tu cuenta ha sido creada correctamente',
          [
            {
              text: 'Iniciar sesión',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo completar el registro');
      }
    } catch (error) {
      console.error('Error during signup:', error);
      Alert.alert('Error', 'Ocurrió un error durante el registro');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar cada categoría como un chip seleccionable
  const renderCategoryItem = ({ item }: { item: Category }) => {
    const isSelected = formData.preferences.includes(item.id.toString());
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryChip,
          isSelected && styles.selectedCategoryChip
        ]}
        onPress={() => togglePreference(item.id.toString())}
      >
        <Text style={[
          styles.categoryChipText,
          isSelected && styles.selectedCategoryChipText
        ]}>
          {item.name}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={16} color="#ffffff" style={styles.checkIcon} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Crear una cuenta</Text>
        <Text style={styles.subtitle}>Completa tus datos para registrarte</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={[styles.input, errors.firstName ? styles.inputError : null]}
            placeholder="Ingresa tu nombre"
            value={formData.firstName}
            onChangeText={(text) => handleChange('firstName', text)}
          />
          {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Apellido</Text>
          <TextInput
            style={[styles.input, errors.lastName ? styles.inputError : null]}
            placeholder="Ingresa tu apellido"
            value={formData.lastName}
            onChangeText={(text) => handleChange('lastName', text)}
          />
          {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={[styles.input, errors.email ? styles.inputError : null]}
            placeholder="ejemplo@correo.com"
            value={formData.email}
            onChangeText={(text) => handleChange('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={[styles.input, errors.password ? styles.inputError : null]}
            placeholder="Ingresa tu contraseña"
            value={formData.password}
            onChangeText={(text) => handleChange('password', text)}
            secureTextEntry
          />
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirmar contraseña</Text>
          <TextInput
            style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
            placeholder="Confirma tu contraseña"
            value={formData.confirmPassword}
            onChangeText={(text) => handleChange('confirmPassword', text)}
            secureTextEntry
          />
          {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Preferencias</Text>
          <Text style={styles.sublabel}>Selecciona las categorías que te interesan:</Text>
          
          {loadingCategories ? (
            <ActivityIndicator size="small" color="#FF385C" style={styles.categoryLoader} />
          ) : (
            <>
              <View style={styles.categoriesContainer}>
                {categories.map(category => (
                  <React.Fragment key={`category-${category.id}`}>
                    {renderCategoryItem({ item: category })}
                  </React.Fragment>
                ))}
              </View>
              {errors.preferences ? <Text style={styles.errorText}>{errors.preferences}</Text> : null}
            </>
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.disabledButton]} 
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Registrarse</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes una cuenta?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formContainer: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  sublabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#FF385C',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#666',
    marginRight: 4,
  },
  footerLink: {
    color: '#FF385C',
    fontWeight: 'bold',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
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
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
  },
  selectedCategoryChipText: {
    color: '#fff',
  },
  checkIcon: {
    marginLeft: 4,
  },
  categoryLoader: {
    marginVertical: 16,
  },
});

export default SignupScreen; 