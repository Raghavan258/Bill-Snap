import { useState } from 'react';
import { Text } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { TextField } from '../../src/components/ui/Fields';
import { loginLocalUser } from '../../src/data/users';
import { validateLogin } from '../../src/domain/auth';
import { useSession } from '../../src/state/session';
import { colors, type as typeScale } from '../../src/theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const { user, setUser } = useSession();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (user) return <Redirect href="/" />;

  async function submit() {
    if (busy) return;
    const nextErrors = validateLogin({ mobile, password });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setBusy(true);
    setFormError(null);
    try {
      setUser(await loginLocalUser(mobile, password));
      router.replace('/');
    } catch {
      setFormError('That mobile number and password do not match an account on this phone.');
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Text style={{ color: colors.text, fontSize: typeScale.title, fontWeight: '800' }}>Sign in</Text>
      <Text style={{ color: colors.textMuted, lineHeight: 20 }}>
        This sign-in stays on this phone. Bill Snap does not send an SMS code and does not use a cloud account.
      </Text>
      <TextField label="Mobile number" value={mobile} onChangeText={setMobile} error={errors.mobile} keyboardType="phone-pad" />
      <TextField label="Password" value={password} onChangeText={setPassword} error={errors.password} secure />
      {formError ? <Text style={{ color: colors.danger }}>{formError}</Text> : null}
      <PrimaryButton label={busy ? 'Signing in…' : 'Sign in'} onPress={() => void submit()} disabled={busy} />
      <PrimaryButton label="Create an account" onPress={() => router.push('/auth/register')} />
    </Screen>
  );
}
