import { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { AmountField, DateField, TextField } from '../../src/components/ui/Fields';
import { parseUserAmount } from '../../src/domain/money';
import { validateSavingsGoal } from '../../src/domain/validation';
import { insertGoal } from '../../src/data/savings';
import { colors } from '../../src/theme/tokens';

export default function NextBuyScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [date, setDate] = useState('');
  const [monthly, setMonthly] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    const nextErrors = validateSavingsGoal({ name, target, monthly, requireTarget: true, requireMonthly: false });
    setErrors(nextErrors);
    const targetMinor = parseUserAmount(target);
    const monthlyMinor = monthly.trim() ? parseUserAmount(monthly) : null;
    if (Object.keys(nextErrors).length > 0 || targetMinor === null) return;
    setSaving(true);
    try {
      const id = Crypto.randomUUID();
      await insertGoal({
        id,
        kind: 'purchase',
        name: name.trim(),
        targetMinor,
        monthlyPlanMinor: monthlyMinor,
        durationMonths: null,
        targetDate: date.trim() || null,
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
      <FormHeader title="My Next Buy" onBack={() => router.back()} />
      <Text style={{ color: colors.textMuted, lineHeight: 20 }}>
        Save toward a specific purchase. Progress comes only from contributions you record.
      </Text>
      <TextField label="Goal name" value={name} onChangeText={setName} error={errors.name} placeholder="Laptop, trip, course" />
      <AmountField label="Target amount" value={target} onChangeText={setTarget} error={errors.target} />
      <DateField label="Target date (optional)" value={date} onChange={setDate} />
      <AmountField label="Planned monthly contribution (optional)" value={monthly} onChangeText={setMonthly} error={errors.monthly} />
      {errors.form ? <Text style={{ color: colors.danger }}>{errors.form}</Text> : null}
      <PrimaryButton label={saving ? 'Saving…' : 'Create Goal'} onPress={() => void save()} disabled={saving} />
    </Screen>
  );
}
