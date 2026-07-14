import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { DayExercise } from '@/lib/db';

interface ExerciseRowProps {
  exercise: DayExercise;
  onToggle: () => void;
  onEdit: () => void;
}

export function ExerciseRow({ exercise, onToggle, onEdit }: ExerciseRowProps) {
  const colors = useColors();

  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggle();
  };

  const detailParts = [`${exercise.sets} x ${exercise.reps}`];
  if (exercise.weight) detailParts.push(exercise.weight);

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <Pressable
        onPress={handleToggle}
        style={[
          styles.checkbox,
          {
            borderColor: exercise.completed ? colors.primary : colors.border,
            backgroundColor: exercise.completed ? colors.primary : 'transparent',
          },
        ]}
      >
        {exercise.completed ? <Feather name="check" size={15} color={colors.primaryForeground} /> : null}
      </Pressable>

      <Pressable style={styles.rowBody} onPress={handleToggle}>
        <Text
          style={[
            styles.exerciseName,
            {
              color: exercise.completed ? colors.mutedForeground : colors.foreground,
              textDecorationLine: exercise.completed ? 'line-through' : 'none',
            },
          ]}
        >
          {exercise.name}
        </Text>
        <Text style={[styles.exerciseDetail, { color: colors.mutedForeground }]}>
          {detailParts.join(' · ')}
        </Text>
        {exercise.notes ? (
          <Text style={[styles.exerciseNotes, { color: colors.mutedForeground }]} numberOfLines={2}>
            {exercise.notes}
          </Text>
        ) : null}
      </Pressable>

      <Pressable onPress={onEdit} style={styles.editButton} hitSlop={8}>
        <Feather name="edit-2" size={16} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  exerciseName: {
    fontSize: 15.5,
    fontWeight: '600',
  },
  exerciseDetail: {
    fontSize: 13,
    fontWeight: '500',
  },
  exerciseNotes: {
    fontSize: 12.5,
    marginTop: 2,
    fontStyle: 'italic',
  },
  editButton: {
    padding: 4,
    marginTop: 2,
  },
});
