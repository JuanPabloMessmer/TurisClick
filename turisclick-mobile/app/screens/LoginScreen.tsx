import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Image, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375 || height < 667;

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: '',
  });

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
    
    // Clear general error when typing any field
    if (errors.general) {
      setErrors(prev => ({
        ...prev,
        general: ''
      }));
    }
  };

  const validate = () => {
    let isValid = true;
    const newErrors = { ...errors };
    
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
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const success = await login(formData.email, formData.password);
      
      if (!success) {
        setErrors(prev => ({
          ...prev,
          general: 'Credenciales incorrectas o error en el servidor'
        }));
      }
    } catch (error) {
      console.error('Login error:', error);
      
      setErrors(prev => ({
        ...prev,
        general: 'Ocurrió un error durante el inicio de sesión'
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f8f8' }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          <View style={styles.formContainer}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/icon.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            
            <Text style={styles.title}>Iniciar Sesión</Text>
            <Text style={styles.subtitle}>Bienvenido de vuelta a TurisClick</Text>
            
            {errors.general ? (
              <View style={styles.errorContainer}>
                <Text style={styles.generalError}>{errors.general}</Text>
              </View>
            ) : null}
            
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
            
            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>¿No tienes una cuenta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.signupLink}>Regístrate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  contentContainer: {
    flexGrow: 1,
  },
  formContainer: {
    padding: isSmallDevice ? 20 : 24,
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: isSmallDevice ? 20 : 40,
    marginBottom: isSmallDevice ? 20 : 40,
  },
  logo: {
    width: isSmallDevice ? 100 : 120,
    height: isSmallDevice ? 100 : 120,
    borderRadius: 20,
  },
  title: {
    fontSize: isSmallDevice ? 24 : 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: isSmallDevice ? 4 : 8,
  },
  subtitle: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#666',
    marginBottom: isSmallDevice ? 24 : 32,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: isSmallDevice ? 12 : 16,
    borderRadius: 8,
    marginBottom: isSmallDevice ? 16 : 20,
  },
  generalError: {
    color: '#b71c1c',
    fontSize: isSmallDevice ? 13 : 14,
  },
  inputGroup: {
    marginBottom: isSmallDevice ? 16 : 20,
  },
  label: {
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: isSmallDevice ? 6 : 8,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: isSmallDevice ? 12 : 16,
    paddingVertical: isSmallDevice ? 10 : 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: isSmallDevice ? 14 : 16,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: isSmallDevice ? 12 : 14,
    marginTop: 4,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: isSmallDevice ? 20 : 24,
  },
  forgotPassword: {
    color: '#2196F3',
    fontSize: isSmallDevice ? 13 : 14,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: isSmallDevice ? 12 : 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: isSmallDevice ? 16 : 20,
  },
  signupText: {
    color: '#666',
    fontSize: isSmallDevice ? 14 : 15,
  },
  signupLink: {
    color: '#2196F3',
    fontWeight: 'bold',
    fontSize: isSmallDevice ? 14 : 15,
    marginLeft: 5,
  },
});

export default LoginScreen; 