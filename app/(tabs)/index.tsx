import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { OptionSheet } from '../../src/components/ui/OptionSheet';
import {
  DestinationGrid,
  HomeHeader,
  MonthCard,
  PredictionCard,
  QuickActions,
  RecordExpenseButton,
  showPermissionHelp,
} from '../../src/components/home/HomeSections';
import { useMonthSnapshot } from '../../src/data/useMonthSnapshot';
import { shiftMonth } from '../../src/domain/display';
import { captureFromCamera, pickFromGallery } from '../../src/media/images';
import { useSession } from '../../src/state/session';
import { colors, type as typeScale } from '../../src/theme/tokens';
import { Text } from 'react-native';

type Sheet = 'expense' | 'income' | 'saving' | null;

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useSession();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), monthIndex: now.getMonth() });
  const [sheet, setSheet] = useState<Sheet>(null);
  const { data, failed } = useMonthSnapshot(cursor.year, cursor.monthIndex);

  async function chooseImage(kind: 'scan' | 'gallery') {
    setSheet(null);
    await wait(280);
    const result = kind === 'scan' ? await captureFromCamera() : await pickFromGallery();
    if (result.status === 'denied') showPermissionHelp(kind === 'scan' ? 'camera' : 'photos');
    if (result.status !== 'picked') return;
    router.push({ pathname: '/expense/process', params: { uri: result.uri, source: kind === 'scan' ? 'scan' : 'gallery' } });
  }

  return (
    <Screen>
      <HomeHeader
        name={user?.fullName ?? 'Local account'}
        onSignOut={() => { void signOut().then(() => router.replace('/auth/login')); }}
      />
      <RecordExpenseButton onPress={() => setSheet('expense')} />
      <QuickActions onIncome={() => setSheet('income')} onSaving={() => setSheet('saving')} />
      <MonthCard
        year={cursor.year}
        monthIndex={cursor.monthIndex}
        data={data}
        onPrevious={() => setCursor((current) => shiftMonth(current.year, current.monthIndex, -1))}
        onNext={() => setCursor((current) => shiftMonth(current.year, current.monthIndex, 1))}
      />
      {failed ? <Text style={{ color: colors.danger, fontSize: typeScale.caption }}>Could not load this month.</Text> : null}
      <DestinationGrid onOpen={(path) => router.push(path as never)} />
      <PredictionCard data={data} />
      <OptionSheet
        visible={sheet === 'expense'}
        title="Record Expense"
        body="Add a new expense in seconds"
        onClose={() => setSheet(null)}
        options={[
          { title: 'Scan a Bill', body: 'Capture and extract details automatically', icon: 'scan-outline', onPress: () => void chooseImage('scan') },
          { title: 'Upload from Gallery', body: 'Choose a bill or receipt from your device', icon: 'image-outline', onPress: () => void chooseImage('gallery') },
          { title: 'Add Manually', body: 'Enter the amount, category, and date', icon: 'create-outline', onPress: () => { setSheet(null); router.push('/expense/manual'); } },
        ]}
      />
      <OptionSheet
        visible={sheet === 'income'}
        title="Add Income"
        body="Choose the type of income you want to add"
        onClose={() => setSheet(null)}
        options={[
          { title: 'Recurring Income', body: 'Income you receive regularly, such as salary, rent, or pension', icon: 'calendar-outline', onPress: () => open('/income/recurring') },
          { title: 'One-time Income', body: 'Money received occasionally, such as a bonus, freelance payment, or gift', icon: 'cash-outline', onPress: () => open('/income/once') },
        ]}
      />
      <OptionSheet
        visible={sheet === 'saving'}
        title="Start Saving"
        body="Choose a savings goal that fits your need"
        onClose={() => setSheet(null)}
        options={[
          { title: 'Monthly Saving Target', body: 'Save a fixed amount every month', icon: 'calendar-outline', onPress: () => open('/saving/monthly') },
          { title: 'Emergency Fund', body: 'Build a safety net for unexpected expenses', icon: 'shield-checkmark-outline', onPress: () => open('/saving/emergency') },
          { title: 'My Next Buy', body: 'Save for something you plan to buy', icon: 'bag-handle-outline', onPress: () => open('/saving/purchase') },
        ]}
      />
    </Screen>
  );

  function open(path: string) {
    setSheet(null);
    router.push(path as never);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
