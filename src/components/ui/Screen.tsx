import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space } from '../../theme/tokens';

type Props = {
  children: ReactNode;
  footer?: ReactNode;
};

/** Scrolls form content above the keyboard and respects the safe area. */
export function Screen({ children, footer }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.body, { paddingTop: insets.top }]}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[styles.content, { paddingBottom: space.xxl + insets.bottom }]}
        >
          {children}
        </ScrollView>
        {footer ? <View style={{ paddingBottom: insets.bottom, paddingHorizontal: space.lg }}>{footer}</View> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
  content: { padding: space.lg, gap: space.md },
});
