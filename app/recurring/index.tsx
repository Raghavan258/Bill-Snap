import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { EmptyNote, RecordRow } from '../../src/components/ui/RecordRow';
import { listExpenseSchedules, markSchedulePaid } from '../../src/data/schedules';
import type { ExpenseScheduleRow } from '../../src/data/types';
import { frequencyLabel, isFrequency } from '../../src/domain/categories';
import { formatDisplayDate, localToday } from '../../src/domain/display';
import { formatMinor } from '../../src/domain/money';
import { colors, space } from '../../src/theme/tokens';

export default function RecurringExpensesScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<ExpenseScheduleRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(() => {
    listExpenseSchedules().then(setRows).catch(() => setRows([]));
  }, []);

  useFocusEffect(useCallback(() => {
    reload();
  }, [reload]));

  return (
    <Screen>
      <FormHeader title="Recurring Expenses" onBack={() => router.back()} />
      <Text style={{ color: colors.textMuted, lineHeight: 20 }}>
        A commitment is not an expense until you record it as paid. That creates one expense, not two.
      </Text>
      {rows.length === 0 ? <EmptyNote text="No recurring expenses yet." /> : null}
      <View style={{ gap: space.sm }}>
        {rows.map((schedule) => (
          <View key={schedule.id} style={{ gap: space.sm }}>
            <RecordRow
              title={schedule.name}
              subtitle={`${label(schedule.frequency)} · Due ${formatDisplayDate(schedule.next_due)} · Tap to record as paid`}
              amount={formatMinor(schedule.amount_minor)}
              onPress={() => confirmPaid(schedule, busyId, setBusyId, reload)}
            />
          </View>
        ))}
      </View>
      <PrimaryButton label="Add recurring expense" onPress={() => router.push('/recurring/new')} />
    </Screen>
  );
}

function label(frequency: string): string {
  return isFrequency(frequency) ? frequencyLabel(frequency) : frequency;
}

function confirmPaid(
  schedule: ExpenseScheduleRow,
  busyId: string | null,
  setBusyId: (id: string | null) => void,
  reload: () => void,
): void {
  if (busyId) return;
  Alert.alert('Record this as paid?', 'This adds one expense for today and moves the next due date forward.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Record payment', onPress: () => void pay(schedule, setBusyId, reload) },
  ]);
}

async function pay(schedule: ExpenseScheduleRow, setBusyId: (id: string | null) => void, reload: () => void): Promise<void> {
  setBusyId(schedule.id);
  try {
    await markSchedulePaid({
      schedule,
      expenseId: Crypto.randomUUID(),
      paidOn: localToday(),
      createdAt: new Date().toISOString(),
    });
    reload();
  } catch {
    Alert.alert('Could not record the payment', 'Try again.');
  } finally {
    setBusyId(null);
  }
}
