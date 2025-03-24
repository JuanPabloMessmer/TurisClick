declare module 'react-native-base64' {
  export function encode(input: string): string;
  export function decode(input: string): string;
  
  const base64: {
    encode: typeof encode;
    decode: typeof decode;
  };
  
  export default base64;
} 