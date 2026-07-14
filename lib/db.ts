import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { genId } from '@/lib/id';
import {
  addDays,
  dayDiff,
  daysInMonth,
  firstWeekdayOfMonth,
  startOfWeek,
  todayISO,
  weekdayLabel,
} from '@/lib/dateUtils';
import { CURRENT_SCHEMA_VERSION, MealType, ProgramFile } from '@/types/program';

/**
 * expo-sqlite's web implementation requires SharedArrayBuffer /
 * cross-origin isolation (COOP/COEP), which is not available behind
 * Native database initialization.
 * on iOS/Android; on web we fall back to a harmless in-memory stub so the
 * app can render an explanatory screen instead of crashing at import time.
 * See `app/_layout.tsx` (WebUnsupportedScreen) for the user-facing message.
 */
export const isSqliteSupported = Platform.OS !== 'web';

function createWebStub(): SQLite.SQLiteDatabase {
  const noop = () => {};
  const stub = {
    execSync: noop,
    runSync: noop,
    getAllSync: () => [],
    getFirstSync: () => null,
    withTransactionSync: (fn: () => void) => fn(),
  };
  return stub as unknown as SQLite.SQLiteDatabase;
}

const db: SQLite.SQLiteDatabase = isSqliteSupported
  ? SQLite.openDatabaseSync('forgeworkout.db')
  : createWebStub();

export function initDatabase() {
  db.execSync('PRAGMA foreign_keys = ON;');
  db.execSync(`
    CREATE TABLE IF NOT EXISTS programs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      duration_days INTEGER NOT NULL,
      target_calories INTEGER,
      target_protein INTEGER,
      start_date TEXT NOT NULL,
      notes TEXT,
      schema_version INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS program_days (
      id TEXT PRIMARY KEY,
      program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
      day_number INTEGER NOT NULL,
      is_rest_day INTEGER NOT NULL DEFAULT 0,
      workout_title TEXT,
      workout_notes TEXT,
      diet_notes TEXT,
      day_notes TEXT,
      workout_completed INTEGER NOT NULL DEFAULT 0,
      UNIQUE(program_id, day_number)
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      program_day_id TEXT NOT NULL REFERENCES program_days(id) ON DELETE CASCADE,
      order_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      sets INTEGER NOT NULL,
      reps TEXT NOT NULL,
      weight TEXT,
      notes TEXT,
      completed INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY,
      program_day_id TEXT NOT NULL REFERENCES program_days(id) ON DELETE CASCADE,
      order_index INTEGER NOT NULL,
      meal_type TEXT NOT NULL,
      label TEXT,
      completed INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS food_items (
      id TEXT PRIMARY KEY,
      meal_id TEXT NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
      order_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      quantity TEXT,
      calories REAL NOT NULL DEFAULT 0,
      protein REAL NOT NULL DEFAULT 0,
      carbs REAL NOT NULL DEFAULT 0,
      fat REAL NOT NULL DEFAULT 0
    );
  `);
}

// ---------- Types ----------

export interface Program {
  id: string;
  name: string;
  description: string | null;
  durationDays: number;
  targetCalories: number | null;
  targetProtein: number | null;
  startDate: string;
  notes: string | null;
  schemaVersion: number;
  isActive: boolean;
  createdAt: string;
}

export interface DayExercise {
  id: string;
  orderIndex: number;
  name: string;
  sets: number;
  reps: string;
  weight: string | null;
  notes: string | null;
  completed: boolean;
}

export interface DayFoodItem {
  id: string;
  orderIndex: number;
  name: string;
  quantity: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DayMeal {
  id: string;
  orderIndex: number;
  mealType: MealType;
  label: string | null;
  completed: boolean;
  items: DayFoodItem[];
}

export interface ProgramDay {
  id: string;
  programId: string;
  dayNumber: number;
  date: string;
  isRestDay: boolean;
  workoutTitle: string | null;
  workoutNotes: string | null;
  dietNotes: string | null;
  dayNotes: string | null;
  workoutCompleted: boolean;
  exercises: DayExercise[];
  meals: DayMeal[];
}

// ---------- Row mappers ----------

function rowToProgram(row: any): Program {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    durationDays: row.duration_days,
    targetCalories: row.target_calories,
    targetProtein: row.target_protein,
    startDate: row.start_date,
    notes: row.notes,
    schemaVersion: row.schema_version,
    isActive: !!row.is_active,
    createdAt: row.created_at,
  };
}

// ---------- Program CRUD ----------

export function getPrograms(): Program[] {
  const rows = db.getAllSync('SELECT * FROM programs ORDER BY created_at DESC;');
  return rows.map(rowToProgram);
}

export function getActiveProgram(): Program | null {
  const row = db.getFirstSync('SELECT * FROM programs WHERE is_active = 1 LIMIT 1;');
  return row ? rowToProgram(row) : null;
}

export function getProgram(programId: string): Program | null {
  const row = db.getFirstSync('SELECT * FROM programs WHERE id = ?;', [programId]);
  return row ? rowToProgram(row) : null;
}

export function setActiveProgram(programId: string) {
  db.withTransactionSync(() => {
    db.runSync('UPDATE programs SET is_active = 0;');
    db.runSync('UPDATE programs SET is_active = 1 WHERE id = ?;', [programId]);
  });
}

export function deleteProgram(programId: string) {
  db.runSync('DELETE FROM programs WHERE id = ?;', [programId]);
}

export function importProgram(file: ProgramFile, startDateOverride?: string): Program {
  const programId = genId();
  const startDate = startDateOverride ?? file.meta.startDate ?? todayISO();
  const createdAt = new Date().toISOString();

  db.withTransactionSync(() => {
    db.runSync('UPDATE programs SET is_active = 0;');
    db.runSync(
      `INSERT INTO programs
        (id, name, description, duration_days, target_calories, target_protein, start_date, notes, schema_version, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?);`,
      [
        programId,
        file.meta.name,
        file.meta.description ?? null,
        file.meta.durationDays,
        file.meta.targetCalories ?? null,
        file.meta.targetProtein ?? null,
        startDate,
        file.meta.notes ?? null,
        CURRENT_SCHEMA_VERSION,
        createdAt,
      ],
    );

    for (const day of file.days) {
      const dayId = genId();
      db.runSync(
        `INSERT INTO program_days
          (id, program_id, day_number, is_rest_day, workout_title, workout_notes, diet_notes, day_notes, workout_completed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0);`,
        [
          dayId,
          programId,
          day.day,
          day.isRestDay ? 1 : 0,
          day.workout?.title ?? null,
          day.workout?.notes ?? null,
          day.diet?.notes ?? null,
          day.notes ?? null,
        ],
      );

      day.workout?.exercises.forEach((exercise, index) => {
        db.runSync(
          `INSERT INTO exercises
            (id, program_day_id, order_index, name, sets, reps, weight, notes, completed)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0);`,
          [
            genId(),
            dayId,
            index,
            exercise.name,
            exercise.sets,
            exercise.reps,
            exercise.weight ?? null,
            exercise.notes ?? null,
          ],
        );
      });

      day.diet?.meals.forEach((meal, mealIndex) => {
        const mealId = genId();
        db.runSync(
          `INSERT INTO meals (id, program_day_id, order_index, meal_type, label, completed)
           VALUES (?, ?, ?, ?, ?, 0);`,
          [mealId, dayId, mealIndex, meal.type, meal.label ?? null],
        );
        meal.items.forEach((item, itemIndex) => {
          db.runSync(
            `INSERT INTO food_items
              (id, meal_id, order_index, name, quantity, calories, protein, carbs, fat)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              genId(),
              mealId,
              itemIndex,
              item.name,
              item.quantity ?? null,
              item.calories,
              item.protein,
              item.carbs,
              item.fat,
            ],
          );
        });
      });
    }
  });

  return getProgram(programId)!;
}

export function exportProgram(programId: string): ProgramFile {
  const program = getProgram(programId);
  if (!program) throw new Error('Program not found.');

  const dayRows = db.getAllSync(
    'SELECT * FROM program_days WHERE program_id = ? ORDER BY day_number ASC;',
    [programId],
  ) as any[];

  const days = dayRows.map((dayRow) => {
    const exerciseRows = db.getAllSync(
      'SELECT * FROM exercises WHERE program_day_id = ? ORDER BY order_index ASC;',
      [dayRow.id],
    ) as any[];
    const mealRows = db.getAllSync(
      'SELECT * FROM meals WHERE program_day_id = ? ORDER BY order_index ASC;',
      [dayRow.id],
    ) as any[];

    const meals = mealRows.map((mealRow) => {
      const itemRows = db.getAllSync(
        'SELECT * FROM food_items WHERE meal_id = ? ORDER BY order_index ASC;',
        [mealRow.id],
      ) as any[];
      return {
        type: mealRow.meal_type as MealType,
        label: mealRow.label ?? undefined,
        items: itemRows.map((item) => ({
          name: item.name,
          quantity: item.quantity ?? undefined,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
        })),
      };
    });

    return {
      day: dayRow.day_number,
      isRestDay: !!dayRow.is_rest_day,
      workout:
        exerciseRows.length > 0 || dayRow.workout_title
          ? {
              title: dayRow.workout_title ?? 'Workout',
              notes: dayRow.workout_notes ?? undefined,
              exercises: exerciseRows.map((exercise) => ({
                name: exercise.name,
                sets: exercise.sets,
                reps: exercise.reps,
                weight: exercise.weight ?? undefined,
                notes: exercise.notes ?? undefined,
              })),
            }
          : null,
      diet:
        meals.length > 0
          ? { meals, notes: dayRow.diet_notes ?? undefined }
          : null,
      notes: dayRow.day_notes ?? undefined,
    };
  });

  return {
    schemaVersion: program.schemaVersion,
    meta: {
      name: program.name,
      description: program.description ?? undefined,
      durationDays: program.durationDays,
      targetCalories: program.targetCalories ?? undefined,
      targetProtein: program.targetProtein ?? undefined,
      startDate: program.startDate,
      notes: program.notes ?? undefined,
    },
    days,
  };
}

// ---------- Day access ----------

function rowToExercise(row: any): DayExercise {
  return {
    id: row.id,
    orderIndex: row.order_index,
    name: row.name,
    sets: row.sets,
    reps: row.reps,
    weight: row.weight,
    notes: row.notes,
    completed: !!row.completed,
  };
}

function rowToFoodItem(row: any): DayFoodItem {
  return {
    id: row.id,
    orderIndex: row.order_index,
    name: row.name,
    quantity: row.quantity,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
  };
}

export function getProgramDay(programId: string, dayNumber: number): ProgramDay | null {
  const program = getProgram(programId);
  if (!program) return null;

  const dayRow = db.getFirstSync(
    'SELECT * FROM program_days WHERE program_id = ? AND day_number = ?;',
    [programId, dayNumber],
  ) as any;
  if (!dayRow) return null;

  const exerciseRows = db.getAllSync(
    'SELECT * FROM exercises WHERE program_day_id = ? ORDER BY order_index ASC;',
    [dayRow.id],
  ) as any[];
  const mealRows = db.getAllSync(
    'SELECT * FROM meals WHERE program_day_id = ? ORDER BY order_index ASC;',
    [dayRow.id],
  ) as any[];

  const meals: DayMeal[] = mealRows.map((mealRow) => {
    const itemRows = db.getAllSync(
      'SELECT * FROM food_items WHERE meal_id = ? ORDER BY order_index ASC;',
      [mealRow.id],
    ) as any[];
    return {
      id: mealRow.id,
      orderIndex: mealRow.order_index,
      mealType: mealRow.meal_type,
      label: mealRow.label,
      completed: !!mealRow.completed,
      items: itemRows.map(rowToFoodItem),
    };
  });

  return {
    id: dayRow.id,
    programId,
    dayNumber,
    date: addDays(program.startDate, dayNumber - 1),
    isRestDay: !!dayRow.is_rest_day,
    workoutTitle: dayRow.workout_title,
    workoutNotes: dayRow.workout_notes,
    dietNotes: dayRow.diet_notes,
    dayNotes: dayRow.day_notes,
    workoutCompleted: !!dayRow.workout_completed,
    exercises: exerciseRows.map(rowToExercise),
    meals,
  };
}

export function getTodayDayNumber(program: Program): number {
  const diff = dayDiff(program.startDate, todayISO());
  const dayNumber = diff + 1;
  if (dayNumber < 1) return 1;
  if (dayNumber > program.durationDays) return program.durationDays;
  return dayNumber;
}

export function getExerciseById(exerciseId: string): DayExercise | null {
  const row = db.getFirstSync('SELECT * FROM exercises WHERE id = ?;', [exerciseId]) as any;
  return row ? rowToExercise(row) : null;
}

export function getFoodItemById(foodItemId: string): DayFoodItem | null {
  const row = db.getFirstSync('SELECT * FROM food_items WHERE id = ?;', [foodItemId]) as any;
  return row ? rowToFoodItem(row) : null;
}

export function setExerciseCompleted(exerciseId: string, completed: boolean) {
  db.runSync('UPDATE exercises SET completed = ? WHERE id = ?;', [
    completed ? 1 : 0,
    exerciseId,
  ]);
}

export function setMealCompleted(mealId: string, completed: boolean) {
  db.runSync('UPDATE meals SET completed = ? WHERE id = ?;', [
    completed ? 1 : 0,
    mealId,
  ]);
}

export function setWorkoutCompleted(programDayId: string, completed: boolean) {
  db.runSync('UPDATE program_days SET workout_completed = ? WHERE id = ?;', [
    completed ? 1 : 0,
    programDayId,
  ]);
}

export function updateExercise(
  exerciseId: string,
  fields: { name: string; sets: number; reps: string; weight: string | null; notes: string | null },
) {
  db.runSync(
    'UPDATE exercises SET name = ?, sets = ?, reps = ?, weight = ?, notes = ? WHERE id = ?;',
    [fields.name, fields.sets, fields.reps, fields.weight, fields.notes, exerciseId],
  );
}

export function updateFoodItem(
  foodItemId: string,
  fields: {
    name: string;
    quantity: string | null;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  },
) {
  db.runSync(
    'UPDATE food_items SET name = ?, quantity = ?, calories = ?, protein = ?, carbs = ?, fat = ? WHERE id = ?;',
    [
      fields.name,
      fields.quantity,
      fields.calories,
      fields.protein,
      fields.carbs,
      fields.fat,
      foodItemId,
    ],
  );
}

// ---------- Internal: raw day rows for stats ----------

interface RawDayRow {
  id: string;
  day_number: number;
  is_rest_day: number;
  workout_completed: number;
}

function getRawDays(programId: string): RawDayRow[] {
  return db.getAllSync(
    'SELECT id, day_number, is_rest_day, workout_completed FROM program_days WHERE program_id = ? ORDER BY day_number ASC;',
    [programId],
  ) as RawDayRow[];
}

// ---------- Workout stats ----------

export interface WorkoutStats {
  currentDayNumber: number;
  durationDays: number;
  currentStreak: number;
  longestStreak: number;
  completionPercentage: number;
  totalCompletedWorkouts: number;
  totalCompletedExercises: number;
  missedWorkoutCount: number;
  weekly: { label: string; date: string; completed: boolean; isRestDay: boolean; isFuture: boolean }[];
  monthly: { label: string; percentage: number }[];
}

export function getWorkoutStats(programId: string): WorkoutStats {
  const program = getProgram(programId)!;
  const days = getRawDays(programId);
  const today = todayISO();
  const currentDayNumber = getTodayDayNumber(program);

  const eligibleDays = days.filter(
    (d) => !d.is_rest_day && addDays(program.startDate, d.day_number - 1) <= today,
  );
  const completedDays = eligibleDays.filter((d) => d.workout_completed);
  const missedWorkoutCount = eligibleDays.length - completedDays.length;
  const completionPercentage =
    eligibleDays.length > 0 ? (completedDays.length / eligibleDays.length) * 100 : 0;

  const totalCompletedExercisesRow = db.getFirstSync(
    `SELECT COUNT(*) AS count FROM exercises e
     JOIN program_days pd ON pd.id = e.program_day_id
     WHERE pd.program_id = ? AND e.completed = 1;`,
    [programId],
  ) as any;

  // Streaks: walk backward from the latest eligible (past/today) day.
  const pastOrToday = days.filter(
    (d) => addDays(program.startDate, d.day_number - 1) <= today,
  );

  let currentStreak = 0;
  for (let i = pastOrToday.length - 1; i >= 0; i--) {
    const d = pastOrToday[i];
    if (d.is_rest_day) continue;
    if (d.workout_completed) currentStreak++;
    else break;
  }

  let longestStreak = 0;
  let running = 0;
  for (const d of pastOrToday) {
    if (d.is_rest_day) continue;
    if (d.workout_completed) {
      running++;
      longestStreak = Math.max(longestStreak, running);
    } else {
      running = 0;
    }
  }

  // Weekly: current week (Mon-Sun)
  const weekStart = startOfWeek(today);
  const weekly = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dayNumber = dayDiff(program.startDate, date) + 1;
    const day = days.find((d) => d.day_number === dayNumber);
    return {
      label: weekdayLabel(i),
      date,
      completed: !!day?.workout_completed,
      isRestDay: day ? !!day.is_rest_day : true,
      isFuture: date > today,
    };
  });

  // Monthly: last 6 weeks completion percentage
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const weeksAgo = 5 - i;
    const wkStart = addDays(weekStart, -weeksAgo * 7);
    let total = 0;
    let completed = 0;
    for (let d = 0; d < 7; d++) {
      const date = addDays(wkStart, d);
      if (date > today) continue;
      const dayNumber = dayDiff(program.startDate, date) + 1;
      const day = days.find((x) => x.day_number === dayNumber);
      if (!day || day.is_rest_day) continue;
      total++;
      if (day.workout_completed) completed++;
    }
    return {
      label: `W${i + 1}`,
      percentage: total > 0 ? (completed / total) * 100 : 0,
    };
  });

  return {
    currentDayNumber,
    durationDays: program.durationDays,
    currentStreak,
    longestStreak,
    completionPercentage,
    totalCompletedWorkouts: completedDays.length,
    totalCompletedExercises: totalCompletedExercisesRow?.count ?? 0,
    missedWorkoutCount,
    weekly,
    monthly,
  };
}

// ---------- Diet stats ----------

export interface DietStats {
  targetCalories: number | null;
  targetProtein: number | null;
  todayCaloriesConsumed: number;
  todayProteinConsumed: number;
  todayCarbsConsumed: number;
  todayFatConsumed: number;
  todayMealCompletionPercentage: number;
  currentStreak: number;
  longestStreak: number;
  overallMealCompletionPercentage: number;
  weekly: {
    label: string;
    date: string;
    calories: number;
    protein: number;
    isFuture: boolean;
  }[];
  monthly: { label: string; avgCalories: number; avgProtein: number; mealCompletionPct: number }[];
}

interface DayNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  totalMeals: number;
  completedMeals: number;
}

function getDayNutrition(programDayId: string): DayNutrition {
  const meals = db.getAllSync(
    'SELECT id, completed FROM meals WHERE program_day_id = ?;',
    [programDayId],
  ) as any[];

  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let completedMeals = 0;

  for (const meal of meals) {
    if (!meal.completed) continue;
    completedMeals++;
    const items = db.getAllSync(
      'SELECT calories, protein, carbs, fat FROM food_items WHERE meal_id = ?;',
      [meal.id],
    ) as any[];
    for (const item of items) {
      calories += item.calories;
      protein += item.protein;
      carbs += item.carbs;
      fat += item.fat;
    }
  }

  return { calories, protein, carbs, fat, totalMeals: meals.length, completedMeals };
}

export function getDietStats(programId: string): DietStats {
  const program = getProgram(programId)!;
  const days = getRawDays(programId);
  const today = todayISO();
  const currentDayNumber = getTodayDayNumber(program);

  const todayDayRow = days.find((d) => d.day_number === currentDayNumber);
  const todayNutrition = todayDayRow
    ? getDayNutrition(todayDayRow.id)
    : { calories: 0, protein: 0, carbs: 0, fat: 0, totalMeals: 0, completedMeals: 0 };

  // Diet-day "complete" = has meals and all are checked off.
  function isDietDayComplete(dayRow: RawDayRow): { hasMeals: boolean; complete: boolean } {
    const nutrition = getDayNutrition(dayRow.id);
    return {
      hasMeals: nutrition.totalMeals > 0,
      complete: nutrition.totalMeals > 0 && nutrition.completedMeals === nutrition.totalMeals,
    };
  }

  const pastOrToday = days.filter(
    (d) => addDays(program.startDate, d.day_number - 1) <= today,
  );

  let currentStreak = 0;
  for (let i = pastOrToday.length - 1; i >= 0; i--) {
    const status = isDietDayComplete(pastOrToday[i]);
    if (!status.hasMeals) continue;
    if (status.complete) currentStreak++;
    else break;
  }

  let longestStreak = 0;
  let running = 0;
  for (const d of pastOrToday) {
    const status = isDietDayComplete(d);
    if (!status.hasMeals) continue;
    if (status.complete) {
      running++;
      longestStreak = Math.max(longestStreak, running);
    } else {
      running = 0;
    }
  }

  let totalMealsAll = 0;
  let completedMealsAll = 0;
  for (const d of pastOrToday) {
    const nutrition = getDayNutrition(d.id);
    totalMealsAll += nutrition.totalMeals;
    completedMealsAll += nutrition.completedMeals;
  }

  const weekStart = startOfWeek(today);
  const weekly = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dayNumber = dayDiff(program.startDate, date) + 1;
    const day = days.find((d) => d.day_number === dayNumber);
    const nutrition = day ? getDayNutrition(day.id) : { calories: 0, protein: 0 };
    return {
      label: weekdayLabel(i),
      date,
      calories: nutrition.calories,
      protein: nutrition.protein,
      isFuture: date > today,
    };
  });

  const monthly = Array.from({ length: 6 }, (_, i) => {
    const weeksAgo = 5 - i;
    const wkStart = addDays(weekStart, -weeksAgo * 7);
    let calorieSum = 0;
    let proteinSum = 0;
    let dayCount = 0;
    let totalMeals = 0;
    let completedMeals = 0;
    for (let d = 0; d < 7; d++) {
      const date = addDays(wkStart, d);
      if (date > today) continue;
      const dayNumber = dayDiff(program.startDate, date) + 1;
      const day = days.find((x) => x.day_number === dayNumber);
      if (!day) continue;
      const nutrition = getDayNutrition(day.id);
      if (nutrition.totalMeals === 0) continue;
      calorieSum += nutrition.calories;
      proteinSum += nutrition.protein;
      totalMeals += nutrition.totalMeals;
      completedMeals += nutrition.completedMeals;
      dayCount++;
    }
    return {
      label: `W${i + 1}`,
      avgCalories: dayCount > 0 ? calorieSum / dayCount : 0,
      avgProtein: dayCount > 0 ? proteinSum / dayCount : 0,
      mealCompletionPct: totalMeals > 0 ? (completedMeals / totalMeals) * 100 : 0,
    };
  });

  return {
    targetCalories: program.targetCalories,
    targetProtein: program.targetProtein,
    todayCaloriesConsumed: todayNutrition.calories,
    todayProteinConsumed: todayNutrition.protein,
    todayCarbsConsumed: todayNutrition.carbs,
    todayFatConsumed: todayNutrition.fat,
    todayMealCompletionPercentage:
      todayNutrition.totalMeals > 0
        ? (todayNutrition.completedMeals / todayNutrition.totalMeals) * 100
        : 0,
    currentStreak,
    longestStreak,
    overallMealCompletionPercentage:
      totalMealsAll > 0 ? (completedMealsAll / totalMealsAll) * 100 : 0,
    weekly,
    monthly,
  };
}

// ---------- Calendar ----------

export type DayStatus = 'completed' | 'missed' | 'rest' | 'future' | 'none';

export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  dayNumber: number | null;
  workoutStatus: DayStatus;
  dietStatus: DayStatus;
}

export function getMonthCalendar(programId: string, year: number, month: number): CalendarDay[] {
  const program = getProgram(programId);
  const days = getRawDays(programId);
  const today = todayISO();
  const count = daysInMonth(year, month);

  const result: CalendarDay[] = [];
  for (let i = 1; i <= count; i++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    if (!program) {
      result.push({ date, dayOfMonth: i, dayNumber: null, workoutStatus: 'none', dietStatus: 'none' });
      continue;
    }
    const dayNumber = dayDiff(program.startDate, date) + 1;
    if (dayNumber < 1 || dayNumber > program.durationDays) {
      result.push({ date, dayOfMonth: i, dayNumber: null, workoutStatus: 'none', dietStatus: 'none' });
      continue;
    }
    const dayRow = days.find((d) => d.day_number === dayNumber);
    const isFuture = date > today;

    let workoutStatus: DayStatus = 'none';
    if (dayRow?.is_rest_day) workoutStatus = 'rest';
    else if (isFuture) workoutStatus = 'future';
    else if (dayRow?.workout_completed) workoutStatus = 'completed';
    else workoutStatus = 'missed';

    let dietStatus: DayStatus = 'none';
    if (dayRow) {
      const nutrition = getDayNutrition(dayRow.id);
      if (nutrition.totalMeals === 0) dietStatus = 'rest';
      else if (isFuture) dietStatus = 'future';
      else if (nutrition.completedMeals === nutrition.totalMeals) dietStatus = 'completed';
      else dietStatus = 'missed';
    }

    result.push({ date, dayOfMonth: i, dayNumber, workoutStatus, dietStatus });
  }

  return result;
}

export function getFirstWeekdayOfMonth(year: number, month: number): number {
  return firstWeekdayOfMonth(year, month);
}
