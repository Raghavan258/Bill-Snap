import { useCallback, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { countRecords, type RecordCounts } from '../../src/data/records';
import { colors, type as typeScale } from '../../src/theme/tokens';

export default function DataScreen() {
  const router = useRouter();
  const [counts, setCounts] = useState<RecordCounts | null>(null);
  const [failed, setFailed] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    countRecords()
      .then((next) => {
        if (active) setCounts(next);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []));

  return (
    <Screen>
      <FormHeader title="Data & Backup" onBack={() => router.back()} />
      <Text style={styles.note}>
        Records and receipt images stay on this phone. Backup is not set up, and nothing is uploaded.
      </Text>
      {failed ? <Text style={styles.error}>Could not read on-device storage.</Text> : null}
      <Count label="Expenses" value={counts?.expenses} />
      <Count label="Income received" value={counts?.income} />
      <Count label="Savings goals" value={counts?.goals} />
      <Count label="Savings contributions" value={counts?.contributions} />
    </Screen>
  );
}

function Count({ label, value }: { label: string; value: number | undefined }) {
  return <Text style={styles.count}>{label}: {value === undefined ? '—' : String(value)}</Text>;
}

const styles = StyleSheet.create({
  note: { color: colors.textMuted, lineHeight: 22, fontSize: typeScale.body },
  count: { color: colors.text, fontSize: typeScale.body, fontWeight: '700' },
  error: { color: colors.danger },
});
