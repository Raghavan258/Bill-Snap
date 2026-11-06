import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/ui/Screen';
import { FormHeader } from '../src/components/ui/FormHeader';
import { EmptyNote } from '../src/components/ui/RecordRow';
import { useMonthSnapshot } from '../src/data/useMonthSnapshot';
import { formatDisplayDate, formatMonth, shiftMonth } from '../src/domain/display';
import { formatMinor } from '../src/domain/money';
import { colors, space, type as typeScale } from '../src/theme/tokens';
import { Pressable } from 'react-native';

export default function TrackerScreen() {
  const router = useRouter();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), monthIndex: now.getMonth() });
  const { data } = useMonthSnapshot(cursor.year, cursor.monthIndex);
  const days = groupExpenses(data?.expenses ?? []);

  return (
    <Screen>
      <FormHeader title="Monthly Tracker" onBack={() => router.back()} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => setCursor((current) => shiftMonth(current.year, current.monthIndex, -1))}>
          <Text style={styles.link}>Previous</Text>
        </Pressable>
        <Text style={styles.month}>{formatMonth(cursor.year, cursor.monthIndex)}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => setCursor((current) => shiftMonth(current.year, current.monthIndex, 1))}>
          <Text style={styles.link}>Next</Text>
        </Pressable>
      </View>
      <Text style={styles.note}>Each day shows recorded expenses. Days with no spending are omitted.</Text>
      {days.length === 0 ? <EmptyNote text="No dated expenses in this month." /> : null}
      <View style={{ gap: space.sm }}>
        {days.map((day) => (
          <View key={day.date} style={styles.row}>
            <Text style={styles.day}>{formatDisplayDate(day.date)}</Text>
            <Text style={styles.amount}>{formatMinor(day.total)}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

function groupExpenses(rows: { transaction_date: string | null; amount_minor: number }[]): { date: string; total: number }[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (!row.transaction_date) continue;
    totals.set(row.transaction_date, (totals.get(row.transaction_date) ?? 0) + row.amount_minor);
  }
  return [...totals.entries()]
    .map(([date, total]) => ({ date, total }))
    .sort((left, right) => (left.date < right.date ? 1 : -1));
}

const styles = {
  month: { color: colors.text, fontWeight: '700' as const },
  link: { color: colors.cta, fontWeight: '700' as const, padding: space.sm },
  note: { color: colors.textMuted, lineHeight: 20 },
  row: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, paddingVertical: space.sm },
  day: { color: colors.text },
  amount: { color: colors.text, fontWeight: '700' as const, fontSize: typeScale.body },
};
