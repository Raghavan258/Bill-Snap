import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../src/domain/categories';
import { colors, radius, space, type as typeScale } from '../../src/theme/tokens';

export default function CategoriesScreen() {
  const router = useRouter();
  return (
    <Screen>
      <FormHeader title="Categories" onBack={() => router.back()} />
      <Text style={styles.note}>
        These are the categories saved on records. Scanned bills use Food, Utilities, and Groceries so a receipt is not given a made-up category.
      </Text>
      <CategoryGroup title="Expenses" items={EXPENSE_CATEGORIES} />
      <CategoryGroup title="Income" items={INCOME_CATEGORIES} />
    </Screen>
  );
}

function CategoryGroup({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <View style={styles.group}>
      <Text style={styles.heading}>{title}</Text>
      {items.map((item) => (
        <Text key={item} style={styles.item}>{item}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  note: { color: colors.textMuted, lineHeight: 20 },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
  },
  heading: { color: colors.text, fontWeight: '700', fontSize: typeScale.body },
  item: { color: colors.textMuted, fontSize: typeScale.body },
});
