/**
 * ForgeWorkout program file format.
 *
 * This is the single JSON contract for importing/exporting a full
 * workout + diet program. Keep new fields optional so older program
 * files remain importable as the schema grows (see docs/PROGRAM_SCHEMA.md).
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'custom';

export interface FoodItemDefinition {
  name: string;
  quantity?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealDefinition {
  type: MealType;
  /** Only used/shown when type === "custom" */
  label?: string;
  items: FoodItemDefinition[];
}

export interface ExerciseDefinition {
  name: string;
  sets: number;
  /** Free-form: "12", "8-10", "30s", "AMRAP" */
  reps: string;
  weight?: string;
  notes?: string;
}

export interface WorkoutDefinition {
  title: string;
  exercises: ExerciseDefinition[];
  notes?: string;
}

export interface DietDefinition {
  meals: MealDefinition[];
  notes?: string;
}

export interface ProgramDayDefinition {
  /** 1-based day index within the program */
  day: number;
  isRestDay?: boolean;
  workout?: WorkoutDefinition | null;
  diet?: DietDefinition | null;
  notes?: string;
}

export interface ProgramMetaDefinition {
  name: string;
  description?: string;
  durationDays: number;
  targetCalories?: number;
  targetProtein?: number;
  /** ISO date (yyyy-mm-dd) for day 1. Defaults to the import date. */
  startDate?: string;
  notes?: string;
}

export interface ProgramFile {
  schemaVersion: number;
  meta: ProgramMetaDefinition;
  days: ProgramDayDefinition[];
}

export const CURRENT_SCHEMA_VERSION = 1;
