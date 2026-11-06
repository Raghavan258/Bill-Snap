import { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { AmountField, DateField, SelectField, TextField } from '../../src/components/ui/Fields';
import { EXPENSE_CATEGORIES, isExpenseCategory } from '../../src/domain/categories';
import { parseUserAmount } from '../../src/domain/money';
import { validateManualExpense } from '../../src/domain/validation';
import { insertExpense } from '../../src/data/expenses';
import { colors } from '../../src/theme/tokens';

const OPTIONS = EXPENSE_CATEGORIES.map((category) => ({ label: category, value: category }));

export default function ManualExpenseScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function save() {
    if (saving) return;
    const nextErrors = validateManualExpense({ name, amount, category, date, merchant, notes });
    setErrors(nextErrors);
    const amountMinor = parseUserAmount(amount);
    if (Object.keys(nextErrors).length > 0 || amountMinor === null || !isExpenseCategory(category)) return;
    setSaving(true);
    try {
      const id = Crypto.randomUUID();
      await insertExpense({
        id,
        name: name.trim(),
        merchant: merchant.trim() || null,
        transactionDate: date.trim() || null,
        amountMinor,
        category,
        imageUri: null,
        notes: notes.trim() || null,
        source: 'manual',
        createdAt: new Date().toISOString(),
      });
      router.replace(`/expense/${id}`);
    } catch {
      setFormError('Could not save this expense. Try again.');
      setSaving(false);
    }
  }

  return (
    <Screen>
      <FormHeader title="Add Expense Manually" onBack={() => router.back()} />
      <AmountField label="Amount" value={amount} onChangeText={setAmount} error={errors.amount} />
      <SelectField label="Category" value={category} options={OPTIONS} onChange={setCategory} error={errors.category} placeholder="Select category" />
      <DateField label="Date (optional)" value={date} onChange={setDate} error={errors.date} />
      <TextField label="Expense name" value={name} onChangeText={setName} error={errors.name} placeholder="Cafe, groceries, electricity" />
      <TextField label="Merchant (optional)" value={merchant} onChangeText={setMerchant} error={errors.merchant} />
      <TextField label="Notes (optional)" value={notes} onChangeText={setNotes} error={errors.notes} multiline placeholder="Cafe, groceries, etc." />
      {formError ? <Text style={{ color: colors.danger }}>{formError}</Text> : null}
      <PrimaryButton label={saving ? 'Saving…' : 'Save Expense'} onPress={() => void save()} disabled={saving} />
    </Screen>
  );
}
