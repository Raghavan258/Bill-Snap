import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

export type PickResult = { status: 'picked'; uri: string } | { status: 'cancelled' } | { status: 'denied' };

const BILLS_DIRECTORY = 'bills';

export async function captureFromCamera(): Promise<PickResult> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return { status: 'denied' };
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
  return pickedUri(result);
}

export async function pickFromGallery(): Promise<PickResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { status: 'denied' };
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  return pickedUri(result);
}

/** Copies a bill into app storage so it survives cache cleanup. */
export async function persistBillImage(sourceUri: string, id: string): Promise<string> {
  const directory = new Directory(Paths.document, BILLS_DIRECTORY);
  if (!directory.exists) directory.create();
  const destination = new File(directory, `${id}.jpg`);
  await new File(sourceUri).copy(destination);
  return destination.uri;
}

/** Deletes saved bill images during the one-time financial reset. */
export async function clearStoredBills(): Promise<void> {
  try {
    const directory = new Directory(Paths.document, BILLS_DIRECTORY);
    if (directory.exists) directory.delete();
  } catch {
    // The database clear still completes if a file is locked.
  }
}

function pickedUri(result: ImagePicker.ImagePickerResult): PickResult {
  if (result.canceled || !result.assets[0]) return { status: 'cancelled' };
  return { status: 'picked', uri: result.assets[0].uri };
}
