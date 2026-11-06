import { useCallback, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { deleteExpense, getExpense } from '../../src/data/expenses';
import type { ExpenseRow } from '../../src/data/types';
import { formatDisplayDate, formatTimestamp } from '../../src/domain/display';
import { formatMinor } from '../../src/domain/money';
import { colors, radius, space, type as typeScale } from '../../src/theme/tokens';

export default function ExpenseDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const [expense, setExpense] = useState<ExpenseRow | null>(null);
  const [missing, setMissing] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    getExpense(id).then((row) => {
      if (!active) return;
      setExpense(row);
      setMissing(!row);
    }).catch(() => {
      if (active) setMissing(true);
    });
    return () => {
      active = false;
    };
  }, [id]));

  return (
    <Screen>
      <FormHeader title="Expense" onBack={() => router.back()} />
      {missing ? <Text style={styles.body}>This record is no longer on the device.</Text> : null}
      {expense ? (
        <ExpenseBody
          expense={expense}
          onEdit={() => router.push({ pathname: '/expense/edit', params: { id } })}
          onDelete={() => confirmDelete(expense.name, id, router)}
        />
      ) : null}
    </Screen>
  );
}

function ExpenseBody({ expense, onEdit, onDelete }: { expense: ExpenseRow; onEdit: () => void; onDelete: () => void }) {
  return (
    <View style={styles.stack}>
      {expense.image_uri ? (
        <Image source={{ uri: expense.image_uri }} style={styles.image} resizeMode="contain" accessibilityLabel="Saved bill image" />
      ) : (
        <Text style={styles.muted}>No bill image is stored with this record.</Text>
      )}
      <Fact label="Name" value={expense.name} />
      <Fact label="Merchant" value={expense.merchant ?? 'Not recorded'} />
      <Fact label="Date" value={formatDisplayDate(expense.transaction_date)} />
      <Fact label="Amount" value={formatMinor(expense.amount_minor)} />
      <Fact label="Category" value={expense.category} />
      <Fact label="Notes" value={expense.notes ?? 'None'} />
      <Fact label="Saved" value={formatTimestamp(expense.created_at)} />
      <PrimaryButton label="Edit expense" onPress={onEdit} />
      <PrimaryButton label="Delete expense" onPress={onDelete} />
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function confirmDelete(name: string, id: string, router: { back: () => void }): void {
  Alert.alert(`Delete ${name}?`, 'This removes only this expense from this device.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Confirm Delete',
      style: 'destructive',
      onPress: () => {
        deleteExpense(id).then(() => router.back()).catch(() => Alert.alert('Could not delete', 'Try again.'));
      },
    },
  ]);
}

const styles = StyleSheet.create({
  stack: { gap: space.md },
  image: { width: '100%', height: 280, borderRadius: radius.md, backgroundColor: colors.surface },
  body: { color: colors.text, fontSize: typeScale.body },
  muted: { color: colors.textMuted },
  fact: { gap: 2 },
  label: { color: colors.textFaint, fontSize: typeScale.caption },
  value: { color: colors.text, fontSize: typeScale.body, fontWeight: '600' },
});
