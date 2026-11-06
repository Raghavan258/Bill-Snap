import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { TextField } from '../../src/components/ui/Fields';
import { EmptyNote, RecordRow } from '../../src/components/ui/RecordRow';
import { listExpenses } from '../../src/data/expenses';
import { listIncome } from '../../src/data/income';
import { filterLedger, type LedgerEntry, type LedgerKind } from '../../src/domain/ledger';
import { formatDisplayDate } from '../../src/domain/display';
import { formatMinor } from '../../src/domain/money';
import { colors, space } from '../../src/theme/tokens';

export default function HistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; kind?: string }>();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [text, setText] = useState('');
  const [kind, setKind] = useState<LedgerKind>(params.kind === 'income' || params.kind === 'expense' ? params.kind : 'all');
  const [category, setCategory] = useState(typeof params.category === 'string' ? params.category : '');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [failed, setFailed] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    Promise.all([listExpenses(), listIncome()]).then(([expenses, income]) => {
      if (!active) return;
      setEntries([...expenses.map(expenseEntry), ...income.map(incomeEntry)]);
      setFailed(false);
    }).catch(() => {
      if (active) setFailed(true);
    });
    return () => {
      active = false;
    };
  }, []));

  const visible = filterLedger(entries, { text, kind, category, from, to });
  const categories = uniqueCategories(entries);

  return (
    <Screen>
      <FormHeader title="Transactions" onBack={() => router.back()} />
      <Text style={{ color: colors.textMuted, lineHeight: 20 }}>
        Income and expenses you recorded. Scheduled income is not listed until you record it as received.
      </Text>
      <TextField label="Search" value={text} onChangeText={setText} placeholder="Name or merchant" />
      <ChoiceRow label="Type" value={kind} options={['all', 'income', 'expense']} onChange={(value) => setKind(value as LedgerKind)} />
      <ChoiceRow label="Category" value={category || 'All'} options={['All', ...categories]} onChange={(value) => setCategory(value === 'All' ? '' : value)} />
      <TextField label="From date" value={from} onChangeText={setFrom} placeholder="YYYY-MM-DD" />
      <TextField label="To date" value={to} onChangeText={setTo} placeholder="YYYY-MM-DD" />
      <PrimaryButton label="Add income" onPress={() => router.push('/income/once')} />
      {failed ? <Text style={{ color: colors.danger }}>Could not load transactions.</Text> : null}
      {visible.length === 0 ? <EmptyNote text="No transactions match." /> : null}
      <View style={{ gap: space.sm }}>
        {visible.map((entry) => (
          <RecordRow
            key={`${entry.kind}-${entry.id}`}
            title={entry.name}
            subtitle={`${entry.kind === 'income' ? 'Income' : 'Expense'} · ${entry.category} · ${formatDisplayDate(entry.date)}`}
            amount={formatMinor(entry.amountMinor)}
            tone={entry.kind}
            onPress={() => router.push(entry.kind === 'income' ? `/income/${entry.id}` : `/expense/${entry.id}`)}
          />
        ))}
      </View>
    </Screen>
  );
}

function ChoiceRow({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <View style={{ gap: space.xs }}>
      <Text style={{ color: colors.textMuted }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {options.map((option) => (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityLabel={`${label} ${option}`}
            accessibilityState={{ selected: option === value }}
            onPress={() => onChange(option)}
            style={{
              minHeight: 36,
              paddingHorizontal: space.md,
              borderRadius: 16,
              justifyContent: 'center',
              backgroundColor: option === value ? colors.accentSoft : colors.surface,
              borderWidth: 1,
              borderColor: option === value ? colors.accent : colors.border,
            }}
          >
            <Text style={{ color: colors.text }}>{option}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function expenseEntry(expense: { id: string; name: string; merchant: string | null; category: string; transaction_date: string | null; amount_minor: number }): LedgerEntry {
  return {
    id: expense.id,
    kind: 'expense',
    name: expense.name,
    merchant: expense.merchant,
    category: expense.category.trim() || 'Others',
    date: expense.transaction_date,
    amountMinor: expense.amount_minor,
  };
}

function incomeEntry(income: { id: string; name: string; category: string; received_on: string; amount_minor: number }): LedgerEntry {
  return {
    id: income.id,
    kind: 'income',
    name: income.name,
    merchant: null,
    category: income.category,
    date: income.received_on,
    amountMinor: income.amount_minor,
  };
}

function uniqueCategories(entries: LedgerEntry[]): string[] {
  return [...new Set(entries.map((entry) => entry.category))].sort();
}
