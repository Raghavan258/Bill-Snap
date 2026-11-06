import { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { AmountField, TextField } from '../../src/components/ui/Fields';
import { parseUserAmount } from '../../src/domain/money';
import { monthlyTargetTotal } from '../../src/domain/savings';
import { validateSavingsGoal } from '../../src/domain/validation';
import { insertGoal } from '../../src/data/savings';
import { colors } from '../../src/theme/tokens';

export default function MonthlySavingScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [monthly, setMonthly] = useState('');
  const [duration, setDuration] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    const nextErrors = validateSavingsGoal({ name, target: '', monthly, requireTarget: false, requireMonthly: true });
    const months = parseMonths(duration);
    if (months === 'invalid') nextErrors.duration = 'Enter a number of months, or leave it blank.';
    setErrors(nextErrors);
    const monthlyMinor = parseUserAmount(monthly);
    if (Object.keys(nextErrors).length > 0 || monthlyMinor === null || months === 'invalid') return;
    setSaving(true);
    try {
      const id = Crypto.randomUUID();
      await insertGoal({
        id,
        kind: 'monthly',
        name: name.trim(),
        targetMinor: monthlyTargetTotal(monthlyMinor, months),
        monthlyPlanMinor: monthlyMinor,
        durationMonths: months,
        targetDate: null,
        createdAt: new Date().toISOString(),
      });
      router.replace(`/savings/${id}`);
    } catch {
      setErrors({ form: 'Could not create this goal.' });
      setSaving(false);
    }
  }

  return (
    <Screen>
      <FormHeader title="Monthly Saving Target" onBack={() => router.back()} />
      <Text style={note}>The monthly amount is a plan. It is not saved until you record a contribution.</Text>
      <TextField label="Savings name" value={name} onChangeText={setName} error={errors.name} placeholder="Monthly savings" />
      <AmountField label="Monthly amount" value={monthly} onChangeText={setMonthly} error={errors.monthly} />
      <TextField label="Duration in months (optional)" value={duration} onChangeText={setDuration} error={errors.duration} placeholder="Leave blank to keep it ongoing" />
      {errors.form ? <Text style={{ color: colors.danger }}>{errors.form}</Text> : null}
      <PrimaryButton label={saving ? 'Saving…' : 'Create Saving'} onPress={() => void save()} disabled={saving} />
    </Screen>
  );
}

function parseMonths(value: string): number | null | 'invalid' {
  if (!value.trim()) return null;
  if (!/^\d{1,3}$/.test(value.trim())) return 'invalid';
  const months = Number(value);
  if (months < 1 || months > 120) return 'invalid';
  return months;
}

const note = { color: colors.textMuted, lineHeight: 20 };
