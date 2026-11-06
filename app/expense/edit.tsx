import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { AmountField, DateField, SelectField, TextField } from '../../src/components/ui/Fields';
import { getExpense, updateExpense } from '../../src/data/expenses';
import { EXPENSE_CATEGORIES, isExpenseCategory } from '../../src/domain/categories';
import { minorToInput, parseUserAmount } from '../../src/domain/money';
import { validateManualExpense } from '../../src/domain/validation';
import { colors } from '../../src/theme/tokens';

const CATEGORIES = EXPENSE_CATEGORIES.map((category) => ({ label: category, value: category }));

export default function EditExpenseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const [name, setName] = useState('');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    getExpense(id).then((row) => {
      if (!active) return;
      if (!row) {
        setMissing(true);
        return;
      }
      setName(row.name);
      setMerchant(row.merchant ?? '');
      setAmount(minorToInput(row.amount_minor));
      setCategory(row.category);
      setDate(row.transaction_date?.slice(0, 10) ?? '');
      setNotes(row.notes ?? '');
    }).catch(() => {
      if (active) setMissing(true);
    });
    return () => {
      active = false;
    };
  }, [id]));

  async function save() {
    if (saving) return;
    const nextErrors = validateManualExpense({ name, amount, category, date, merchant, notes });
    setErrors(nextErrors);
    const amountMinor = parseUserAmount(amount);
    if (Object.keys(nextErrors).length > 0 || amountMinor === null || !isExpenseCategory(category)) return;
    setSaving(true);
    try {
      await updateExpense({
        id,
        name: name.trim(),
        merchant: merchant.trim() || null,
        transactionDate: date.trim() || null,
        amountMinor,
        category,
        notes: notes.trim() || null,
      });
      router.back();
    } catch {
      setFormError('Could not save this expense. Try again.');
      setSaving(false);
    }
  }

  return (
    <Screen>
      <FormHeader title="Edit expense" onBack={() => router.back()} />
      {missing ? <Text style={{ color: colors.textMuted }}>This expense is no longer on the device.</Text> : null}
      <TextField label="Name" value={name} onChangeText={setName} error={errors.name} />
      <TextField label="Merchant (optional)" value={merchant} onChangeText={setMerchant} error={errors.merchant} />
      <AmountField label="Amount" value={amount} onChangeText={setAmount} error={errors.amount} />
      <SelectField label="Category" value={category} options={CATEGORIES} onChange={setCategory} error={errors.category} />
      <DateField label="Date (optional)" value={date} onChange={setDate} error={errors.date} />
      <TextField label="Notes (optional)" value={notes} onChangeText={setNotes} error={errors.notes} multiline />
      {formError ? <Text style={{ color: colors.danger }}>{formError}</Text> : null}
      <PrimaryButton label={saving ? 'Saving…' : 'Save changes'} onPress={() => void save()} disabled={saving || missing} />
    </Screen>
  );
}
