import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { colors, type as typeScale } from '../../src/theme/tokens';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  return (
    <Screen>
      <FormHeader title="Payment Methods" onBack={() => router.back()} />
      <Text style={styles.note}>
        Bill Snap stores the amount and category of an expense. It does not store a card, UPI id, or bank account, and it does not detect how you paid.
      </Text>
      <Text style={styles.note}>
        Totals stay the recorded amount. There is no payment-method list to add, because a label here would not be part of the expense.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { color: colors.textMuted, lineHeight: 22, fontSize: typeScale.body },
});
