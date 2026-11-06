import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatMinor } from '../../domain/money';
import { formatMonth } from '../../domain/display';
import type { MonthSnapshot } from '../../data/snapshot';
import { colors, hit, radius, space, type as typeScale } from '../../theme/tokens';

export function HomeHeader({ name, onSignOut }: { name: string; onSignOut: () => void }) {
  return (
    <View style={styles.header}>
      <Ionicons name="leaf" size={22} color={colors.cta} />
      <View style={{ flex: 1 }}>
        <Text style={styles.brand}>Bill Snap</Text>
        <Text style={styles.tag}>Signed in as {name}</Text>
      </View>
      <IconButton
        icon="notifications-outline"
        label="Notifications"
        onPress={() => Alert.alert('Notifications', 'There are no alerts. Bill Snap does not read SMS or bank messages.')}
      />
      <IconButton
        icon="person-outline"
        label="Account"
        onPress={() => Alert.alert(name, 'This is a local account on this phone. It is not phone verification or a cloud sign-in.', [
          { text: 'Close', style: 'cancel' },
          { text: 'Log out', style: 'destructive', onPress: onSignOut },
        ])}
      />
    </View>
  );
}

export function RecordExpenseButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Record expense" onPress={onPress} style={styles.record}>
      <Ionicons name="receipt-outline" size={28} color={colors.ctaText} />
      <Text style={styles.recordLabel}>Record Expense</Text>
      <Ionicons name="arrow-forward" size={20} color={colors.ctaText} />
    </Pressable>
  );
}

export function QuickActions({ onIncome, onSaving }: { onIncome: () => void; onSaving: () => void }) {
  return (
    <View style={styles.row}>
      <QuickCard icon="wallet-outline" label="Add Income" onPress={onIncome} />
      <QuickCard icon="layers-outline" label="Start Saving" onPress={onSaving} />
    </View>
  );
}

export function MonthCard({
  year,
  monthIndex,
  data,
  onPrevious,
  onNext,
}: {
  year: number;
  monthIndex: number;
  data: MonthSnapshot | null;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.monthRow}>
        <IconButton icon="chevron-back" label="Previous month" onPress={onPrevious} />
        <Text style={styles.month}>{formatMonth(year, monthIndex)}</Text>
        <IconButton icon="chevron-forward" label="Next month" onPress={onNext} />
      </View>
      <View style={styles.stats}>
        <View style={styles.half}>
          <Stat label="Income" value={formatMinor(data?.totals.incomeMinor ?? 0)} />
        </View>
        <View style={styles.half}>
          <Stat label="Expenses" value={formatMinor(data?.totals.expenseMinor ?? 0)} />
        </View>
      </View>
      <Stat label="Surplus" value={formatMinor(data?.totals.surplusMinor ?? 0)} />
      <Text style={styles.note}>Recorded income minus recorded expenses. This is not a bank balance.</Text>
      {data && data.expectedIncomeMinor > 0 ? (
        <Text style={styles.note}>
          Scheduled income of {formatMinor(data.expectedIncomeMinor)} is not included until you record it as received.
        </Text>
      ) : null}
    </View>
  );
}

export function DestinationGrid({ onOpen }: { onOpen: (path: string) => void }) {
  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <Destination icon="file-tray-full-outline" label="Receipt Vault" onPress={() => onOpen('/vault')} />
        <Destination icon="repeat" label="Recurring Expenses" onPress={() => onOpen('/recurring')} />
      </View>
      <View style={styles.row}>
        <Destination icon="wallet-outline" label="Savings" onPress={() => onOpen('/savings')} />
        <Destination icon="calendar-outline" label="Monthly Tracker" onPress={() => onOpen('/tracker')} />
      </View>
    </View>
  );
}

export function PredictionCard({ data }: { data: MonthSnapshot | null }) {
  const copy = predictionCopy(data);
  return (
    <View style={styles.card}>
      <View style={styles.predictTitle}>
        <Ionicons name="trending-up-outline" size={18} color={colors.cta} />
        <Text style={styles.destinationLabel}>{copy.title}</Text>
      </View>
      <Text style={styles.predictValue}>{copy.value}</Text>
      <Text style={styles.note}>{copy.body}</Text>
    </View>
  );
}

export function showPermissionHelp(kind: 'camera' | 'photos'): void {
  const message = kind === 'camera'
    ? 'Camera access is off. Enable it in Android settings to photograph a bill.'
    : 'Photo access is off. Enable it in Android settings to upload a bill.';
  Alert.alert('Permission needed', message, [
    { text: 'Not now', style: 'cancel' },
    { text: 'Open settings', onPress: () => void Linking.openSettings() },
  ]);
}

function predictionCopy(data: MonthSnapshot | null): { title: string; value: string; body: string } {
  if (!data) return { title: 'Estimated month-end expenses', value: '—', body: 'Loading recorded spending.' };
  if (!data.isCurrent) {
    return {
      title: 'Recorded expenses',
      value: formatMinor(data.totals.expenseMinor),
      body: 'This month is closed, so this is the recorded total rather than a forecast.',
    };
  }
  if (data.estimate?.estimateMinor == null) {
    return {
      title: 'Estimated month-end expenses',
      value: 'Not enough data',
      body: 'Record a few expenses before Bill Snap can project the rest of the month.',
    };
  }
  const scheduled = data.unpaidCommitmentsMinor > 0
    ? ` Scheduled commitments of ${formatMinor(data.unpaidCommitmentsMinor)} are not included.`
    : '';
  return {
    title: 'Estimated month-end expenses',
    value: formatMinor(data.estimate.estimateMinor),
    body: `Projected from this month's recorded spending pace. It is an estimate, not a guarantee.${scheduled}`,
  };
}

function IconButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.iconButton}>
      <Ionicons name={icon} size={20} color={colors.text} />
    </Pressable>
  );
}

function QuickCard({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.quick}>
      <Ionicons name={icon} size={18} color={colors.cta} />
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.figure} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{value}</Text>
    </View>
  );
}

function Destination({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.destination}>
      <Ionicons name={icon} size={18} color={colors.cta} />
      <Text style={styles.destinationLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  brand: { color: colors.text, fontSize: typeScale.heading, fontWeight: '700' },
  tag: { color: colors.textMuted, fontSize: typeScale.caption },
  iconButton: { width: hit.min, height: hit.min, alignItems: 'center', justifyContent: 'center' },
  record: {
    minHeight: 112,
    borderRadius: 36,
    backgroundColor: colors.cta,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.lg,
  },
  recordLabel: { color: colors.ctaText, fontSize: typeScale.heading, fontWeight: '800' },
  row: { flexDirection: 'row', gap: space.md },
  quick: {
    flex: 1,
    minHeight: hit.min + 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickLabel: { color: colors.text, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  month: { color: colors.text, fontWeight: '700' },
  stats: { flexDirection: 'row', gap: space.lg },
  half: { flex: 1 },
  stat: { gap: space.xs },
  statLabel: { color: colors.textMuted, fontSize: typeScale.label, fontWeight: '600' },
  figure: { color: colors.text, fontWeight: '800', fontSize: typeScale.title },
  note: { color: colors.textFaint, fontSize: typeScale.caption, lineHeight: 18 },
  grid: { gap: space.md },
  destination: {
    flex: 1,
    minHeight: 74,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    justifyContent: 'center',
    gap: 8,
  },
  destinationLabel: { color: colors.text, fontWeight: '700' },
  predictTitle: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  predictValue: { color: colors.text, fontSize: typeScale.heading, fontWeight: '800' },
});
