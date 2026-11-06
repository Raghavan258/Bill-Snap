import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AmountField } from '../ui/Fields';
import { PrimaryButton } from '../ui/PrimaryButton';
import { clearBudget, saveBudget } from '../../data/budgets';
import { budgetStatus } from '../../domain/budgets';
import { formatMinor, minorToInput, parseUserAmount } from '../../domain/money';
import { colors, radius, space, type as typeScale } from '../../theme/tokens';

/** Edits one monthly limit. Saving it does not create an expense. */
export function CategoryLimit({
  category,
  spentMinor,
  limitMinor,
  onChanged,
}: {
  category: string;
  spentMinor: number;
  limitMinor: number | null;
  onChanged: () => void;
}) {
  const [value, setValue] = useState(limitMinor === null ? '' : minorToInput(limitMinor));
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const editor = { setError, setBusy, onChanged };
  const status = budgetStatus(spentMinor, limitMinor);

  useEffect(() => {
    setValue(limitMinor === null ? '' : minorToInput(limitMinor));
  }, [limitMinor]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{category}</Text>
      <Text style={styles.note}>{spentCopy(spentMinor, status.remainingMinor, status.overMinor)}</Text>
      <AmountField label={`${category} monthly limit`} value={value} onChangeText={setValue} error={error} hint="This limit is not subtracted from surplus." />
      <PrimaryButton label={busy ? 'Saving…' : 'Save limit'} disabled={busy} onPress={() => void persistLimit(category, value, editor)} />
      {limitMinor === null ? null : (
        <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${category} limit`} onPress={() => void removeLimit(category, editor)} style={styles.clear}>
          <Text style={styles.clearLabel}>Remove limit</Text>
        </Pressable>
      )}
    </View>
  );
}

type Editor = {
  setError: (value: string | undefined) => void;
  setBusy: (value: boolean) => void;
  onChanged: () => void;
};

async function persistLimit(category: string, value: string, editor: Editor): Promise<void> {
  const minor = parseUserAmount(value);
  if (minor === null) {
    editor.setError('Enter an amount greater than zero.');
    return;
  }
  await runChange(editor, () => saveBudget(category, minor));
}

async function removeLimit(category: string, editor: Editor): Promise<void> {
  await runChange(editor, () => clearBudget(category));
}

async function runChange(editor: Editor, action: () => Promise<void>): Promise<void> {
  editor.setBusy(true);
  editor.setError(undefined);
  try {
    await action();
    editor.onChanged();
  } catch {
    editor.setError('Could not update this limit.');
  } finally {
    editor.setBusy(false);
  }
}

function spentCopy(spentMinor: number, remainingMinor: number | null, overMinor: number): string {
  const spent = `${formatMinor(spentMinor)} recorded this month`;
  if (remainingMinor === null) return spent;
  if (overMinor > 0) return `${spent} · ${formatMinor(overMinor)} over the limit`;
  return `${spent} · ${formatMinor(remainingMinor)} remaining`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
  },
  title: { color: colors.text, fontWeight: '700', fontSize: typeScale.body },
  note: { color: colors.textMuted, lineHeight: 20 },
  clear: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  clearLabel: { color: colors.danger, fontWeight: '700' },
});
