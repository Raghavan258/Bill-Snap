import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../../src/state/session';
import { colors, type as typeScale } from '../../src/theme/tokens';

function iconColor(color: unknown): string {
  return typeof color === 'string' ? color : colors.textFaint;
}

export default function TabLayout() {
  const { user } = useSession();
  if (!user) return <Redirect href="/auth/login" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.cta,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          height: 68,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: typeScale.caption, fontWeight: '600' },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home" color={iconColor(color)} size={size} /> }}
      />
      <Tabs.Screen
        name="overview"
        options={{ title: 'Overview', tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart" color={iconColor(color)} size={size} /> }}
      />
      <Tabs.Screen
        name="manage"
        options={{ title: 'Manage', tabBarIcon: ({ color, size }) => <Ionicons name="grid" color={iconColor(color)} size={size} /> }}
      />
    </Tabs>
  );
}
