import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { AmountField, DateField, SelectField, TextField } from '../../src/components/ui/Fields';
import { getIncomeSchedule, insertIncomeSchedule, updateIncomeSchedule } from '../../src/data/income';
import { FREQUENCIES, INCOME_CATEGORIES, frequencyLabel, isFrequency, isIncomeCategory } from '../../src/domain/categories';
import { localToday } from '../../src/domain/display';
import { minorToInput, parseUserAmount } from '../../src/domain/money';
import { validateRecurringIncome } from '../../src/domain/validation';
import { colors } from '../../src/theme/tokens';

const CATEGORIES = INCOME_CATEGORIES.map((category) => ({ label: category, value: category }));
const FREQUENCY_OPTIONS = FREQUENCIES.map((frequency) => ({ label: frequencyLabel(frequency), value: frequency }));

export default function RecurringIncomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const scheduleId = typeof params.id === 'string' ? params.id : '';
  const form = useScheduleForm(scheduleId);

  async function save() {
    const saved = await form.save(scheduleId);
    if (saved) router.replace('/income/schedules');
  }

  return (
    <Screen>
      <FormHeader title={scheduleId ? 'Edit Recurring Income' : 'Add Recurring Income'} onBack={() => router.back()} />
      <Text style={{ color: colors.textMuted, lineHeight: 20 }}>
        This saves the schedule only. It is not counted as received income until you record a payment.
      </Text>
      {form.missing ? <Text style={{ color: colors.textMuted }}>This schedule is no longer on the device.</Text> : null}
      <TextField label="Income name" value={form.name} onChangeText={form.setName} error={form.errors.name} placeholder="Salary, rent, pension" />
      <AmountField label="Amount" value={form.amount} onChangeText={form.setAmount} error={form.errors.amount} />
      <SelectField label="Frequency" value={form.frequency} options={FREQUENCY_OPTIONS} onChange={form.setFrequency} error={form.errors.frequency} />
      <SelectField label="Category" value={form.category} options={CATEGORIES} onChange={form.setCategory} error={form.errors.category} placeholder="Select category" />
      <DateField label="Start date" value={form.startDate} onChange={form.setStartDate} error={form.errors.startDate} />
      <DateField label="End date (optional)" value={form.endDate} onChange={form.setEndDate} error={form.errors.endDate} />
      <TextField label="Notes (optional)" value={form.notes} onChangeText={form.setNotes} error={form.errors.notes} multiline />
      {form.formError ? <Text style={{ color: colors.danger }}>{form.formError}</Text> : null}
      <PrimaryButton label={form.saving ? 'Saving…' : 'Save schedule'} onPress={() => void save()} disabled={form.saving || form.missing} />
    </Screen>
  );
}

function useScheduleForm(scheduleId: string) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [startDate, setStartDate] = useState(localToday());
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!scheduleId) return;
    getIncomeSchedule(scheduleId).then((row) => {
      if (!row) {
        setMissing(true);
        return;
      }
      setName(row.name);
      setAmount(minorToInput(row.amount_minor));
      setCategory(row.category);
      setFrequency(row.frequency);
      setStartDate(row.start_date);
      setEndDate(row.end_date ?? '');
      setNotes(row.notes ?? '');
    }).catch(() => setMissing(true));
  }, [scheduleId]);

  async function save(id: string): Promise<boolean> {
    if (saving || missing) return false;
    const nextErrors = validateRecurringIncome({ name, amount, category, frequency, startDate, endDate, notes });
    setErrors(nextErrors);
    const amountMinor = parseUserAmount(amount);
    if (Object.keys(nextErrors).length > 0 || amountMinor === null || !isIncomeCategory(category) || !isFrequency(frequency)) return false;
    setSaving(true);
    try {
      await persistSchedule(id, { name: name.trim(), category, amountMinor, frequency, startDate, endDate: endDate.trim() || null, notes: notes.trim() || null });
      return true;
    } catch {
      setFormError('Could not save this schedule. Try again.');
      setSaving(false);
      return false;
    }
  }

  return {
    name, setName, amount, setAmount, category, setCategory, frequency, setFrequency,
    startDate, setStartDate, endDate, setEndDate, notes, setNotes,
    errors, saving, missing, formError, save,
  };
}

async function persistSchedule(id: string, input: {
  name: string;
  category: string;
  amountMinor: number;
  frequency: string;
  startDate: string;
  endDate: string | null;
  notes: string | null;
}): Promise<void> {
  if (id) {
    await updateIncomeSchedule({ id, ...input });
    return;
  }
  await insertIncomeSchedule({ id: Crypto.randomUUID(), ...input, createdAt: new Date().toISOString() });
}
