import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { isSupported, recognizeText, type RecognitionResult } from 'expo-mlkit-ocr';
import type { OcrDocument } from './types';

const MAX_EDGE = 2000;
const JPEG_QUALITY = 0.85;

export class ScanFailure extends Error {
  readonly code: 'unsupported' | 'failed';

  constructor(code: 'unsupported' | 'failed') {
    super(code);
    this.name = 'ScanFailure';
    this.code = code;
  }
}

/** Shrinks a photo for OCR. Falls back to the original if resizing fails. */
export async function preprocessBillImage(uri: string): Promise<string> {
  try {
    const result = await manipulateAsync(uri, [{ resize: { width: MAX_EDGE } }], {
      compress: JPEG_QUALITY,
      format: SaveFormat.JPEG,
    });
    return result.uri;
  } catch {
    return uri;
  }
}

/** Reads text on device. The recognized text is not logged. */
export async function readBillText(uri: string): Promise<OcrDocument> {
  if (!deviceSupportsOcr()) throw new ScanFailure('unsupported');
  try {
    return toDocument(await recognizeText(uri));
  } catch (error) {
    if (error instanceof ScanFailure) throw error;
    throw new ScanFailure('failed');
  }
}

function deviceSupportsOcr(): boolean {
  try {
    return isSupported() === true;
  } catch {
    return false;
  }
}

function toDocument(result: RecognitionResult): OcrDocument {
  const located = result.blocks.flatMap((block) => block.lines.map(locateLine));
  if (located.length === 0) return { lines: splitPlain(result.text) };
  const maxBottom = Math.max(...located.map((line) => line.bottom), 1);
  return {
    lines: located.map((line) => ({ text: line.text, topRatio: line.top / maxBottom })),
  };
}

function locateLine(line: RecognitionResult['blocks'][number]['lines'][number]) {
  return {
    text: line.text,
    top: line.boundingBox.y,
    bottom: line.boundingBox.y + line.boundingBox.height,
  };
}

function splitPlain(text: string): OcrDocument['lines'] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => ({ text: line }));
}
