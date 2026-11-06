import { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { TextField } from '../../src/components/ui/Fields';
import { registerLocalUser } from '../../src/data/users';
import { validateRegistration } from '../../src/domain/auth';
import { useSession } from '../../src/state/session';
import { colors } from '../../src/theme/tokens';

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser } = useSession();
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    const nextErrors = validateRegistration({ fullName, mobile, password, confirmPassword });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setBusy(true);
    setFormError(null);
    try {
      setUser(await registerLocalUser({ fullName, mobile, password }));
      router.replace('/');
    } catch (error) {
      setFormError(error instanceof Error && error.message === 'mobile-taken'
        ? 'That mobile number is already registered on this phone.'
        : 'Could not create the account. Try again.');
      setBusy(false);
    }
  }

  return (
    <Screen>
      <FormHeader title="Create account" onBack={() => router.back()} />
      <Text style={{ color: colors.textMuted, lineHeight: 20 }}>
        Your name and password stay on this device. This is not phone verification.
      </Text>
      <TextField label="Full name" value={fullName} onChangeText={setFullName} error={errors.fullName} />
      <TextField label="Mobile number" value={mobile} onChangeText={setMobile} error={errors.mobile} keyboardType="phone-pad" />
      <TextField label="Password" value={password} onChangeText={setPassword} error={errors.password} secure />
      <TextField label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} error={errors.confirmPassword} secure />
      {formError ? <Text style={{ color: colors.danger }}>{formError}</Text> : null}
      <PrimaryButton label={busy ? 'Creating…' : 'Create account'} onPress={() => void submit()} disabled={busy} />
    </Screen>
  );
}
