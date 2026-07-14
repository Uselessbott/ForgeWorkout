import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { CalendarDay, DayStatus } from '@/lib/db';

// ---------- Simple bar chart (no native deps) ----------

interface BarChartProps {
  data: { label: string; value: number; highlight?: boolean; muted?: boolean }[];
  maxValue?: number;
  height?: number;
  valueSuffix?: string;
}

export function BarChart({ data, maxValue, height = 120, valueSuffix = '%' }: BarChartProps) {
  const colors = useColors();
  const max = maxValue ?? Math.max(100, ...data.map((d) => d.value));

  return (
    <View style={styles.chartRow}>
      {data.map((d, index) => {
        const barHeight = max > 0 ? Math.max(4, (d.value / max) * height) : 4;
        return (
          <View key={index} style={styles.chartBarColumn}>
            <Text style={[styles.chartValue, { color: colors.mutedForeground }]}>
              {Math.round(d.value)}
              {valueSuffix}
            </Text>
            <View style={[styles.chartTrack, { height, backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.chartFill,
                  {
                    height: barHeight,
                    backgroundColor: d.muted
                      ? colors.rest
                      : d.highlight
                        ? colors.primary
                        : colors.flame,
                  },
                ]}
              />
            </View>
            <Text style={[styles.chartLabel, { color: colors.mutedForeground }]}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------- Calendar heatmap / month grid ----------

interface CalendarGridProps {
  days: CalendarDay[];
  firstWeekday: number; // 0 = Monday
  mode: 'workout' | 'diet';
  onSelectDay?: (day: CalendarDay) => void;
  selectedDate?: string;
}

function statusColor(status: DayStatus, colors: ReturnType<typeof useColors>) {
  switch (status) {
    case 'completed':
      return colors.flame;
    case 'missed':
      return colors.destructive;
    case 'rest':
      return colors.muted;
    case 'future':
      return colors.muted;
    default:
      return 'transparent';
  }
}

const WEEKDAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function CalendarGrid({ days, firstWeekday, mode, onSelectDay, selectedDate }: CalendarGridProps) {
  const colors = useColors();
  const leadingBlanks = Array.from({ length: firstWeekday }, (_, i) => `blank-${i}`);

  return (
    <View>
      <View style={styles.weekHeaderRow}>
        {WEEKDAY_HEADERS.map((label, index) => (
          <Text key={index} style={[styles.weekHeaderLabel, { color: colors.mutedForeground }]}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {leadingBlanks.map((key) => (
          <View key={key} style={styles.calendarCell} />
        ))}
        {days.map((day) => {
          const status = mode === 'workout' ? day.workoutStatus : day.dietStatus;
          const isSelected = day.date === selectedDate;
          const isDisabled = day.dayNumber === null;
          return (
            <View key={day.date} style={styles.calendarCell}>
              <Pressable
                disabled={isDisabled}
                onPress={() => onSelectDay?.(day)}
                style={[
                  styles.calendarDot,
                  {
                    backgroundColor: statusColor(status, colors),
                    borderColor: isSelected ? colors.foreground : 'transparent',
                    opacity: isDisabled ? 0.25 : status === 'future' ? 0.5 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.calendarDayNumber,
                    {
                      color:
                        status === 'completed' || status === 'missed'
                          ? colors.primaryForeground
                          : colors.foreground,
                    },
                  ]}
                >
                  {day.dayOfMonth}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  chartBarColumn: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  chartValue: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  chartTrack: {
    width: 18,
    borderRadius: 9,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartFill: {
    width: '100%',
    borderRadius: 9,
  },
  chartLabel: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  weekHeaderRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekHeaderLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11.5,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  calendarDot: {
    width: '82%',
    height: '82%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  calendarDayNumber: {
    fontSize: 12.5,
    fontWeight: '600',
  },
});
