import { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, hit, radius, space, type as typeScale } from '../../theme/tokens';

export type SheetOption = {
  title: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  title: string;
  body: string;
  options: SheetOption[];
  onClose: () => void;
};

export function OptionSheet({ visible, title, body, options, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss">
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.body}>{body}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}>
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>
          {options.map((option) => (
            <OptionRow key={option.title} option={option} />
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function OptionRow({ option }: { option: SheetOption }): ReactNode {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={option.title} onPress={option.onPress} style={styles.option}>
      <View style={styles.icon}>
        <Ionicons name={option.icon} size={20} color={colors.cta} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.optionTitle}>{option.title}</Text>
        <Text style={styles.optionBody}>{option.body}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
    paddingBottom: space.xxl,
  },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: colors.border },
  header: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  title: { color: colors.text, fontSize: typeScale.heading, fontWeight: '700' },
  body: { color: colors.textMuted, marginTop: 4 },
  close: { width: hit.min, height: hit.min, alignItems: 'center', justifyContent: 'center' },
  option: {
    minHeight: hit.min + 16,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: { color: colors.text, fontSize: typeScale.body, fontWeight: '700' },
  optionBody: { color: colors.textMuted, marginTop: 2 },
});
