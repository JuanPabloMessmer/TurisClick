import { Dimensions, Platform, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');

// Tamaños base para diseño (basado en iPhone 11 Pro / X - 375x812)
const baseWidth = 375;
const baseHeight = 812;

// Detector de dispositivo pequeño
export const isSmallDevice = width < 375 || height < 667;
export const isMediumDevice = width >= 375 && width < 414;
export const isLargeDevice = width >= 414;

// Detector de notch
export const hasNotch = Platform.OS === 'ios' && !Platform.isPad && !Platform.isTVOS && 
  ((height === 780 || width === 780) || // iPhone 12 Mini
   (height === 812 || width === 812) || // iPhone X/XS/11 Pro/12 Pro/13 Pro
   (height === 844 || width === 844) || // iPhone 12/12 Pro/13/14
   (height === 852 || width === 852) || // iPhone 14 Pro
   (height === 896 || width === 896) || // iPhone XR/XS Max/11/11 Pro Max
   (height === 926 || width === 926) || // iPhone 12 Pro Max/13 Pro Max
   (height === 932 || width === 932));  // iPhone 14 Pro Max

// Calcular el porcentaje horizontal
export const widthPercentageToDP = (percentage: number) => {
  return (percentage * width) / 100;
};

// Calcular el porcentaje vertical
export const heightPercentageToDP = (percentage: number) => {
  return (percentage * height) / 100;
};

// Escalar fuentes basado en el ancho de la pantalla
export const scale = (size: number) => (width / baseWidth) * size;
export const verticalScale = (size: number) => (height / baseHeight) * size;

// Responsive font size
export const RFValue = (fontSize: number, standardScreenHeight = 812) => {
  const standardLength = width > height ? width : height;
  const offset = width > height ? 0 : Platform.OS === 'ios' ? 78 : StatusBar.currentHeight || 0;
  
  const deviceHeight = standardLength - offset;
  const heightPercent = (fontSize * deviceHeight) / standardScreenHeight;
  
  // Ajuste para dispositivos más pequeños y más grandes
  if (isSmallDevice) {
    return Math.round(heightPercent * 0.95);
  } else if (isLargeDevice) {
    return Math.round(heightPercent * 1.05);
  }
  
  return Math.round(heightPercent);
};

// Paddings y márgenes específicos
export const getStatusBarHeight = () => {
  return Platform.OS === 'ios' ? (hasNotch ? 44 : 20) : StatusBar.currentHeight || 0;
};

export const getBottomSpace = () => {
  return Platform.OS === 'ios' && hasNotch ? 34 : 0;
};

// Espaciado seguro para dispositivos con notch
export const SAFE_AREA_TOP = getStatusBarHeight();
export const SAFE_AREA_BOTTOM = getBottomSpace();

// Dimensiones de pantalla
export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

// Espaciados estándar
export const spacing = {
  xs: scale(4),
  s: scale(8),
  m: scale(16),
  l: scale(24),
  xl: scale(32),
  xxl: scale(40),
};

export default {
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  hasNotch,
  widthPercentageToDP,
  heightPercentageToDP,
  scale,
  verticalScale,
  RFValue,
  getStatusBarHeight,
  getBottomSpace,
  SAFE_AREA_TOP,
  SAFE_AREA_BOTTOM,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  spacing,
}; 