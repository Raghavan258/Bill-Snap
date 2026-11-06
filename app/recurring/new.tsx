import { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { AmountField, DateField, SelectField, TextField } from '../../src/components/ui/Fields';
import { EXPENSE_CATEGORIES, FREQUENCIES, frequencyLabel, isExpenseCategory, isFrequency } from '../../src/domain/categories';
import { localToday } from '../../src/domain/display';
import { parseUserAmount } from '../../src/domain/money';
import { validateSavingsGoal } from '../../src/domain/validation';
import { insertExpenseSchedule } from '../../src/data/schedules';
import { colors } from '../../src/theme/tokens';

const CATEGORIES = EXPENSE_CATEGORIES.map((category) => ({ label: category, value: category }));
const FREQUENCY_OPTIONS = FREQUENCIES.map((frequency) => ({ label: frequencyLabel(frequency), value: frequency }));

export default function NewRecurringExpenseScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [nextDue, setNextDue] = useState(localToday());
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    const nextErrors = validateSavingsGoal({ name, target: amount, monthly: '', requireTarget: true, requireMonthly: false });
    if (!isExpenseCategory(category)) nextErrors.category = 'Choose a category.';
    if (!nextDue) nextErrors.date = 'Choose the next due date.';
    setErrors(nextErrors);
    const amountMinor = parseUserAmount(amount);
    if (Object.keys(nextErrors).length > 0 || amountMinor === null || !isExpenseCategory(category) || !isFrequency(frequency)) return;
    setSaving(true);
    try {
      await insertExpenseSchedule({
        id: Crypto.randomUUID(),
        name: name.trim(),
        category,
        amountMinor,
        frequency,
        nextDue,
        notes: notes.trim() || null,
        createdAt: new Date().toISOString(),
      });
      router.back();
    } catch {
      setErrors({ form: 'Could not save this commitment.' });
      setSaving(false);
    }
  }

  return (
    <Screen>
      <FormHeader title="Add Recurring Expense" onBack={() => router.back()} />
      <Text style={{ color: colors.textMuted, lineHeight: 20 }}>Saving this does not create an expense. Record a payment when you actually pay it.</Text>
      <TextField label="Name" value={name} onChangeText={setName} error={errors.name} placeholder="Rent, electricity, subscriptions" />
      <AmountField label="Amount" value={amount} onChangeText={setAmount} error={errors.target} />
      <SelectField label="Category" value={category} options={CATEGORIES} onChange={setCategory} error={errors.category} />
      <SelectField label="Frequency" value={frequency} options={FREQUENCY_OPTIONS} onChange={setFrequency} />
      <DateField label="Next due date" value={nextDue} onChange={setNextDue} error={errors.date} />
      <TextField label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />
      {errors.form ? <Text style={{ color: colors.danger }}>{errors.form}</Text> : null}
      <PrimaryButton label={saving ? 'Saving…' : 'Save commitment'} onPress={() => void save()} disabled={saving} />
    </Screen>
  );
}
