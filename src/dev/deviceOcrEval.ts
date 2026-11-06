import { Directory, File, Paths } from 'expo-file-system';
import { readAndroidDevice, type AndroidDeviceInfo } from './androidDevice';
import { loadEvalImages, type EvalImage } from './loadEvalImages';
import { interpretOcr, type Reading } from '../pipeline/interpretOcr';
import { preprocessBillImage, readBillText, ScanFailure } from '../pipeline/readImage';
import type { ExtractedFields, OcrDocument, OcrLine } from '../pipeline/types';

const PIPELINE = 'preprocessBillImage (width 2000, JPEG 0.85) -> readBillText (expo-mlkit-ocr recognizeText) -> interpretOcr';

export type EvalLine = { text: string; topRatio: number | null };

export type EvalFields = {
  merchant: string | null;
  merchantConfidence: string | null;
  date: string | null;
  dateConfidence: string | null;
  amountMinor: number | null;
  amountConfidence: string | null;
  category: string | null;
  categoryConfidence: string | null;
};

export type EvalImageResult = {
  fileName: string;
  sourceFolder: string;
  preprocessMs: number;
  ocrMs: number;
  interpretMs: number;
  totalMs: number;
  status: 'read' | 'failed';
  failure: string | null;
  mlKitRan: boolean;
  lineCount: number;
  lines: EvalLine[];
  fieldsExtracted: boolean;
  isBill: boolean | null;
  decision: string | null;
  reason: string | null;
  signals: string[];
  fields: EvalFields | null;
};

export type PipelineReport = {
  mlKitInvoked: boolean;
  pipeline: string;
  startedAt: string;
  finishedAt: string | null;
  device: AndroidDeviceInfo;
  images: EvalImageResult[];
};

let active = false;

/** Runs the app OCR path over inbox images and stores the raw result on device. */
export async function runDeviceEvaluation(onProgress: (message: string) => void): Promise<PipelineReport | null> {
  if (active) return null;
  active = true;
  try {
    return await evaluateInbox(onProgress);
  } finally {
    active = false;
  }
}

async function evaluateInbox(onProgress: (message: string) => void): Promise<PipelineReport | null> {
  const images = loadEvalImages();
  if (images.length === 0) {
    await writeStatus('No images in the on-device inbox.');
    onProgress('No images in the on-device inbox.');
    return null;
  }
  const report = emptyReport(readAndroidDevice());
  for (const image of images) {
    const label = `Reading ${report.images.length + 1} of ${images.length}`;
    onProgress(label);
    await writeStatus(label);
    report.images.push(await evaluateDeviceImage(image));
  }
  report.mlKitInvoked = report.images.some((image) => image.mlKitRan);
  report.finishedAt = new Date().toISOString();
  await writeReport(report);
  await writeStatus(`Finished ${report.images.length} images.`);
  onProgress(`Finished ${report.images.length} images.`);
  return report;
}

/** Times preprocess, on-device OCR, and interpretOcr for one image. */
export async function evaluateDeviceImage(image: EvalImage): Promise<EvalImageResult> {
  const started = Date.now();
  const result = emptyImage(image);
  const prepared = await timedPreprocess(image.uri, result);
  if (!prepared) return finish(result, started);
  const document = await timedOcr(prepared, result);
  if (!document) return finish(result, started);
  timedInterpret(document, result);
  result.status = 'read';
  return finish(result, started);
}

async function timedPreprocess(uri: string, result: EvalImageResult): Promise<string | null> {
  const started = Date.now();
  try {
    const prepared = await preprocessBillImage(uri);
    result.preprocessMs = Date.now() - started;
    return prepared;
  } catch (error) {
    result.preprocessMs = Date.now() - started;
    result.failure = failureCode(error);
    return null;
  }
}

async function timedOcr(uri: string, result: EvalImageResult): Promise<OcrDocument | null> {
  const started = Date.now();
  try {
    const document = await readBillText(uri);
    result.ocrMs = Date.now() - started;
    result.lines = document.lines.map(toLine);
    result.lineCount = result.lines.length;
    result.mlKitRan = true;
    return document;
  } catch (error) {
    result.ocrMs = Date.now() - started;
    result.failure = failureCode(error);
    return null;
  }
}

function timedInterpret(document: OcrDocument, result: EvalImageResult): void {
  const started = Date.now();
  applyReading(result, interpretOcr(document));
  result.interpretMs = Date.now() - started;
}

function applyReading(result: EvalImageResult, reading: Reading): void {
  result.isBill = reading.classification.isBill;
  result.decision = reading.classification.decision;
  result.reason = reading.classification.reason;
  result.signals = [...reading.classification.signals];
  result.fieldsExtracted = reading.kind === 'bill';
  result.fields = reading.kind === 'bill' ? toFields(reading.fields) : null;
}

function toFields(fields: ExtractedFields): EvalFields {
  return {
    merchant: fields.merchant.value,
    merchantConfidence: fields.merchant.confidence,
    date: fields.date.value,
    dateConfidence: fields.date.confidence,
    amountMinor: fields.amountMinor.value,
    amountConfidence: fields.amountMinor.confidence,
    category: fields.category.value,
    categoryConfidence: fields.category.confidence,
  };
}

function toLine(line: OcrLine): EvalLine {
  return { text: line.text, topRatio: line.topRatio ?? null };
}

function failureCode(error: unknown): string {
  if (error instanceof ScanFailure) return error.code;
  return 'failed';
}

function finish(result: EvalImageResult, started: number): EvalImageResult {
  result.totalMs = Date.now() - started;
  if (result.failure) result.status = 'failed';
  return result;
}

function emptyReport(device: AndroidDeviceInfo): PipelineReport {
  return {
    mlKitInvoked: false,
    pipeline: PIPELINE,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    device,
    images: [],
  };
}

function emptyImage(image: EvalImage): EvalImageResult {
  return {
    fileName: image.fileName,
    sourceFolder: image.sourceFolder,
    preprocessMs: 0,
    ocrMs: 0,
    interpretMs: 0,
    totalMs: 0,
    status: 'failed',
    failure: null,
    mlKitRan: false,
    lineCount: 0,
    lines: [],
    fieldsExtracted: false,
    isBill: null,
    decision: null,
    reason: null,
    signals: [],
    fields: null,
  };
}

async function writeReport(report: PipelineReport): Promise<void> {
  const directory = evalDirectory();
  await new File(directory, 'results.json').write(JSON.stringify(report));
}

async function writeStatus(message: string): Promise<void> {
  const directory = evalDirectory();
  await new File(directory, 'status.txt').write(message);
}

function evalDirectory(): Directory {
  const directory = new Directory(Paths.document, 'ocr-eval');
  if (!directory.exists) directory.create();
  return directory;
}
