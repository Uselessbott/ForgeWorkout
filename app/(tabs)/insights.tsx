import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useColors } from '@/hooks/useColors';
import { useProgram } from '@/context/ProgramContext';
import * as db from '@/lib/db';
import { ProgressBar, SectionHeader, SegmentedControl, StatCard } from '@/components/ui';
import { BarChart } from '@/components/Charts';
import { EmptyState } from '@/components/ui';

export default function InsightsScreen() {
  const colors = useColors();
  const { activeProgram, loading } = useProgram();
  const [mode, setMode] = useState<'workout' | 'diet'>('workout');
  const [refreshTick, setRefreshTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setRefreshTick((t) => t + 1);
    }, []),
  );

  const workoutStats = useMemo(
    () => (activeProgram ? db.getWorkoutStats(activeProgram.id) : null),
    [activeProgram, refreshTick],
  );
  const dietStats = useMemo(
    () => (activeProgram ? db.getDietStats(activeProgram.id) : null),
    [activeProgram, refreshTick],
  );

  if (loading) return null;

  if (!activeProgram || !workoutStats || !dietStats) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState icon="bar-chart-2" title="No active program" description="Import a program to see insights." />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <SegmentedControl
        value={mode}
        onChange={setMode}
        options={[
          { value: 'workout', label: 'Workout Insights' },
          { value: 'diet', label: 'Diet Insights' },
        ]}
      />

      {mode === 'workout' ? <WorkoutInsights stats={workoutStats} /> : <DietInsights stats={dietStats} />}
    </ScrollView>
  );
}

function WorkoutInsights({ stats }: { stats: db.WorkoutStats }) {
  const colors = useColors();
  return (
    <View style={{ gap: 20 }}>
      <View style={styles.statsGrid}>
        <StatCard label="Current streak" value={`${stats.currentStreak}d`} icon="zap" accent />
        <StatCard label="Longest streak" value={`${stats.longestStreak}d`} icon="award" />
      </View>
      <View style={styles.statsGrid}>
        <StatCard label="Completion rate" value={`${Math.round(stats.completionPercentage)}%`} icon="target" />
        <StatCard label="Missed sessions" value={`${stats.missedWorkoutCount}`} icon="alert-circle" />
      </View>

      <View>
        <SectionHeader title="Progress" subtitle={`Day ${stats.currentDayNumber} of ${stats.durationDays}`} />
        <ProgressBar progress={(stats.currentDayNumber / stats.durationDays) * 100} />
      </View>

      <View
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
      >
        <SectionHeader title="This week" subtitle="Completion by day" />
        <BarChart
          data={stats.weekly.map((d) => ({
            label: d.label,
            value: d.isRestDay ? 0 : d.completed ? 100 : d.isFuture ? 0 : 0,
            muted: d.isRestDay || d.isFuture,
            highlight: d.completed,
          }))}
        />
      </View>

      <View
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
      >
        <SectionHeader title="Last 6 weeks" subtitle="Completion trend" />
        <BarChart data={stats.monthly.map((w) => ({ label: w.label, value: w.percentage }))} />
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Workouts completed" value={`${stats.totalCompletedWorkouts}`} icon="check-square" />
        <StatCard label="Exercises logged" value={`${stats.totalCompletedExercises}`} icon="activity" />
      </View>
    </View>
  );
}

function DietInsights({ stats }: { stats: db.DietStats }) {
  const colors = useColors();
  const calorieProgress = stats.targetCalories
    ? Math.min(100, (stats.todayCaloriesConsumed / stats.targetCalories) * 100)
    : 0;
  const proteinProgress = stats.targetProtein
    ? Math.min(100, (stats.todayProteinConsumed / stats.targetProtein) * 100)
    : 0;

  return (
    <View style={{ gap: 20 }}>
      <View
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
      >
        <SectionHeader title="Today's Calories" subtitle={
          stats.targetCalories
            ? `${Math.round(stats.todayCaloriesConsumed)} / ${stats.targetCalories} kcal`
            : `${Math.round(stats.todayCaloriesConsumed)} kcal consumed`
        } />
        <ProgressBar progress={calorieProgress} height={14} color={colors.flame} />
      </View>

      <View
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
      >
        <SectionHeader title="Today's Protein" subtitle={
          stats.targetProtein
            ? `${Math.round(stats.todayProteinConsumed)} / ${stats.targetProtein} g`
            : `${Math.round(stats.todayProteinConsumed)} g consumed`
        } />
        <ProgressBar progress={proteinProgress} height={14} color={colors.primary} />
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Current streak" value={`${stats.currentStreak}d`} icon="zap" accent />
        <StatCard label="Longest streak" value={`${stats.longestStreak}d`} icon="award" />
      </View>
      <View style={styles.statsGrid}>
        <StatCard label="Meals today" value={`${Math.round(stats.todayMealCompletionPercentage)}%`} icon="check-square" />
        <StatCard label="Overall meal rate" value={`${Math.round(stats.overallMealCompletionPercentage)}%`} icon="trending-up" />
      </View>

      <View
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
      >
        <SectionHeader title="This week" subtitle="Calories consumed" />
        <BarChart
          data={stats.weekly.map((d) => ({ label: d.label, value: d.calories, muted: d.isFuture }))}
          maxValue={Math.max(stats.targetCalories ?? 0, ...stats.weekly.map((d) => d.calories), 100)}
          valueSuffix=""
        />
      </View>

      <View
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
      >
        <SectionHeader title="Last 6 weeks" subtitle="Avg. protein per day (g)" />
        <BarChart
          data={stats.monthly.map((w) => ({ label: w.label, value: w.avgProtein }))}
          maxValue={Math.max(stats.targetProtein ?? 0, ...stats.monthly.map((w) => w.avgProtein), 10)}
          valueSuffix=""
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
    flexGrow: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
});
