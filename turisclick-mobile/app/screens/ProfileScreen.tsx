import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Image } from 'react-native';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  SAFE_AREA_TOP, 
  spacing, 
  RFValue, 
  scale, 
  hasNotch,
  SCREEN_WIDTH,
  getStatusBarHeight
} from '../utils/dimensions';

// Mock user data - replace with actual data from your backend
const initialUserData = {
  name: 'A',
  email: 'a@gmail.com',
  phone: '75027305',
  preferences: {
    notifications: true,
    darkMode: false,
  }
};

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { logout, user } = useAuth();
  const [userData, setUserData] = useState(initialUserData);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialUserData);

  const handleEdit = () => {
    setIsEditing(true);
    setFormData(userData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(userData);
  };

  const handleSave = async () => {
    try {
      // Replace '/profile' with your actual API endpoint
      // await apiClient.put('/profile', formData);
      
      // For now, just update the state
      setUserData(formData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
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

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderField = (label: string, value: string, field: keyof typeof formData) => {
    if (isEditing) {
      return (
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.input}
            value={formData[field] as string}
            onChangeText={(text) => handleChange(field, text)}
          />
        </View>
      );
    }
    
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          {!isEditing ? (
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Botón prominente "Convertirse en host" estilo Airbnb */}
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {renderField('Name', userData.name, 'name')}
          {renderField('Email', userData.email, 'email')}
          {renderField('Phone', userData.phone, 'phone')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
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
  section: {
    margin: spacing.m,
    padding: spacing.m,
    backgroundColor: 'white',
    borderRadius: 8,
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
    fontSize: RFValue(16),
    fontWeight: 'bold',
    marginBottom: spacing.m,
    color: '#333',
  },
  fieldContainer: {
    marginBottom: spacing.m,
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
    backgroundColor: '#2196F3',
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
    backgroundColor: '#4CAF50',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 8,
    marginLeft: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: RFValue(14),
  },
  cancelButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: RFValue(14),
  },
  logoutButton: {
    backgroundColor: '#f44336',
    paddingVertical: spacing.m,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: RFValue(15),
  },
});

export default ProfileScreen; 