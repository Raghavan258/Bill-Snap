import { Platform } from 'react-native';

export type AndroidDeviceInfo = {
  model: string;
  brand: string;
  manufacturer: string;
  androidRelease: string;
  apiLevel: number | null;
};

/** Reads the Android model and OS version from the running app. */
export function readAndroidDevice(): AndroidDeviceInfo {
  if (Platform.OS !== 'android') return unknownDevice();
  const constants: object = Platform.constants;
  return {
    model: readString(constants, 'Model'),
    brand: readString(constants, 'Brand'),
    manufacturer: readString(constants, 'Manufacturer'),
    androidRelease: readString(constants, 'Release'),
    apiLevel: readNumber(constants, 'Version'),
  };
}

function unknownDevice(): AndroidDeviceInfo {
  return { model: 'unknown', brand: 'unknown', manufacturer: 'unknown', androidRelease: 'unknown', apiLevel: null };
}

function readString(source: object, key: string): string {
  const value = readField(source, key);
  return typeof value === 'string' && value.length > 0 ? value : 'unknown';
}

function readNumber(source: object, key: string): number | null {
  const value = readField(source, key);
  return typeof value === 'number' ? value : null;
}

function readField(source: object, key: string): unknown {
  if (!Object.prototype.hasOwnProperty.call(source, key)) return undefined;
  return Reflect.get(source, key);
}
