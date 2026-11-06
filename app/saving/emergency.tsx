import { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { AmountField, TextField } from '../../src/components/ui/Fields';
import { parseUserAmount } from '../../src/domain/money';
import { validateSavingsGoal } from '../../src/domain/validation';
import { insertGoal } from '../../src/data/savings';
import { colors } from '../../src/theme/tokens';

export default function EmergencyFundScreen() {
  const router = useRouter();
  const [name, setName] = useState('Emergency Fund');
  const [target, setTarget] = useState('');
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
        kind: 'emergency',
        name: name.trim(),
        targetMinor,
        monthlyPlanMinor: monthlyMinor,
        durationMonths: null,
        targetDate: null,
        createdAt: new Date().toISOString(),
      });
      router.replace(`/savings/${id}`);
    } catch {
      setErrors({ form: 'Could not create this fund.' });
      setSaving(false);
    }
  }

  return (
    <Screen>
      <FormHeader title="Emergency Fund" onBack={() => router.back()} />
      <Text style={{ color: colors.textMuted, lineHeight: 20 }}>
        Set the reserve you want. A planned monthly amount is not counted as saved.
      </Text>
      <TextField label="Name" value={name} onChangeText={setName} error={errors.name} />
      <AmountField label="Target amount" value={target} onChangeText={setTarget} error={errors.target} />
      <AmountField label="Planned monthly contribution (optional)" value={monthly} onChangeText={setMonthly} error={errors.monthly} />
      {errors.form ? <Text style={{ color: colors.danger }}>{errors.form}</Text> : null}
      <PrimaryButton label={saving ? 'Saving…' : 'Create Emergency Fund'} onPress={() => void save()} disabled={saving} />
    </Screen>
  );
}
