import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getDb } from '../src/data/db';
import { loadCurrentUser, logoutLocalUser, type LocalProfile } from '../src/data/users';
import { SessionProvider } from '../src/state/session';
import { colors, space, type as typeScale } from '../src/theme/tokens';

export default function RootLayout() {
  const [boot, setBoot] = useState<'loading' | 'ready' | 'error'>('loading');
  const [user, setUser] = useState<LocalProfile | null>(null);

  useEffect(() => {
    getDb()
      .then(() => loadCurrentUser())
      .then((profile) => {
        setUser(profile);
        setBoot('ready');
      })
      .catch(() => setBoot('error'));
  }, []);

  async function signOut() {
    await logoutLocalUser();
    setUser(null);
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SessionProvider value={{ user, setUser, signOut }}>
        {boot === 'ready' ? <AppStack /> : <Boot state={boot} />}
      </SessionProvider>
    </SafeAreaProvider>
  );
}

function AppStack() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}

function Boot({ state }: { state: 'loading' | 'error' }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: space.xl }}>
      {state === 'error' ? (
        <Text style={{ color: colors.text, fontSize: typeScale.body, textAlign: 'center' }}>
          Bill Snap could not open on-device storage.
        </Text>
      ) : (
        <ActivityIndicator color={colors.cta} />
      )}
    </View>
  );
}
