import { Directory, File, Paths } from 'expo-file-system';

const IMAGE_EXT = /\.(jpe?g|png|webp|heic)$/i;

export type EvalImage = {
  fileName: string;
  sourceFolder: string;
  uri: string;
};

type NameMeta = { fileName: string; sourceFolder: string };
type NameMap = Record<string, NameMeta>;

/** Lists images copied into the app by the device evaluation script. */
export function loadEvalImages(): EvalImage[] {
  const inbox = new Directory(Paths.document, 'ocr-eval', 'inbox');
  if (!inbox.exists) return [];
  const names = readNameMap(inbox);
  return inbox
    .list()
    .filter((entry): entry is File => entry instanceof File && IMAGE_EXT.test(entry.name))
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((file) => toEvalImage(file, names));
}

function toEvalImage(file: File, names: NameMap): EvalImage {
  const meta = names[file.name];
  return {
    fileName: meta?.fileName ?? file.name,
    sourceFolder: meta?.sourceFolder ?? 'inbox',
    uri: file.uri,
  };
}

function readNameMap(inbox: Directory): NameMap {
  const file = new File(inbox, 'names.json');
  if (!file.exists) return {};
  try {
    const parsed: unknown = JSON.parse(file.textSync());
    return isNameMap(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function isNameMap(value: unknown): value is NameMap {
  if (typeof value !== 'object' || value === null) return false;
  return Object.values(value).every(isNameMeta);
}

function isNameMeta(value: unknown): value is NameMeta {
  if (typeof value !== 'object' || value === null) return false;
  if (!('fileName' in value) || !('sourceFolder' in value)) return false;
  return typeof value.fileName === 'string' && typeof value.sourceFolder === 'string';
}
