import { Pressable, Text, View } from 'react-native';
import { expenseDonut, type DonutSlice } from '../../domain/donut';
import { formatMinor } from '../../domain/money';
import { colors, space, type as typeScale } from '../../theme/tokens';

const SEGMENTS = 36;
const PALETTE = [colors.cta, colors.accent, colors.warning, colors.danger, colors.textMuted];

/** Donut of this month's recorded expenses. The centre figure is their exact total. */
export function ExpenseDonut({
  records,
  onSelect,
}: {
  records: { category: string; amountMinor: number }[];
  onSelect: (category: string) => void;
}) {
  const slices = expenseDonut(records);
  const total = slices.reduce((sum, slice) => sum + slice.minor, 0);
  if (slices.length === 0) return null;
  return (
    <View style={{ gap: space.md }}>
      <DonutRing slices={slices} totalLabel={formatMinor(total)} />
      {slices.map((slice, index) => (
        <Pressable
          key={slice.category}
          accessibilityRole="button"
          accessibilityLabel={`${slice.category}, ${formatMinor(slice.minor)}, ${slice.percent} percent`}
          onPress={() => onSelect(slice.category)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}
        >
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: PALETTE[index % PALETTE.length] }} />
          <Text style={{ color: colors.text, flex: 1 }}>{slice.category}</Text>
          <Text style={{ color: colors.textMuted }}>{formatMinor(slice.minor)} · {slice.percent}%</Text>
        </Pressable>
      ))}
    </View>
  );
}

function DonutRing({ slices, totalLabel }: { slices: DonutSlice[]; totalLabel: string }) {
  const segmentColors = colorsFor(slices);
  return (
    <View style={{ width: 200, height: 200, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}>
      {segmentColors.map((color, index) => (
        <View
          key={index}
          style={{ position: 'absolute', width: 200, height: 200, alignItems: 'center', transform: [{ rotate: `${index * (360 / SEGMENTS)}deg` }] }}
        >
          <View style={{ width: 12, height: 34, borderRadius: 6, backgroundColor: color }} />
        </View>
      ))}
      <View style={{ width: 124, height: 124, borderRadius: 62, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: typeScale.label }}>{totalLabel}</Text>
        <Text style={{ color: colors.textFaint, fontSize: typeScale.caption }}>Expenses</Text>
      </View>
    </View>
  );
}

function colorsFor(slices: DonutSlice[]): string[] {
  const painted = slices.map((slice, index) => ({ share: slice.share, color: PALETTE[index % PALETTE.length] ?? colors.accent }));
  const colorsBySegment: string[] = [];
  let cursor = 0;
  let sliceIndex = 0;
  for (let index = 0; index < SEGMENTS; index += 1) {
    const position = (index + 0.5) / SEGMENTS;
    while (sliceIndex < painted.length - 1 && position > cursor + (painted[sliceIndex]?.share ?? 0)) {
      cursor += painted[sliceIndex]?.share ?? 0;
      sliceIndex += 1;
    }
    colorsBySegment.push(painted[sliceIndex]?.color ?? colors.accent);
  }
  return colorsBySegment;
}
