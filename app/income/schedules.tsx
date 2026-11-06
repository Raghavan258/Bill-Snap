import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { EmptyNote } from '../../src/components/ui/RecordRow';
import { deleteIncomeSchedule, listIncomeSchedules } from '../../src/data/income';
import type { IncomeScheduleRow } from '../../src/data/types';
import { frequencyLabel, isFrequency } from '../../src/domain/categories';
import { formatMinor, minorToInput } from '../../src/domain/money';
import { colors, radius, space } from '../../src/theme/tokens';

export default function IncomeSchedulesScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<IncomeScheduleRow[]>([]);
  const [failed, setFailed] = useState(false);

  const reload = useCallback(() => {
    listIncomeSchedules().then((schedules) => {
      setRows(schedules);
      setFailed(false);
    }).catch(() => setFailed(true));
  }, []);

  useFocusEffect(useCallback(() => {
    reload();
  }, [reload]));

  return (
    <Screen>
      <FormHeader title="Recurring Income" onBack={() => router.back()} />
      <Text style={{ color: colors.textMuted, lineHeight: 20 }}>
        These are expected payments. Deleting one does not remove income you already recorded.
      </Text>
      {failed ? <Text style={{ color: colors.danger }}>Could not load schedules.</Text> : null}
      {rows.length === 0 ? <EmptyNote text="No recurring income yet." /> : null}
      <View style={{ gap: space.sm }}>
        {rows.map((schedule) => (
          <ScheduleCard
            key={schedule.id}
            schedule={schedule}
            onRecord={() => router.push({
              pathname: '/income/once',
              params: {
                name: schedule.name,
                amount: minorToInput(schedule.amount_minor),
                category: schedule.category,
                scheduleId: schedule.id,
              },
            })}
            onEdit={() => router.push({ pathname: '/income/recurring', params: { id: schedule.id } })}
            onDelete={() => confirmDelete(schedule, reload)}
          />
        ))}
      </View>
      <PrimaryButton label="Add recurring income" onPress={() => router.push('/income/recurring')} />
    </Screen>
  );
}

function ScheduleCard({ schedule, onRecord, onEdit, onDelete }: {
  schedule: IncomeScheduleRow;
  onRecord: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const frequency = isFrequency(schedule.frequency) ? frequencyLabel(schedule.frequency) : schedule.frequency;
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: space.md, gap: space.sm }}>
      <Text style={{ color: colors.text, fontWeight: '700' }}>{schedule.name}</Text>
      <Text style={{ color: colors.text }}>{formatMinor(schedule.amount_minor)}</Text>
      <Text style={{ color: colors.textMuted }}>{frequency} · {schedule.category}</Text>
      <Text style={{ color: colors.warning }}>Expected — not received</Text>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <TextButton label="Record received" onPress={onRecord} />
        <TextButton label="Edit" onPress={onEdit} />
        <TextButton label="Delete" onPress={onDelete} />
      </View>
    </View>
  );
}

function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ minHeight: 44, justifyContent: 'center' }}>
      <Text style={{ color: colors.cta, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

function confirmDelete(schedule: IncomeScheduleRow, reload: () => void): void {
  Alert.alert(`Delete ${schedule.name}?`, 'This removes the schedule only. Income already recorded from it stays in your history.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Confirm Delete',
      style: 'destructive',
      onPress: () => {
        deleteIncomeSchedule(schedule.id).then(reload).catch(() => Alert.alert('Could not delete', 'Try again.'));
      },
    },
  ]);
}
