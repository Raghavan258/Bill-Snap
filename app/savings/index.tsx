import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { FormHeader } from '../../src/components/ui/FormHeader';
import { EmptyNote, RecordRow } from '../../src/components/ui/RecordRow';
import { listGoals } from '../../src/data/savings';
import type { GoalRow } from '../../src/data/types';
import { formatMinor } from '../../src/domain/money';
import { goalProgress } from '../../src/domain/savings';
import { colors, space } from '../../src/theme/tokens';

export default function SavingsListScreen() {
  const router = useRouter();
  const [goals, setGoals] = useState<GoalRow[]>([]);

  useFocusEffect(useCallback(() => {
    let active = true;
    listGoals().then((rows) => {
      if (active) setGoals(rows);
    }).catch(() => {
      if (active) setGoals([]);
    });
    return () => {
      active = false;
    };
  }, []));

  return (
    <Screen>
      <FormHeader title="Savings" onBack={() => router.back()} />
      <Text style={{ color: colors.textMuted, lineHeight: 20 }}>
        Saved amounts are contributions you recorded. Surplus is not treated as savings.
      </Text>
      {goals.length === 0 ? <EmptyNote text="No savings goals yet. Start one from Home." /> : null}
      <View style={{ gap: space.sm }}>
        {goals.map((goal) => {
          const progress = goalProgress(goal.saved_minor, goal.target_minor);
          const subtitle = progress.remainingMinor === null
            ? `Saved ${formatMinor(goal.saved_minor)}`
            : `${formatMinor(goal.saved_minor)} saved · ${formatMinor(progress.remainingMinor)} remaining`;
          return (
            <RecordRow
              key={goal.id}
              title={goal.name}
              subtitle={subtitle}
              amount={goal.target_minor ? formatMinor(goal.target_minor) : 'Ongoing'}
              onPress={() => router.push(`/savings/${goal.id}`)}
            />
          );
        })}
      </View>
    </Screen>
  );
}
