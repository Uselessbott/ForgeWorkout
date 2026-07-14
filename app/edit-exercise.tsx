import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable } from 'react-native';
import { useColors } from '@/hooks/useColors';
import * as db from '@/lib/db';

export default function EditExerciseSheet() {
  const colors = useColors();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const original = React.useMemo(() => db.getExerciseById(exerciseId), [exerciseId]);

  const [name, setName] = useState(original?.name ?? '');
  const [sets, setSets] = useState(String(original?.sets ?? ''));
  const [reps, setReps] = useState(original?.reps ?? '');
  const [weight, setWeight] = useState(original?.weight ?? '');
  const [notes, setNotes] = useState(original?.notes ?? '');

  if (!original) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Exercise not found.</Text>
      </View>
    );
  }

  const canSave = name.trim().length > 0 && reps.trim().length > 0 && Number(sets) > 0;

  const handleSave = () => {
    db.updateExercise(exerciseId, {
      name: name.trim(),
      sets: Number(sets) || 1,
      reps: reps.trim(),
      weight: weight.trim() || null,
      notes: notes.trim() || null,
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: colors.foreground }]}>Edit Exercise</Text>

        <Field label="Name" value={name} onChangeText={setName} colors={colors} />
        <View style={styles.row}>
          <Field label="Sets" value={sets} onChangeText={setSets} colors={colors} keyboardType="numeric" style={{ flex: 1 }} />
          <Field label="Reps" value={reps} onChangeText={setReps} colors={colors} style={{ flex: 1 }} placeholder="e.g. 8-10" />
        </View>
        <Field label="Weight (optional)" value={weight} onChangeText={setWeight} colors={colors} placeholder="e.g. 20kg" />
        <Field label="Notes (optional)" value={notes} onChangeText={setNotes} colors={colors} multiline />

        <View style={styles.actions}>
          <Pressable style={[styles.button, { backgroundColor: colors.muted }]} onPress={() => router.back()}>
            <Text style={[styles.buttonText, { color: colors.foreground }]}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.button, { backgroundColor: canSave ? colors.primary : colors.muted, flex: 1 }]}
            disabled={!canSave}
            onPress={handleSave}
          >
            <Text style={[styles.buttonText, { color: canSave ? colors.primaryForeground : colors.mutedForeground }]}>
              Save changes
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  colors,
  keyboardType,
  multiline,
  placeholder,
  style,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  colors: ReturnType<typeof useColors>;
  keyboardType?: 'numeric';
  multiline?: boolean;
  placeholder?: string;
  style?: object;
}) {
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          multiline && { height: 80, textAlignVertical: 'top' },
          { backgroundColor: colors.muted, color: colors.foreground, borderRadius: colors.radius },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
