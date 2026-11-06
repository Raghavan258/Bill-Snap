import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { colors, type as typeScale } from '../../src/theme/tokens';

const POINTS = [
  'Amounts are shown in Indian rupees. They are stored in paise.',
  'Surplus is recorded income minus recorded expenses. It is not a bank balance.',
  'Savings contributions stay separate from expenses.',
  'Charts ignore unpaid recurring rules and expected income that you have not recorded.',
  'Forecasts on Home are estimates. Closed months show the recorded total.',
];

export default function PreferencesScreen() {
  const router = useRouter();
  return (
    <Screen>
      <FormHeader title="Preferences" onBack={() => router.back()} />
      <Text style={styles.note}>These rules are fixed so the figures stay consistent. Bill Snap does not read SMS or sync a bank.</Text>
      {POINTS.map((point) => (
        <Text key={point} style={styles.point}>{point}</Text>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { color: colors.textMuted, lineHeight: 22, fontSize: typeScale.body },
  point: { color: colors.text, lineHeight: 22, fontSize: typeScale.body },
});
