import { useState } from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { AmountField, DateField, SelectField, TextField } from '../../src/components/ui/Fields';
import { INCOME_CATEGORIES, isIncomeCategory } from '../../src/domain/categories';
import { localToday } from '../../src/domain/display';
import { parseUserAmount } from '../../src/domain/money';
import { validateOneTimeIncome } from '../../src/domain/validation';
import { insertIncome } from '../../src/data/income';
import { colors } from '../../src/theme/tokens';

const OPTIONS = INCOME_CATEGORIES.map((category) => ({ label: category, value: category }));

export default function OneTimeIncomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; amount?: string; category?: string; scheduleId?: string }>();
  const [name, setName] = useState(textParam(params.name));
  const [amount, setAmount] = useState(textParam(params.amount));
  const [category, setCategory] = useState(textParam(params.category));
  const [date, setDate] = useState(localToday());
  const [notes, setNotes] = useState('');
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
      await insertIncome({
        id: Crypto.randomUUID(),
        name: name.trim(),
        category,
        amountMinor,
        receivedOn: date,
        notes: notes.trim() || null,
        scheduleId: textParam(params.scheduleId) || null,
        createdAt: new Date().toISOString(),
      });
      router.back();
    } catch {
      setFormError('Could not save this income. Try again.');
      setSaving(false);
    }
  }

  return (
    <Screen>
      <FormHeader title="Add One-time Income" onBack={() => router.back()} />
      <TextField label="Income name" value={name} onChangeText={setName} error={errors.name} placeholder="Bonus, freelance, gift" />
      <AmountField label="Amount" value={amount} onChangeText={setAmount} error={errors.amount} />
      <SelectField label="Category" value={category} options={OPTIONS} onChange={setCategory} error={errors.category} placeholder="Select category" />
      <DateField label="Date received" value={date} onChange={setDate} error={errors.date} />
      <TextField label="Notes (optional)" value={notes} onChangeText={setNotes} error={errors.notes} multiline />
      {formError ? <Text style={{ color: colors.danger }}>{formError}</Text> : null}
      <PrimaryButton label={saving ? 'Saving…' : 'Add Income'} onPress={() => void save()} disabled={saving} />
    </Screen>
  );
}

function textParam(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : '';
}
