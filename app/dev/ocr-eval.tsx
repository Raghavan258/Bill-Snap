import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { runDeviceEvaluation, type PipelineReport } from '../../src/dev/deviceOcrEval';
import { colors, space, type as typeScale } from '../../src/theme/tokens';

export default function OcrEvalScreen() {
  const router = useRouter();
  const [status, setStatus] = useState('Waiting for on-device images.');
  const [report, setReport] = useState<PipelineReport | null>(null);
  const [running, setRunning] = useState(false);
  const start = useCallback(() => { void startRun(setRunning, setStatus, setReport); }, []);

  useFocusEffect(useCallback(() => {
    start();
  }, [start]));

  return (
    <Screen>
      <FormHeader title="OCR evaluation" onBack={() => router.back()} />
      <EvalBody running={running} status={status} report={report} onRun={start} />
    </Screen>
  );
}

function EvalBody({ running, status, report, onRun }: {
  running: boolean;
  status: string;
  report: PipelineReport | null;
  onRun: () => void;
}) {
  return (
    <View style={styles.block}>
      {running ? <ActivityIndicator color={colors.cta} /> : null}
      <Text style={styles.body}>{status}</Text>
      {report ? <ReportSummary report={report} /> : null}
      <PrimaryButton label="Run evaluation again" onPress={onRun} disabled={running} />
    </View>
  );
}

function ReportSummary({ report }: { report: PipelineReport }) {
  const read = report.images.filter((image) => image.mlKitRan).length;
  return (
    <View style={styles.block}>
      <Text style={styles.body}>{deviceLine(report)}</Text>
      <Text style={styles.body}>{`${read} of ${report.images.length} images returned OCR text.`}</Text>
      {report.images.map((image) => (
        <Text key={image.fileName} style={styles.caption}>{summaryLine(image)}</Text>
      ))}
    </View>
  );
}

function deviceLine(report: PipelineReport): string {
  const device = report.device;
  return `${device.manufacturer} ${device.model}, Android ${device.androidRelease} (API ${device.apiLevel ?? 'unknown'})`;
}

function summaryLine(image: PipelineReport['images'][number]): string {
  const outcome = image.failure ?? image.decision ?? 'unread';
  return `${image.fileName}: ${outcome}, ${image.totalMs} ms`;
}

async function startRun(
  setRunning: (value: boolean) => void,
  setStatus: (value: string) => void,
  setReport: (value: PipelineReport) => void,
): Promise<void> {
  if (!__DEV__) {
    setStatus('This check runs only in a development build.');
    return;
  }
  setRunning(true);
  setStatus('Reading images already copied onto this device.');
  const report = await runDeviceEvaluation(setStatus);
  if (report) setReport(report);
  setRunning(false);
}

const styles = StyleSheet.create({
  block: { gap: space.md },
  body: { color: colors.text, fontSize: typeScale.body, lineHeight: 22 },
  caption: { color: colors.textMuted, fontSize: typeScale.caption, lineHeight: 18 },
});
