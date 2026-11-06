import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { SettingsRow } from '../../src/components/manage/SettingsRow';
import { colors, space, type as typeScale } from '../../src/theme/tokens';

const SECTIONS = [
  { href: '/settings/categories', title: 'Categories', body: 'The categories stored on income and expenses', icon: 'pricetags-outline' as const },
  { href: '/settings/recurring', title: 'Recurring Rules', body: 'Schedules that stay unpaid until you record them', icon: 'repeat' as const },
  { href: '/settings/payments', title: 'Payment Methods', body: 'How an expense was paid is not stored', icon: 'card-outline' as const },
  { href: '/settings/budgets', title: 'Budgets', body: 'Monthly limits that are not expenses', icon: 'options-outline' as const },
  { href: '/settings/data', title: 'Data & Backup', body: 'On-device records. No cloud backup', icon: 'phone-portrait-outline' as const },
  { href: '/settings/preferences', title: 'Preferences', body: 'How recorded figures are shown', icon: 'settings-outline' as const },
];

export default function ManageScreen() {
  const router = useRouter();
  return (
    <Screen>
      <Text style={styles.title}>Manage</Text>
      <Text style={styles.note}>Configuration for this device. Recording income, expenses, and savings stays on Home.</Text>
      <View style={styles.list}>
        {SECTIONS.map((section) => (
          <SettingsRow
            key={section.href}
            icon={section.icon}
            title={section.title}
            body={section.body}
            onPress={() => router.push(section.href as never)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: typeScale.title, fontWeight: '800' },
  note: { color: colors.textMuted, lineHeight: 20 },
  list: { gap: space.md },
});
