import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { formatDisplayDate } from '../../domain/display';
import { toIsoDate } from '../../domain/dates';
import { colors, hit, radius, space, type as typeScale } from '../../theme/tokens';

type Tone = 'default' | 'warning';

type TextProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  hint?: string;
  tone?: Tone;
  placeholder?: string;
  multiline?: boolean;
  secure?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad';
};

export function TextField({
  label,
  value,
  onChangeText,
  error,
  hint,
  tone = 'default',
  placeholder,
  multiline,
  secure,
  keyboardType,
}: TextProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        multiline={multiline}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize={secure || keyboardType ? 'none' : 'sentences'}
        style={[styles.input, multiline && styles.multiline, tone === 'warning' && styles.warning, error && styles.error]}
      />
      <FieldMessage error={error} hint={hint} />
    </View>
  );
}

export function AmountField({ label, value, onChangeText, error, hint, tone = 'default' }: Omit<TextProps, 'placeholder' | 'multiline'>) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.amount, tone === 'warning' && styles.warning, error && styles.error]}>
        <Text style={styles.rupee}>₹</Text>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.textFaint}
          style={styles.amountInput}
        />
      </View>
      <FieldMessage error={error} hint={hint} />
    </View>
  );
}

export function SelectField({ label, value, options, onChange, error, hint, tone = 'default', placeholder = 'Select' }: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  tone?: Tone;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        style={[styles.input, styles.select, tone === 'warning' && styles.warning, error && styles.error]}
      >
        <Text style={selected ? styles.value : styles.placeholder}>{selected?.label ?? placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      <FieldMessage error={error} hint={hint} />
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.menu}>
            {options.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                style={styles.choice}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <Text style={styles.value}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export function DateField({ label, value, onChange, error, hint, tone = 'default' }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  tone?: Tone;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        style={[styles.input, styles.select, tone === 'warning' && styles.warning, error && styles.error]}
      >
        <Text style={value ? styles.value : styles.placeholder}>{value ? formatDisplayDate(value) : 'Select date'}</Text>
        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
      </Pressable>
      <FieldMessage error={error} hint={hint} />
      {open ? (
        <DateTimePicker
          value={pickerDate(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selected) => onPick(event, selected, setOpen, onChange)}
        />
      ) : null}
    </View>
  );
}

function onPick(
  event: DateTimePickerEvent,
  selected: Date | undefined,
  setOpen: (open: boolean) => void,
  onChange: (value: string) => void,
): void {
  if (Platform.OS === 'android') setOpen(false);
  if (event.type === 'dismissed' || !selected) return;
  onChange(toIsoDate(selected));
  setOpen(false);
}

function pickerDate(value: string): Date {
  if (!value) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function FieldMessage({ error, hint }: { error?: string; hint?: string }) {
  if (error) return <Text style={styles.errorText}>{error}</Text>;
  if (hint) return <Text style={styles.hint}>{hint}</Text>;
  return null;
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: colors.textMuted, fontSize: typeScale.label },
  input: {
    minHeight: hit.min,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: space.md,
    fontSize: typeScale.body,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top', paddingTop: space.md },
  amount: {
    minHeight: hit.min,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    gap: space.sm,
  },
  amountInput: { flex: 1, color: colors.text, fontSize: typeScale.heading, fontWeight: '700', minHeight: hit.min },
  rupee: { color: colors.textMuted, fontSize: typeScale.heading },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  value: { color: colors.text, fontSize: typeScale.body },
  placeholder: { color: colors.textFaint, fontSize: typeScale.body },
  warning: { borderColor: colors.warning, backgroundColor: colors.warningSoft },
  error: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: typeScale.caption },
  hint: { color: colors.warning, fontSize: typeScale.caption },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  menu: {
    backgroundColor: colors.surface,
    padding: space.lg,
    gap: space.sm,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  choice: { minHeight: hit.min, justifyContent: 'center' },
});
