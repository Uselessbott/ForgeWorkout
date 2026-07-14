import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable } from 'react-native';
import { useColors } from '@/hooks/useColors';
import * as db from '@/lib/db';

export default function EditFoodItemSheet() {
  const colors = useColors();
  const { foodItemId } = useLocalSearchParams<{ foodItemId: string }>();
  const original = React.useMemo(() => db.getFoodItemById(foodItemId), [foodItemId]);

  const [name, setName] = useState(original?.name ?? '');
  const [quantity, setQuantity] = useState(original?.quantity ?? '');
  const [calories, setCalories] = useState(String(original?.calories ?? ''));
  const [protein, setProtein] = useState(String(original?.protein ?? ''));
  const [carbs, setCarbs] = useState(String(original?.carbs ?? ''));
  const [fat, setFat] = useState(String(original?.fat ?? ''));

  if (!original) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Food item not found.</Text>
      </View>
    );
  }

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    db.updateFoodItem(foodItemId, {
      name: name.trim(),
      quantity: quantity.trim() || null,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: colors.foreground }]}>Edit Food Item</Text>

        <Field label="Name" value={name} onChangeText={setName} colors={colors} />
        <Field label="Quantity (optional)" value={quantity} onChangeText={setQuantity} colors={colors} placeholder="e.g. 200g" />

        <View style={styles.row}>
          <Field label="Calories" value={calories} onChangeText={setCalories} colors={colors} keyboardType="numeric" style={{ flex: 1 }} />
          <Field label="Protein (g)" value={protein} onChangeText={setProtein} colors={colors} keyboardType="numeric" style={{ flex: 1 }} />
        </View>
        <View style={styles.row}>
          <Field label="Carbs (g)" value={carbs} onChangeText={setCarbs} colors={colors} keyboardType="numeric" style={{ flex: 1 }} />
          <Field label="Fat (g)" value={fat} onChangeText={setFat} colors={colors} keyboardType="numeric" style={{ flex: 1 }} />
        </View>

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
  placeholder,
  style,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  colors: ReturnType<typeof useColors>;
  keyboardType?: 'numeric';
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
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderRadius: colors.radius }]}
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
