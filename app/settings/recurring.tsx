import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { SettingsRow } from '../../src/components/manage/SettingsRow';
import { colors, space } from '../../src/theme/tokens';

export default function RecurringRulesScreen() {
  const router = useRouter();
  return (
    <Screen>
      <FormHeader title="Recurring Rules" onBack={() => router.back()} />
      <Text style={styles.note}>
        A rule is a reminder. It is not income received and it is not spending until you record the payment or receipt.
      </Text>
      <View style={styles.list}>
        <SettingsRow
          icon="repeat"
          title="Expense rules"
          body="Commitments you mark as paid yourself"
          onPress={() => router.push('/recurring')}
        />
        <SettingsRow
          icon="calendar-outline"
          title="Income rules"
          body="Expected income, separate from money received"
          onPress={() => router.push('/income/schedules')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { color: colors.textMuted, lineHeight: 20 },
  list: { gap: space.md },
});
