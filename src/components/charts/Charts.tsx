import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatMinor } from '../../domain/money';
import { colors, radius, space, type as typeScale } from '../../theme/tokens';

const COLUMN_HEIGHT = 72;

export type ChartSeries = {
  label: string;
  color: string;
};

export function ChartCard({ title, caption, children }: { title: string; caption?: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {children}
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

export function Legend({ series }: { series: ChartSeries[] }) {
  return (
    <View style={styles.legend}>
      {series.map((item) => (
        <View key={item.label} style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: item.color }]} />
          <Text style={styles.caption}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function HorizontalBars({ items }: { items: { label: string; minor: number; detail?: string }[] }) {
  const max = Math.max(...items.map((item) => item.minor), 1);
  return (
    <View style={styles.stack}>
      {items.map((item) => (
        <View key={item.label} accessibilityLabel={`${item.label}, ${formatMinor(item.minor)}`}>
          <View style={styles.barHeader}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.label}>{formatMinor(item.minor)}</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round((item.minor / max) * 100)}%` }]} />
          </View>
          {item.detail ? <Text style={styles.caption}>{item.detail}</Text> : null}
        </View>
      ))}
    </View>
  );
}

export function ColumnChart({
  groups,
  series,
}: {
  groups: { label: string; values: number[] }[];
  series: ChartSeries[];
}) {
  const max = Math.max(1, ...groups.flatMap((group) => group.values));
  return (
    <View>
      <View style={styles.columns}>
        {groups.map((group) => (
          <View key={group.label} style={styles.group} accessibilityLabel={groupLabel(group, series)}>
            <View style={styles.columnPair}>
              {group.values.map((value, index) => (
                <View
                  key={series[index]?.label ?? String(index)}
                  style={[styles.column, { height: barHeight(value, max), backgroundColor: series[index]?.color ?? colors.accent }]}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
      <AxisLabels labels={groups.map((group) => group.label)} />
    </View>
  );
}

export function ProgressMeter({ ratio, label }: { ratio: number; label: string }) {
  const width = `${Math.round(Math.min(Math.max(ratio, 0), 1) * 100)}%`;
  return (
    <View accessibilityLabel={label}>
      <View style={styles.track}>
        <View style={[styles.fill, { width }]} />
      </View>
    </View>
  );
}

function AxisLabels({ labels }: { labels: string[] }) {
  const visible = labels.length <= 6 ? labels : [labels[0], labels[Math.floor(labels.length / 2)], labels[labels.length - 1]];
  return (
    <View style={styles.axis}>
      {visible.map((label, index) => (
        <Text key={`${label}-${index}`} style={styles.axisLabel}>{label}</Text>
      ))}
    </View>
  );
}

function barHeight(value: number, max: number): number {
  if (value <= 0) return 2;
  return Math.max(4, Math.round((value / max) * COLUMN_HEIGHT));
}

function groupLabel(group: { label: string; values: number[] }, series: ChartSeries[]): string {
  const parts = group.values.map((value, index) => `${series[index]?.label ?? 'Value'} ${formatMinor(value)}`);
  return `${group.label}: ${parts.join(', ')}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
  },
  title: { color: colors.text, fontSize: typeScale.label, fontWeight: '700' },
  caption: { color: colors.textFaint, fontSize: typeScale.caption, lineHeight: 18 },
  label: { color: colors.text, fontSize: typeScale.caption, fontWeight: '600' },
  stack: { gap: space.sm },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: 8, borderRadius: radius.pill, backgroundColor: colors.accent },
  legend: { flexDirection: 'row', gap: space.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  swatch: { width: 10, height: 10, borderRadius: 2 },
  columns: { height: COLUMN_HEIGHT, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  group: { flex: 1, alignItems: 'center' },
  columnPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: COLUMN_HEIGHT },
  column: { width: 7, borderRadius: 3 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xs },
  axisLabel: { color: colors.textFaint, fontSize: typeScale.caption },
});
