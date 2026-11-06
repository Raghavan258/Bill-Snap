import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, type as typeScale } from '../../theme/tokens';

type Props = {
  title: string;
  subtitle: string;
  amount: string;
  onPress: () => void;
  tone?: 'income' | 'expense';
};

export function RecordRow({ title, subtitle, amount, onPress, tone }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${amount}`}
      onPress={onPress}
      style={[styles.row, tone === 'income' && styles.income]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Text style={[styles.amount, tone === 'income' && styles.incomeAmount]}>{amount}</Text>
    </Pressable>
  );
}

export function EmptyNote({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

const styles = StyleSheet.create({
  row: {
    minHeight: 68,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  title: { color: colors.text, fontSize: typeScale.body, fontWeight: '700' },
  subtitle: { color: colors.textMuted, marginTop: 2 },
  amount: { color: colors.text, fontWeight: '700' },
  income: { borderColor: colors.accent },
  incomeAmount: { color: colors.cta },
  empty: { color: colors.textMuted, lineHeight: 22 },
});
