import 'dotenv/config';

export default {
  name: 'TurisClick',
  slug: 'turisclick',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/TURISCLICK.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/TURISCLICK.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.turisclick.app',
    buildNumber: '1',
    infoPlist: {
      NSCameraUsageDescription: 'Esta aplicación necesita acceso a la cámara para escanear códigos QR.',
      NSPhotoLibraryUsageDescription: 'Esta aplicación necesita acceso a la galería para subir fotos.',
      NSLocationWhenInUseUsageDescription: 'Esta aplicación necesita acceso a tu ubicación para mostrarte atracciones cercanas.',
      NSLocationAlwaysUsageDescription: 'Esta aplicación necesita acceso a tu ubicación para mostrarte atracciones cercanas.',
      UIBackgroundModes: ['location', 'fetch'],
    },
    associatedDomains: ['applinks:turisclick.com']
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/TURISCLICK.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.turisclick.app',
    versionCode: 1,
    permissions: [
      'CAMERA',
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'INTERNET'
    ],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'turisclick',
            host: 'payment',
            pathPrefix: '/complete'
          }
        ],
        category: ['BROWSABLE', 'DEFAULT']
      }
    ],
    googleMaps: {
      apiKey: process.env.GOOGLE_MAPS_API_KEY || 'your-api-key-here'
    }
  },
  web: {
    favicon: './assets/TURISCLICK.png'
  },
  scheme: 'turisclick',
  extra: {
    // Variables de configuración adicionales
    TICKET_SECRET_KEY: process.env.TICKET_SECRET_KEY,
    API_URL: process.env.API_URL,
    API_USERNAME: process.env.API_USERNAME,
    API_PASSWORD: process.env.API_PASSWORD,
  },
  plugins: [
    // Plugins de Expo si son necesarios
  ]
}; 