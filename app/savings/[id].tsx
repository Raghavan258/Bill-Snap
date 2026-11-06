import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { AmountField } from '../../src/components/ui/Fields';
import { EmptyNote } from '../../src/components/ui/RecordRow';
import { deleteGoal, getGoal, insertContribution, listContributions } from '../../src/data/savings';
import type { ContributionRow, GoalRow } from '../../src/data/types';
import { formatDisplayDate, localToday } from '../../src/domain/display';
import { formatMinor, parseUserAmount } from '../../src/domain/money';
import { goalProgress } from '../../src/domain/savings';
import { validateContribution } from '../../src/domain/validation';
import { colors, radius, space, type as typeScale } from '../../src/theme/tokens';

export default function GoalDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const [goal, setGoal] = useState<GoalRow | null>(null);
  const [contributions, setContributions] = useState<ContributionRow[]>([]);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(() => {
    getGoal(id).then(setGoal).catch(() => setGoal(null));
    listContributions(id).then(setContributions).catch(() => setContributions([]));
  }, [id]);

  useFocusEffect(useCallback(() => {
    reload();
  }, [reload]));

  async function addContribution() {
    if (saving) return;
    const errors = validateContribution(amount);
    const amountMinor = parseUserAmount(amount);
    if (errors.amount || amountMinor === null) {
      setError(errors.amount ?? 'Enter an amount greater than zero.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await insertContribution({
        id: Crypto.randomUUID(),
        goalId: id,
        amountMinor,
        contributedOn: localToday(),
        note: null,
        createdAt: new Date().toISOString(),
      });
      setAmount('');
      reload();
    } catch {
      setError('Could not record this contribution.');
    } finally {
      setSaving(false);
    }
  }

  const progress = goalProgress(goal?.saved_minor ?? 0, goal?.target_minor ?? null);
  return (
    <Screen>
      <FormHeader title={goal?.name ?? 'Savings'} onBack={() => router.back()} />
      {!goal ? <EmptyNote text="This goal is not on the device." /> : null}
      {goal ? <GoalSummary goal={goal} ratio={progress.ratio} remaining={progress.remainingMinor} /> : null}
      <Text style={styles.note}>Recording a contribution does not create an expense.</Text>
      <AmountField label="Contribution" value={amount} onChangeText={setAmount} error={error ?? undefined} />
      <PrimaryButton label={saving ? 'Saving…' : 'Record contribution'} onPress={() => void addContribution()} disabled={saving} />
      <Text style={styles.heading}>Recorded contributions</Text>
      {contributions.length === 0 ? <EmptyNote text="Nothing has been set aside yet." /> : null}
      {contributions.map((item) => (
        <View key={item.id} style={styles.row}>
          <Text style={styles.body}>{formatDisplayDate(item.contributed_on)}</Text>
          <Text style={styles.body}>{formatMinor(item.amount_minor)}</Text>
        </View>
      ))}
      {goal ? <PrimaryButton label="Delete goal" onPress={() => confirmDelete(id, router)} /> : null}
    </Screen>
  );
}

function GoalSummary({ goal, ratio, remaining }: { goal: GoalRow; ratio: number | null; remaining: number | null }) {
  const width = `${Math.round((ratio ?? 0) * 100)}%` as `${number}%`;
  return (
    <View style={styles.card}>
      <Text style={styles.body}>Saved {formatMinor(goal.saved_minor)}</Text>
      <Text style={styles.note}>{goal.target_minor ? `Target ${formatMinor(goal.target_minor)}` : 'No total target'}</Text>
      <View style={styles.track}><View style={[styles.fill, { width }]} /></View>
      <Text style={styles.note}>{remaining === null ? 'Ongoing plan' : `${formatMinor(remaining)} remaining`}</Text>
      {goal.monthly_plan_minor ? <Text style={styles.note}>Planned monthly {formatMinor(goal.monthly_plan_minor)} — not yet saved</Text> : null}
    </View>
  );
}

function confirmDelete(id: string, router: { back: () => void }): void {
  Alert.alert('Delete this goal?', 'Contributions for this goal are removed too. Expenses are not changed.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: () => {
        deleteGoal(id).then(() => router.back()).catch(() => Alert.alert('Could not delete', 'Try again.'));
      },
    },
  ]);
}

const styles = {
  card: { gap: space.sm, padding: space.md, borderRadius: radius.md, backgroundColor: colors.surface },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' as const },
  fill: { height: 8, backgroundColor: colors.cta },
  heading: { color: colors.text, fontSize: typeScale.heading, fontWeight: '700' as const },
  body: { color: colors.text, fontSize: typeScale.body },
  note: { color: colors.textMuted, lineHeight: 20 },
  row: { flexDirection: 'row' as const, justifyContent: 'space-between' as const },
};
