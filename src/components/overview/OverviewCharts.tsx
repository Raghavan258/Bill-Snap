import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ChartCard, ColumnChart, HorizontalBars, Legend, ProgressMeter } from '../charts/Charts';
import { ExpenseDonut } from '../charts/Donut';
import { EmptyNote } from '../ui/RecordRow';
import {
  dailyExpenseBars,
  hasAmount,
  hasMonthActivity,
  spendingByCategory,
  type DatedAmount,
  type LabelledMonth,
} from '../../domain/analytics';
import { budgetStatus } from '../../domain/budgets';
import { formatMinor } from '../../domain/money';
import { goalProgress } from '../../domain/savings';
import type { BudgetRow } from '../../data/budgets';
import type { ExpenseRow, GoalRow } from '../../data/types';
import { colors, space, type as typeScale } from '../../theme/tokens';

const MONTH_SERIES = [
  { label: 'Income', color: colors.text },
  { label: 'Expenses', color: colors.accent },
];
const SPEND_SERIES = [{ label: 'Expenses', color: colors.accent }];

/** Charts for one selected month plus the recorded months that lead up to it. */
export function OverviewCharts({
  year,
  monthIndex,
  expenses,
  series,
  goals,
  budgets,
}: {
  year: number;
  monthIndex: number;
  expenses: ExpenseRow[];
  series: LabelledMonth[];
  goals: GoalRow[];
  budgets: BudgetRow[];
}) {
  const records = expenses.map(toDated);
  return (
    <>
      <ExpenseDonutCard expenses={expenses} />
      <IncomeExpenseChart series={series} />
      <CategoryChart records={records} budgets={budgets} />
      <DailyChart year={year} monthIndex={monthIndex} records={records} />
      <SavingsChart goals={goals} />
    </>
  );
}

function ExpenseDonutCard({ expenses }: { expenses: ExpenseRow[] }) {
  const router = useRouter();
  return (
    <ChartCard title="Expense breakdown" caption="Recorded expenses for the selected month. Income and savings are not included.">
      {expenses.length === 0 ? <EmptyNote text="No expenses recorded in this month." /> : (
        <ExpenseDonut
          records={expenses.map((expense) => ({ category: expense.category, amountMinor: expense.amount_minor }))}
          onSelect={(category) => router.push({ pathname: '/history', params: { category, kind: 'expense' } })}
        />
      )}
    </ChartCard>
  );
}

function IncomeExpenseChart({ series }: { series: LabelledMonth[] }) {
  return (
    <ChartCard title="Income vs expenses" caption="Recorded totals only. A month with no records is ₹0. Unpaid recurring items are excluded.">
      {hasMonthActivity(series) ? (
        <>
          <Legend series={MONTH_SERIES} />
          <ColumnChart
            groups={series.map((month) => ({ label: month.label, values: [month.incomeMinor, month.expenseMinor] }))}
            series={MONTH_SERIES}
          />
        </>
      ) : (
        <EmptyNote text="No income or expenses recorded in these months." />
      )}
    </ChartCard>
  );
}

function CategoryChart({ records, budgets }: { records: DatedAmount[]; budgets: BudgetRow[] }) {
  const categories = spendingByCategory(records.map((record) => ({ category: record.category ?? 'Uncategorised', amountMinor: record.amountMinor })));
  return (
    <ChartCard title="Spending by category" caption="Shares use this month's recorded expenses. Savings contributions are not included.">
      {categories.length === 0 ? <EmptyNote text="No expenses recorded in this month." /> : (
        <HorizontalBars items={categories.map((item) => ({
          label: item.category,
          minor: item.minor,
          detail: budgetDetail(item.minor, budgets.find((budget) => budget.category === item.category)?.limitMinor ?? null),
        }))} />
      )}
    </ChartCard>
  );
}

function DailyChart({ year, monthIndex, records }: { year: number; monthIndex: number; records: DatedAmount[] }) {
  const days = dailyExpenseBars(year, monthIndex, records);
  return (
    <ChartCard title="Daily spending" caption="Each bar is spending recorded on that day.">
      {hasAmount(days) ? <ColumnChart groups={days.map((day) => ({ label: day.label, values: [day.minor] }))} series={SPEND_SERIES} /> : (
        <EmptyNote text="No dated expenses recorded in this month." />
      )}
    </ChartCard>
  );
}

function SavingsChart({ goals }: { goals: GoalRow[] }) {
  const router = useRouter();
  return (
    <ChartCard title="Savings progress" caption="Progress uses contributions you recorded. It is not taken from surplus.">
      {goals.length === 0 ? <EmptyNote text="No savings goals yet. Start one from Home." /> : goals.map((goal) => {
        const progress = goalProgress(goal.saved_minor, goal.target_minor);
        return (
          <Pressable key={goal.id} accessibilityRole="button" accessibilityLabel={goal.name} onPress={() => router.push(`/savings/${goal.id}`)}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>{goal.name}</Text>
            <Text style={{ color: colors.textMuted, fontSize: typeScale.caption, marginBottom: space.xs }}>{savingsCaption(progress.savedMinor, progress.targetMinor, progress.remainingMinor)}</Text>
            {progress.ratio === null ? null : <ProgressMeter ratio={progress.ratio} label={`${goal.name} progress`} />}
          </Pressable>
        );
      })}
    </ChartCard>
  );
}

function budgetDetail(spentMinor: number, limitMinor: number | null): string | undefined {
  const status = budgetStatus(spentMinor, limitMinor);
  if (status.limitMinor === null) return undefined;
  if (status.overMinor > 0) return `${formatMinor(status.overMinor)} over the ${formatMinor(status.limitMinor)} limit`;
  return `${formatMinor(status.remainingMinor ?? 0)} left of the ${formatMinor(status.limitMinor)} limit`;
}

function savingsCaption(savedMinor: number, targetMinor: number | null, remainingMinor: number | null): string {
  if (targetMinor === null || remainingMinor === null) return `${formatMinor(savedMinor)} recorded. No target set.`;
  return `${formatMinor(savedMinor)} of ${formatMinor(targetMinor)} · ${formatMinor(remainingMinor)} remaining`;
}

function toDated(expense: ExpenseRow): DatedAmount {
  return { amountMinor: expense.amount_minor, date: expense.transaction_date, category: expense.category };
}
