import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '../src/components/ui/Screen';
import { FormHeader } from '../src/components/ui/FormHeader';
import { EmptyNote, RecordRow } from '../src/components/ui/RecordRow';
import { listExpenses } from '../src/data/expenses';
import type { ExpenseRow } from '../src/data/types';
import { formatDisplayDate } from '../src/domain/display';
import { formatMinor } from '../src/domain/money';
import { space } from '../src/theme/tokens';

export default function VaultScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [failed, setFailed] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    listExpenses().then((expenses) => {
      if (active) setRows(expenses);
    }).catch(() => {
      if (active) setFailed(true);
    });
    return () => {
      active = false;
    };
  }, []));

  return (
    <Screen>
      <FormHeader title="Receipt Vault" onBack={() => router.back()} />
      {failed ? <EmptyNote text="Could not load saved expenses." /> : null}
      {!failed && rows.length === 0 ? <EmptyNote text="No expenses yet. Record one from Home." /> : null}
      <View style={{ gap: space.sm }}>
        {rows.map((expense) => (
          <RecordRow
            key={expense.id}
            title={expense.name}
            subtitle={`${expense.category} · ${formatDisplayDate(expense.transaction_date)}${expense.image_uri ? '' : ' · No image'}`}
            amount={formatMinor(expense.amount_minor)}
            onPress={() => router.push(`/expense/${expense.id}`)}
          />
        ))}
      </View>
    </Screen>
  );
}
