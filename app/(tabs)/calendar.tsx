import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useProgram } from '@/context/ProgramContext';
import * as db from '@/lib/db';
import { CalendarGrid } from '@/components/Charts';
import { EmptyState, SegmentedControl } from '@/components/ui';
import { monthLabel, todayISO } from '@/lib/dateUtils';

export default function CalendarScreen() {
  const colors = useColors();
  const { activeProgram, loading } = useProgram();
  const [mode, setMode] = useState<'workout' | 'diet'>('workout');
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [refreshTick, setRefreshTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setRefreshTick((t) => t + 1);
    }, []),
  );

  const days = useMemo(() => {
    if (!activeProgram) return [];
    return db.getMonthCalendar(activeProgram.id, year, month);
  }, [activeProgram, year, month, refreshTick]);

  const firstWeekday = db.getFirstWeekdayOfMonth(year, month);

  const goToMonth = (delta: number) => {
    let nextMonth = month + delta;
    let nextYear = year;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    setMonth(nextMonth);
    setYear(nextYear);
  };

  if (loading) return null;

  if (!activeProgram) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState icon="calendar" title="No active program" description="Import a program to see your calendar." />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <SegmentedControl
        value={mode}
        onChange={setMode}
        options={[
          { value: 'workout', label: 'Workouts' },
          { value: 'diet', label: 'Diet' },
        ]}
      />

      <View style={styles.monthNav}>
        <Pressable onPress={() => goToMonth(-1)} hitSlop={10}>
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.monthLabel, { color: colors.foreground }]}>{monthLabel(year, month)}</Text>
        <Pressable onPress={() => goToMonth(1)} hitSlop={10}>
          <Feather name="chevron-right" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <View
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
      >
        <CalendarGrid
          days={days}
          firstWeekday={firstWeekday}
          mode={mode}
          selectedDate={todayISO()}
          onSelectDay={(day) => {
            if (day.dayNumber) router.push(`/day/${day.dayNumber}`);
          }}
        />
      </View>

      <View style={styles.legend}>
        <LegendItem color={colors.flame} label="Completed" colors={colors} />
        <LegendItem color={colors.destructive} label="Missed" colors={colors} />
        <LegendItem color={colors.muted} label="Rest / Future" colors={colors} />
      </View>
    </ScrollView>
  );
}

function LegendItem({ color, label, colors }: { color: string; label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    flexGrow: 1,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  monthLabel: {
    fontSize: 17,
    fontWeight: '700',
  },
  card: {
    padding: 12,
    borderWidth: 1,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
