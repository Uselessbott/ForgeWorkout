import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { DayMeal } from '@/lib/db';

const MEAL_ICON: Record<string, keyof typeof Feather.glyphMap> = {
  breakfast: 'sunrise',
  lunch: 'sun',
  dinner: 'moon',
  snack: 'coffee',
  custom: 'star',
};

const MEAL_TITLE: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  custom: 'Custom',
};

interface MealCardProps {
  meal: DayMeal;
  onToggle: () => void;
  onEditItem: (foodItemId: string) => void;
}

export function MealCard({ meal, onToggle, onEditItem }: MealCardProps) {
  const colors = useColors();
  const totalCalories = meal.items.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = meal.items.reduce((sum, item) => sum + item.protein, 0);
  const title = meal.mealType === 'custom' ? meal.label || 'Custom Meal' : MEAL_TITLE[meal.mealType];

  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggle();
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
      ]}
    >
      <Pressable style={styles.header} onPress={handleToggle}>
        <View style={[styles.iconWrap, { backgroundColor: colors.accent }]}>
          <Feather name={MEAL_ICON[meal.mealType] ?? 'star'} size={15} color={colors.accentForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {Math.round(totalCalories)} kcal · {Math.round(totalProtein)}g protein
          </Text>
        </View>
        <View
          style={[
            styles.checkbox,
            {
              borderColor: meal.completed ? colors.primary : colors.border,
              backgroundColor: meal.completed ? colors.primary : 'transparent',
            },
          ]}
        >
          {meal.completed ? <Feather name="check" size={15} color={colors.primaryForeground} /> : null}
        </View>
      </Pressable>

      <View style={styles.items}>
        {meal.items.map((item) => (
          <Pressable
            key={item.id}
            style={styles.itemRow}
            onPress={() => onEditItem(item.id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, { color: colors.foreground }]}>
                {item.name}
                {item.quantity ? (
                  <Text style={{ color: colors.mutedForeground }}> · {item.quantity}</Text>
                ) : null}
              </Text>
              <Text style={[styles.itemMacros, { color: colors.mutedForeground }]}>
                {Math.round(item.calories)} kcal · P {Math.round(item.protein)}g · C {Math.round(item.carbs)}g · F{' '}
                {Math.round(item.fat)}g
              </Text>
            </View>
            <Feather name="edit-2" size={13} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15.5,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  items: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  itemName: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  itemMacros: {
    fontSize: 11.5,
    marginTop: 1,
  },
});
