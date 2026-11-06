import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { interpretOcr } from '../../src/pipeline/interpretOcr';
import { preprocessBillImage, readBillText, ScanFailure } from '../../src/pipeline/readImage';
import type { ExtractedFields } from '../../src/pipeline/types';
import { setReviewDraft } from '../../src/state/reviewDraft';
import { colors, radius, space, type as typeScale } from '../../src/theme/tokens';

type Outcome =
  | { type: 'rejected'; message: string }
  | { type: 'bill'; imageUri: string; fields: ExtractedFields; uncertain: boolean }
  | { type: 'error'; message: string };

export default function ProcessScreen() {
  const router = useRouter();
  const replaceReview = useRef(router.replace);
  replaceReview.current = router.replace;
  const params = useLocalSearchParams<{ uri?: string; source?: string }>();
  const uri = typeof params.uri === 'string' ? params.uri : '';
  const source = params.source === 'gallery' ? 'gallery' : 'scan';
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uri) {
      setError('No image was selected.');
      return;
    }
    let cancelled = false;
    readBill(uri).then((outcome) => {
      if (cancelled) return;
      applyOutcome(outcome, source, setMessage, setError, () => replaceReview.current('/expense/review'));
    });
    return () => {
      cancelled = true;
    };
  }, [source, uri]);

  return (
    <Screen>
      <FormHeader title="Reading bill" onBack={() => router.back()} />
      {uri ? <Image source={{ uri }} style={styles.image} resizeMode="contain" accessibilityLabel="Selected bill image" /> : null}
      <ProcessStatus message={message} error={error} onBack={() => router.back()} onManual={() => router.replace('/expense/manual')} />
    </Screen>
  );
}

function ProcessStatus({ message, error, onBack, onManual }: {
  message: string | null;
  error: string | null;
  onBack: () => void;
  onManual: () => void;
}) {
  if (!message && !error) {
    return (
      <View style={styles.status}>
        <ActivityIndicator color={colors.cta} />
        <Text style={styles.body}>Checking whether this image is a bill and reading the details.</Text>
      </View>
    );
  }
  return (
    <View style={styles.actions}>
      {message ? <Text style={styles.body}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Try another image" onPress={onBack} />
      <PrimaryButton label="Add manually" onPress={onManual} />
    </View>
  );
}

async function readBill(uri: string): Promise<Outcome> {
  try {
    const prepared = await preprocessBillImage(uri);
    const reading = interpretOcr(await readBillText(prepared));
    if (reading.kind === 'rejected') return { type: 'rejected', message: reading.message };
    return {
      type: 'bill',
      imageUri: prepared,
      fields: reading.fields,
      uncertain: reading.classification.decision === 'needs-review',
    };
  } catch (error) {
    return { type: 'error', message: scanMessage(error) };
  }
}

function applyOutcome(
  outcome: Outcome,
  source: 'scan' | 'gallery',
  setMessage: (value: string) => void,
  setError: (value: string) => void,
  openReview: () => void,
): void {
  if (outcome.type === 'rejected') {
    setMessage(outcome.message);
    return;
  }
  if (outcome.type === 'error') {
    setError(outcome.message);
    return;
  }
  setReviewDraft({
    imageUri: outcome.imageUri,
    source,
    fields: outcome.fields,
    uncertain: outcome.uncertain,
  });
  openReview();
}

function scanMessage(error: unknown): string {
  if (error instanceof ScanFailure && error.code === 'unsupported') {
    return 'Text recognition needs the installed Android app. Expo Go cannot run on-device OCR.';
  }
  return 'The image could not be read. Try another photo, or add the expense manually.';
}

const styles = StyleSheet.create({
  image: { width: '100%', height: 240, borderRadius: radius.md, backgroundColor: colors.surface },
  status: { gap: space.md, alignItems: 'center' },
  body: { color: colors.text, fontSize: typeScale.body, lineHeight: 22 },
  error: { color: colors.danger, fontSize: typeScale.body, lineHeight: 22 },
  actions: { gap: space.md },
});
