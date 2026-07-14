import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';
import { useColors } from '@/hooks/useColors';
import * as db from '@/lib/db';
import { ExerciseRow } from '@/components/ExerciseRow';
import { MealCard } from '@/components/MealCard';
import { EmptyState, SectionHeader } from '@/components/ui';
import { fromISO } from '@/lib/dateUtils';

interface DayDetailViewProps {
  day: db.ProgramDay;
  onRefresh: () => void;
}

export function DayDetailView({ day, onRefresh }: DayDetailViewProps) {
  const colors = useColors();

  const dateLabel = fromISO(day.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const completedExercises = day.exercises.filter((e) => e.completed).length;

  const toggleWorkoutCompleted = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    db.setWorkoutCompleted(day.id, !day.workoutCompleted);
    onRefresh();
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View>
        <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>{dateLabel}</Text>
        <Text style={[styles.dayNumberLabel, { color: colors.foreground }]}>Day {day.dayNumber}</Text>
      </View>

      {day.isRestDay ? (
        <View
          style={[
            styles.restBanner,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <Feather name="moon" size={18} color={colors.mutedForeground} />
          <Text style={[styles.restText, { color: colors.mutedForeground }]}>
            Rest day{day.dayNotes ? ` — ${day.dayNotes}` : '. Recover and recharge.'}
          </Text>
        </View>
      ) : null}

      {!day.isRestDay && day.exercises.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader
            title={day.workoutTitle ?? 'Workout'}
            subtitle={`${completedExercises}/${day.exercises.length} exercises done`}
            right={
              <Pressable
                onPress={toggleWorkoutCompleted}
                style={[
                  styles.completeButton,
                  {
                    backgroundColor: day.workoutCompleted ? colors.primary : colors.muted,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <Feather
                  name={day.workoutCompleted ? 'check-circle' : 'circle'}
                  size={14}
                  color={day.workoutCompleted ? colors.primaryForeground : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.completeButtonText,
                    { color: day.workoutCompleted ? colors.primaryForeground : colors.mutedForeground },
                  ]}
                >
                  {day.workoutCompleted ? 'Completed' : 'Mark done'}
                </Text>
              </Pressable>
            }
          />
          {day.workoutNotes ? (
            <Text style={[styles.workoutNotes, { color: colors.mutedForeground }]}>{day.workoutNotes}</Text>
          ) : null}
          <View style={{ gap: 10 }}>
            {day.exercises.map((exercise) => (
              <ExerciseRow
                key={exercise.id}
                exercise={exercise}
                onToggle={() => {
                  db.setExerciseCompleted(exercise.id, !exercise.completed);
                  onRefresh();
                }}
                onEdit={() => router.push(`/edit-exercise?exerciseId=${exercise.id}`)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {!day.isRestDay && day.exercises.length === 0 ? (
        <EmptyState icon="activity" title="No workout planned" description="This training day has no exercises defined." />
      ) : null}

      {day.meals.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Meals" subtitle={`${day.meals.filter((m) => m.completed).length}/${day.meals.length} logged`} />
          <View style={{ gap: 10 }}>
            {day.meals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                onToggle={() => {
                  db.setMealCompleted(meal.id, !meal.completed);
                  onRefresh();
                }}
                onEditItem={(foodItemId) => router.push(`/edit-food-item?foodItemId=${foodItemId}`)}
              />
            ))}
          </View>
        </View>
      ) : (
        <EmptyState icon="coffee" title="No meals planned" description="This day has no diet plan defined." />
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dayNumberLabel: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
  },
  restBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderWidth: 1,
  },
  restText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  section: {
    gap: 12,
  },
  workoutNotes: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: -6,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  completeButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});
