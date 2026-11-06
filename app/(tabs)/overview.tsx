import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { RecordRow, EmptyNote } from '../../src/components/ui/RecordRow';
import { MonthCard } from '../../src/components/home/HomeSections';
import { OverviewCharts } from '../../src/components/overview/OverviewCharts';
import { useMonthSnapshot } from '../../src/data/useMonthSnapshot';
import { useOverviewExtras } from '../../src/data/useOverviewExtras';
import { shiftMonth } from '../../src/domain/display';
import { formatDisplayDate } from '../../src/domain/display';
import { formatMinor } from '../../src/domain/money';
import { colors, space, type as typeScale } from '../../src/theme/tokens';

export default function OverviewScreen() {
  const router = useRouter();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), monthIndex: now.getMonth() });
  const { data, failed } = useMonthSnapshot(cursor.year, cursor.monthIndex);
  const { extras, failed: extrasFailed } = useOverviewExtras(cursor.year, cursor.monthIndex);

  return (
    <Screen>
      <Text style={styles.title}>Overview</Text>
      <Text style={styles.note}>Figures below are recorded on this device. Surplus is not a bank balance, and savings are listed separately.</Text>
      <MonthCard
        year={cursor.year}
        monthIndex={cursor.monthIndex}
        data={data}
        onPrevious={() => setCursor((current) => shiftMonth(current.year, current.monthIndex, -1))}
        onNext={() => setCursor((current) => shiftMonth(current.year, current.monthIndex, 1))}
      />
      <Text style={styles.section}>Savings contributions this month</Text>
      <Text style={styles.value}>{data ? formatMinor(data.totals.savingsMinor) : '—'}</Text>
      <Text style={styles.note}>Only money you explicitly recorded as a contribution. It is not subtracted from surplus.</Text>
      {failed || extrasFailed ? <Text style={styles.error}>Could not load this month.</Text> : null}
      {data && extras ? (
        <OverviewCharts
          year={cursor.year}
          monthIndex={cursor.monthIndex}
          expenses={data.expenses}
          series={extras.series}
          goals={extras.goals}
          budgets={extras.budgets}
        />
      ) : null}
      <Text style={styles.section}>Expenses</Text>
      {data && data.expenses.length === 0 ? <EmptyNote text="No expenses recorded in this month." /> : null}
      <View style={styles.list}>
        {data?.expenses.map((expense) => (
          <RecordRow
            key={expense.id}
            title={expense.name}
            subtitle={`${expense.category} · ${formatDisplayDate(expense.transaction_date)}`}
            amount={formatMinor(expense.amount_minor)}
            onPress={() => router.push(`/expense/${expense.id}`)}
          />
        ))}
      </View>
      <Text style={styles.section}>Income received</Text>
      <Text style={styles.note}>Only money you have recorded as received. A schedule is not included.</Text>
      <View style={styles.links}>
        <Pressable accessibilityRole="button" accessibilityLabel="Add income" onPress={() => router.push('/income/once')}>
          <Text style={styles.link}>Add income</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Transaction history" onPress={() => router.push('/history')}>
          <Text style={styles.link}>Transaction history</Text>
        </Pressable>
      </View>
      {data && data.income.length === 0 ? <EmptyNote text="No income recorded in this month. A schedule is not received until you record it." /> : null}
      <View style={styles.list}>
        {data?.income.map((income) => (
          <RecordRow
            key={income.id}
            title={income.name}
            subtitle={`${income.category} · ${formatDisplayDate(income.received_on)}`}
            amount={formatMinor(income.amount_minor)}
            tone="income"
            onPress={() => router.push(`/income/${income.id}`)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = {
  title: { color: colors.text, fontSize: typeScale.title, fontWeight: '800' as const },
  section: { color: colors.text, fontSize: typeScale.heading, fontWeight: '700' as const, marginTop: space.sm },
  note: { color: colors.textMuted, lineHeight: 20 },
  value: { color: colors.text, fontSize: typeScale.heading, fontWeight: '800' as const },
  error: { color: colors.danger },
  list: { gap: space.sm },
  links: { flexDirection: 'row' as const, gap: space.lg },
  link: { color: colors.cta, fontWeight: '700' as const },
};
