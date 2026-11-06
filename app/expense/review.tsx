import { useState } from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { AmountField, DateField, SelectField, TextField } from '../../src/components/ui/Fields';
import { EXPENSE_CATEGORIES, isExpenseCategory } from '../../src/domain/categories';
import { minorToInput, parseUserAmount } from '../../src/domain/money';
import { validateReviewedExpense } from '../../src/domain/validation';
import { insertExpense } from '../../src/data/expenses';
import { savedExpenseFields } from '../../src/domain/reviewSave';
import { persistBillImage } from '../../src/media/images';
import { clearReviewDraft, getReviewDraft } from '../../src/state/reviewDraft';
import type { Confidence } from '../../src/pipeline/types';
import { colors, radius, type as typeScale } from '../../src/theme/tokens';

const OPTIONS = EXPENSE_CATEGORIES.map((category) => ({ label: category, value: category }));

export default function ReviewScreen() {
  const router = useRouter();
  const draft = getReviewDraft();
  const initial = initialReview(draft);
  const [merchant, setMerchant] = useState(initial.merchant);
  const [date, setDate] = useState(initial.date);
  const [amount, setAmount] = useState(initial.amount);
  const [category, setCategory] = useState(initial.category);
  const [notes, setNotes] = useState('');
  const [hints, setHints] = useState(initial.hints);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!draft) {
    return (
      <Screen>
        <FormHeader title="Review bill" onBack={() => router.back()} />
        <Text style={styles.body}>There is no bill waiting for review.</Text>
        <PrimaryButton label="Back to Home" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  async function save() {
    if (saving || !draft) return;
    const nextErrors = validateReviewedExpense({ merchant, amount, category, date, notes });
    setErrors(nextErrors);
    const amountMinor = parseUserAmount(amount);
    if (Object.keys(nextErrors).length > 0 || amountMinor === null || !isExpenseCategory(category)) return;
    setSaving(true);
    setFormError(null);
    try {
      const id = Crypto.randomUUID();
      const imageUri = await persistBillImage(draft.imageUri, id);
      const fields = savedExpenseFields({ merchant, date, amountMinor, category, notes });
      await insertExpense({
        id,
        ...fields,
        imageUri,
        source: draft.source,
        createdAt: new Date().toISOString(),
      });
      clearReviewDraft();
      router.replace(`/expense/${id}`);
    } catch {
      setFormError('Could not save this expense. Try again.');
      setSaving(false);
    }
  }

  return (
    <Screen>
      <FormHeader title="Review bill" onBack={() => router.back()} />
      <Image source={{ uri: draft.imageUri }} style={styles.image} resizeMode="contain" accessibilityLabel="Bill image" />
      <Text style={styles.body}>Check the reading before saving. Empty fields were not filled in for you.</Text>
      {draft.uncertain ? (
        <Text style={styles.error}>This image is not a clear receipt. Save it only after you check every field.</Text>
      ) : null}
      <TextField label="Merchant" value={merchant} onChangeText={(value) => edit('merchant', value, setMerchant)} error={errors.merchant} hint={hintFor(hints.merchant)} tone={toneFor(hints.merchant)} />
      <DateField label="Transaction date" value={date} onChange={(value) => edit('date', value, setDate)} error={errors.date} hint={hintFor(hints.date)} tone={toneFor(hints.date)} />
      <AmountField label="Total amount" value={amount} onChangeText={(value) => edit('amount', value, setAmount)} error={errors.amount} hint={hintFor(hints.amount)} tone={toneFor(hints.amount)} />
      <SelectField label="Category" value={category} options={OPTIONS} onChange={(value) => edit('category', value, setCategory)} error={errors.category} hint={hintFor(hints.category)} tone={toneFor(hints.category)} />
      <TextField label="Notes (optional)" value={notes} onChangeText={setNotes} error={errors.notes} multiline placeholder="Anything you want to remember" />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <PrimaryButton label={saving ? 'Saving…' : 'Save expense'} onPress={() => void save()} disabled={saving} />
    </Screen>
  );

  function edit(key: keyof typeof hints, value: string, update: (value: string) => void) {
    update(value);
    setHints((current) => ({ ...current, [key]: 'high' }));
  }
}

function initialReview(draft: ReturnType<typeof getReviewDraft>) {
  return {
    merchant: draft?.fields.merchant.value ?? '',
    date: draft?.fields.date.value ?? '',
    amount: draft?.fields.amountMinor.value != null ? minorToInput(draft.fields.amountMinor.value) : '',
    category: draft?.fields.category.value ?? '',
    hints: {
      merchant: draft?.fields.merchant.confidence ?? 'missing',
      date: draft?.fields.date.confidence ?? 'missing',
      amount: draft?.fields.amountMinor.confidence ?? 'missing',
      category: draft?.fields.category.confidence ?? 'missing',
    } satisfies Record<string, Confidence>,
  };
}

function hintFor(confidence: Confidence): string | undefined {
  if (confidence === 'missing') return 'Not found — please enter it';
  if (confidence === 'low') return 'Check this';
  return undefined;
}

function toneFor(confidence: Confidence): 'default' | 'warning' {
  return confidence === 'high' ? 'default' : 'warning';
}

const styles = StyleSheet.create({
  image: { width: '100%', height: 220, borderRadius: radius.md, backgroundColor: colors.surface },
  body: { color: colors.textMuted, fontSize: typeScale.body, lineHeight: 22 },
  error: { color: colors.danger },
});
