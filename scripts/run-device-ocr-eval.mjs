/**
 * Copies local receipt images into the debug app and runs the on-device OCR screen.
 * Prints filenames, decisions, and timings only. Full OCR text stays in the results file.
 *
 * Set src/dev/evalAutostart.ts to `export const DEV_OCR_EVAL = true` first.
 * A warm billsnap://dev/ocr-eval link does not change the running activity on this build.
 * The script reverse-forwards Metro, cold-starts the debug app, and the app opens the eval screen.
 *
 * Usage: node scripts/run-device-ocr-eval.mjs
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidHome = process.env.ANDROID_HOME || 'C:\\Users\\hp\\AppData\\Local\\Android\\Sdk';
const adb = path.join(androidHome, 'platform-tools', 'adb.exe');
const pkg = 'com.billsnap.app';
const outFile = path.join(root, 'docs', 'real-image-pipeline-output.json');
const IMAGE_EXT = /\.(jpe?g|png|webp|heic)$/i;
const POLL_LIMIT = 90;

function main() {
  const device = authorizedDevice();
  if (!device || !autostartEnabled()) return;
  const images = collectImages();
  if (images.length === 0) {
    console.error('No images found in test-dataset/ or test_dataset/.');
    process.exitCode = 1;
    return;
  }
  console.log(`Device ${device}. Copying ${images.length} images into ${pkg}.`);
  prepareInbox();
  const names = {};
  images.forEach((image, index) => {
    const stored = storedName(index, image.filePath);
    copyIntoApp(image.filePath, stored);
    names[stored] = { fileName: image.fileName, sourceFolder: image.sourceFolder };
    console.log(`Copied ${image.fileName}`);
  });
  copyNames(names);
  clearResults();
  launchEval();
  const report = pullReport();
  if (!report) {
    console.error('The app did not finish. Check USB debugging and that the debug build is open.');
    process.exitCode = 1;
    return;
  }
  writeFileSync(outFile, JSON.stringify(report, null, 2));
  printSummary(report);
}

function authorizedDevice() {
  const result = spawnSync(adb, ['devices'], { encoding: 'utf8' });
  if (result.error) {
    console.error(`adb could not start: ${result.error.message}`);
    process.exitCode = 2;
    return null;
  }
  const rows = result.stdout.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.includes('\t'));
  const ready = rows.find((line) => line.endsWith('\tdevice'));
  if (ready) return ready.split('\t')[0];
  console.error('No authorized Android device. adb reports:');
  console.error(result.stdout.trim() || '(no devices)');
  console.error('Accept the USB debugging prompt on the phone, then run this script again.');
  process.exitCode = 2;
  return null;
}

function collectImages() {
  const bills = listImages(path.join(root, 'test-dataset', 'bills'), 'bills');
  const nonBills = listImages(path.join(root, 'test-dataset', 'non-bills'), 'non-bills');
  if (bills.length + nonBills.length > 0) return [...bills, ...nonBills];
  return listImages(path.join(root, 'test_dataset'), 'test_dataset');
}

function listImages(directory, sourceFolder) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => IMAGE_EXT.test(name) && statSync(path.join(directory, name)).isFile())
    .sort((left, right) => left.localeCompare(right))
    .map((fileName) => ({ fileName, sourceFolder, filePath: path.join(directory, fileName) }));
}

function prepareInbox() {
  const command = `run-as ${pkg} sh -c "mkdir -p files/ocr-eval/inbox && rm -rf files/ocr-eval/inbox && mkdir -p files/ocr-eval/inbox"`;
  assertOk(spawnSync(adb, ['shell', command], { encoding: 'utf8' }), 'Could not create the app inbox');
}

function copyIntoApp(localPath, stored) {
  const tmp = `/data/local/tmp/${stored}`;
  assertOk(spawnSync(adb, ['push', localPath, tmp], { encoding: 'utf8' }), `push failed for ${stored}`);
  const remote = `files/ocr-eval/inbox/${stored}`;
  const piped = `cat ${tmp} | run-as ${pkg} sh -c "cat > ${remote}"`;
  const copied = spawnSync(adb, ['shell', piped], { encoding: 'utf8' });
  if ((copied.status ?? 1) !== 0 || remoteSize(stored) !== statSync(localPath).size) {
    pushBase64(localPath, stored);
  }
  if (remoteSize(stored) !== statSync(localPath).size) {
    throw new Error(`Size mismatch after copy: ${stored}`);
  }
}

function pushBase64(localPath, stored) {
  const payload = readFileSync(localPath).toString('base64');
  const remoteB64 = `files/ocr-eval/inbox/${stored}.b64`;
  const remote = `files/ocr-eval/inbox/${stored}`;
  assertOk(spawnSync(adb, ['shell', `run-as ${pkg} rm -f ${remoteB64} ${remote}`], { encoding: 'utf8' }), 'reset failed');
  for (let offset = 0; offset < payload.length; offset += 1500) {
    const part = payload.slice(offset, offset + 1500);
    const command = `run-as ${pkg} sh -c "printf %s '${part}' >> ${remoteB64}"`;
    assertOk(spawnSync(adb, ['shell', command], { encoding: 'utf8' }), `base64 chunk failed for ${stored}`);
  }
  const decode = `run-as ${pkg} sh -c "base64 -d ${remoteB64} > ${remote} && rm -f ${remoteB64}"`;
  assertOk(spawnSync(adb, ['shell', decode], { encoding: 'utf8' }), `base64 decode failed for ${stored}`);
}

function copyNames(names) {
  const local = path.join(tmpdir(), 'billsnap-eval-names.json');
  writeFileSync(local, JSON.stringify(names));
  copyIntoApp(local, 'names.json');
}

function clearResults() {
  spawnSync(adb, ['shell', `run-as ${pkg} rm -f files/ocr-eval/results.json files/ocr-eval/status.txt`], { encoding: 'utf8' });
}

function autostartEnabled() {
  const source = readFileSync(path.join(root, 'src', 'dev', 'evalAutostart.ts'), 'utf8');
  if (source.includes('export const DEV_OCR_EVAL = true')) return true;
  console.error('Set DEV_OCR_EVAL to true in src/dev/evalAutostart.ts, then run this script again.');
  process.exitCode = 1;
  return false;
}

function launchEval() {
  spawnSync(adb, ['reverse', 'tcp:8081', 'tcp:8081'], { encoding: 'utf8' });
  spawnSync(adb, ['shell', 'am', 'force-stop', pkg], { encoding: 'utf8' });
  const result = spawnSync(adb, [
    'shell', 'am', 'start', '-W', '-a', 'android.intent.action.VIEW',
    '-d', 'billsnap://?__expo_url=http%3A%2F%2F127.0.0.1%3A8081',
  ], { encoding: 'utf8' });
  assertOk(result, 'Could not open the debug app');
  console.log('Opened the debug app through Metro on USB. The eval screen starts while DEV_OCR_EVAL is true.');
}

function pullReport() {
  let previous = '';
  for (let attempt = 0; attempt < POLL_LIMIT; attempt += 1) {
    const status = readRemote('files/ocr-eval/status.txt').trim();
    if (status && status !== previous) {
      console.log(status);
      previous = status;
    }
    const report = parseFinished(readRemote('files/ocr-eval/results.json'));
    if (report) return report;
    sleep(2000);
  }
  return null;
}

function sleep(ms) {
  spawnSync(process.execPath, ['-e', `setTimeout(() => {}, ${ms})`], { timeout: ms + 2000 });
}

function parseFinished(raw) {
  if (!raw) return null;
  try {
    const report = JSON.parse(raw);
    if (!report || typeof report.finishedAt !== 'string') return null;
    return report;
  } catch {
    return null;
  }
}

function printSummary(report) {
  const device = report.device ?? {};
  console.log(`Saved ${outFile}`);
  console.log(`ML Kit invoked: ${Boolean(report.mlKitInvoked)}`);
  console.log(`Device: ${device.manufacturer ?? ''} ${device.model ?? ''}, Android ${device.androidRelease ?? ''} API ${device.apiLevel ?? ''}`);
  for (const image of report.images ?? []) {
    const fields = image.fields ?? {};
    console.log([
      image.fileName,
      image.decision ?? image.failure ?? image.status,
      fields.merchant ?? '-',
      fields.date ?? '-',
      fields.amountMinor ?? '-',
      fields.category ?? '-',
      `${image.preprocessMs}+${image.ocrMs}+${image.interpretMs}=${image.totalMs}ms`,
    ].join(' | '));
  }
}

function remoteSize(stored) {
  const result = spawnSync(adb, ['shell', `run-as ${pkg} wc -c files/ocr-eval/inbox/${stored}`], { encoding: 'utf8' });
  const match = /(\d+)/.exec(result.stdout ?? '');
  return match ? Number(match[1]) : -1;
}

function readRemote(remotePath) {
  const result = spawnSync(adb, ['exec-out', 'run-as', pkg, 'cat', remotePath], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  if ((result.status ?? 1) !== 0) return '';
  return result.stdout ?? '';
}

function storedName(index, filePath) {
  const ext = path.extname(filePath).toLowerCase() || '.jpg';
  return `${String(index + 1).padStart(2, '0')}${ext}`;
}

function assertOk(result, message) {
  if ((result.status ?? 1) === 0) return;
  const detail = `${result.stderr || ''}${result.stdout || ''}`.trim();
  throw new Error(detail ? `${message}: ${detail}` : message);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Evaluation script failed');
  process.exitCode = 1;
}
