import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { AmountField, DateField, SelectField, TextField } from '../../src/components/ui/Fields';
import { deleteIncome, getIncome, updateIncome } from '../../src/data/income';
import type { IncomeRow } from '../../src/data/types';
import { INCOME_CATEGORIES, isIncomeCategory } from '../../src/domain/categories';
import { formatDisplayDate } from '../../src/domain/display';
import { formatMinor, minorToInput, parseUserAmount } from '../../src/domain/money';
import { validateOneTimeIncome } from '../../src/domain/validation';
import { colors, space, type as typeScale } from '../../src/theme/tokens';

const CATEGORIES = INCOME_CATEGORIES.map((category) => ({ label: category, value: category }));

export default function IncomeDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const [income, setIncome] = useState<IncomeRow | null>(null);
  const [missing, setMissing] = useState(false);
  const [editing, setEditing] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    getIncome(id).then((row) => {
      if (!active) return;
      setIncome(row);
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
      <FormHeader title="Income" onBack={() => router.back()} />
      {missing ? <Text style={{ color: colors.textMuted }}>This income record is no longer on the device.</Text> : null}
      {income && !editing ? <IncomeView income={income} onEdit={() => setEditing(true)} onDelete={() => confirmDelete(income, router)} /> : null}
      {income && editing ? (
        <IncomeEdit
          income={income}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            getIncome(id).then((row) => {
              setIncome(row);
              setMissing(!row);
              setEditing(false);
            }).catch(() => setEditing(false));
          }}
        />
      ) : null}
    </Screen>
  );
}

function IncomeView({ income, onEdit, onDelete }: { income: IncomeRow; onEdit: () => void; onDelete: () => void }) {
  return (
    <View style={{ gap: space.md }}>
      <Fact label="Source" value={income.name} />
      <Fact label="Amount" value={formatMinor(income.amount_minor)} />
      <Fact label="Category" value={income.category} />
      <Fact label="Received" value={formatDisplayDate(income.received_on)} />
      <Fact label="Notes" value={income.notes ?? 'None'} />
      <PrimaryButton label="Edit" onPress={onEdit} />
      <PrimaryButton label="Delete" onPress={onDelete} />
    </View>
  );
}

function IncomeEdit({ income, onCancel, onSaved }: { income: IncomeRow; onCancel: () => void; onSaved: () => void }) {
  const [name, setName] = useState(income.name);
  const [amount, setAmount] = useState(minorToInput(income.amount_minor));
  const [category, setCategory] = useState(income.category);
  const [date, setDate] = useState(income.received_on.slice(0, 10));
  const [notes, setNotes] = useState(income.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function save() {
    if (saving) return;
    const nextErrors = validateOneTimeIncome({ name, amount, category, date, notes });
    setErrors(nextErrors);
    const amountMinor = parseUserAmount(amount);
    if (Object.keys(nextErrors).length > 0 || amountMinor === null || !isIncomeCategory(category)) return;
    setSaving(true);
    try {
      await updateIncome({
        id: income.id,
        name: name.trim(),
        category,
        amountMinor,
        receivedOn: date,
        notes: notes.trim() || null,
      });
      onSaved();
    } catch {
      setFormError('Could not save this income. Try again.');
      setSaving(false);
    }
  }

  return (
    <View style={{ gap: space.md }}>
      <TextField label="Source" value={name} onChangeText={setName} error={errors.name} />
      <AmountField label="Amount" value={amount} onChangeText={setAmount} error={errors.amount} />
      <SelectField label="Category" value={category} options={CATEGORIES} onChange={setCategory} error={errors.category} />
      <DateField label="Received date" value={date} onChange={setDate} error={errors.date} />
      <TextField label="Notes (optional)" value={notes} onChangeText={setNotes} error={errors.notes} multiline />
      {formError ? <Text style={{ color: colors.danger }}>{formError}</Text> : null}
      <PrimaryButton label={saving ? 'Saving…' : 'Save changes'} onPress={() => void save()} disabled={saving} />
      <PrimaryButton label="Cancel" onPress={onCancel} />
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={{ color: colors.textMuted, fontSize: typeScale.caption }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

function confirmDelete(income: IncomeRow, router: { back: () => void }): void {
  Alert.alert(`Delete ${income.name}?`, 'This removes only this received payment. Other income stays, and a schedule is not deleted.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Confirm Delete',
      style: 'destructive',
      onPress: () => {
        deleteIncome(income.id).then(() => router.back()).catch(() => Alert.alert('Could not delete', 'Try again.'));
      },
    },
  ]);
}
