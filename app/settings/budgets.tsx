import { useCallback, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { CategoryLimit } from '../../src/components/manage/CategoryLimit';
import { listBudgets, type BudgetRow } from '../../src/data/budgets';
import { expensesBetween } from '../../src/data/expenses';
import { spendingByCategory } from '../../src/domain/analytics';
import { EXPENSE_CATEGORIES } from '../../src/domain/categories';
import { monthRange } from '../../src/domain/dates';
import { colors, type as typeScale } from '../../src/theme/tokens';

export default function BudgetsScreen() {
  const router = useRouter();
  const today = new Date();
  const year = today.getFullYear();
  const monthIndex = today.getMonth();
  const [version, setVersion] = useState(0);
  const { budgets, spent, failed } = useBudgetData(year, monthIndex, version);

  return (
    <Screen>
      <FormHeader title="Budgets" onBack={() => router.back()} />
      <Text style={styles.note}>
        A limit applies to this month’s recorded expenses. It is not an expense, and unpaid recurring rules are not counted.
      </Text>
      {failed ? <Text style={styles.error}>Could not load budgets.</Text> : null}
      {EXPENSE_CATEGORIES.map((category) => (
        <CategoryLimit
          key={category}
          category={category}
          spentMinor={spent[category] ?? 0}
          limitMinor={budgets.find((budget) => budget.category === category)?.limitMinor ?? null}
          onChanged={() => setVersion((current) => current + 1)}
        />
      ))}
    </Screen>
  );
}

function useBudgetData(year: number, monthIndex: number, version: number) {
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [spent, setSpent] = useState<Record<string, number>>({});
  const [failed, setFailed] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    loadBudgetScreen(year, monthIndex)
      .then((next) => {
        if (!active) return;
        setBudgets(next.budgets);
        setSpent(next.spent);
        setFailed(false);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [version, year, monthIndex]));

  return { budgets, spent, failed };
}

async function loadBudgetScreen(year: number, monthIndex: number) {
  const range = monthRange(year, monthIndex);
  const [budgets, expenses] = await Promise.all([
    listBudgets(),
    expensesBetween(range.start, range.end),
  ]);
  const spent = Object.fromEntries(
    spendingByCategory(expenses.map((expense) => ({ category: expense.category, amountMinor: expense.amount_minor })))
      .map((item) => [item.category, item.minor]),
  );
  return { budgets, spent };
}

const styles = StyleSheet.create({
  note: { color: colors.textMuted, lineHeight: 22, fontSize: typeScale.body },
  error: { color: colors.danger },
});
