# ForgeWorkout

An offline-first workout & diet program manager for Android (and iOS/web via
Expo). No accounts, no cloud sync, no ads, no tracking — everything lives in
a local SQLite database on the device.

## Features

- **Import/export JSON programs** — bring your own workout + diet plan as a
  JSON file (schema documented in [`docs/PROGRAM_SCHEMA.md`](docs/PROGRAM_SCHEMA.md)),
  or start from the bundled 7-day sample program.
- **Editable imports** — every exercise and food item can be edited in place
  after import, without touching the original file.
- **Local persistence** — SQLite via `expo-sqlite`, no network calls at all.
- **Calendar view** — month grid showing completed vs. missed days for both
  workouts and diet, tap any day to see its detail.
- **Two stats dashboards** — Workout Insights (streaks, completion rate,
  weekly/monthly trend charts) and Diet Insights (calorie & protein progress
  bars, meal completion rate, weekly/monthly trend charts).
- **Dark mode** — system-linked by default, with a manual override in
  Programs → Appearance.

## Tech stack

- [Expo](https://expo.dev) / React Native, file-based routing via
  `expo-router`
- `expo-sqlite` (synchronous API) for local persistence
- `expo-document-picker` + `expo-file-system` + `expo-sharing` for
  import/export of JSON files
- No backend, no external services, no analytics

## Project layout

```
app/                   Screens (expo-router file-based routing)
  (tabs)/              Today, Calendar, Insights, Programs tabs
  day/[dayNumber].tsx   Arbitrary-day detail (opened from Calendar)
  import.tsx            Import sheet
  edit-exercise.tsx      Edit-exercise sheet
  edit-food-item.tsx     Edit-food-item sheet
components/            Reusable UI (ExerciseRow, MealCard, Charts, etc.)
context/               ThemeContext (dark mode), ProgramContext (active program)
lib/                   db.ts (SQLite schema + queries), validateProgram.ts,
                       importExport.ts, dateUtils.ts, id.ts, sampleProgram.ts
types/program.ts       JSON program file TypeScript types
docs/                  Program JSON Schema + human-readable docs + examples
assets/                Icons, logo, bundled sample program
```

## Building the Android App



The `android/` folder in this project is a **generated native project**
(via `npx expo prebuild -p android`) and is ready to open directly in Android
Studio.

1. Open Android Studio → **Open** → select the `android/` folder inside this
   project.
2. Let Gradle sync finish (first sync downloads dependencies and may take a
   few minutes).
3. Press **Run** ▶ with a device or emulator selected, or use
   **Build → Generate Signed Bundle / APK** to produce a release build.

If you'd rather build from the command line once you have the Android SDK
and a JDK installed:

```bash
npm install         # or pnpm install, if using the full monorepo
cd android
./gradlew assembleDebug     # debug APK: android/app/build/outputs/apk/debug/
# or
./gradlew assembleRelease   # release APK (requires signing config)
```

To regenerate the native `android/` (and `ios/`) folders from scratch at any
time — e.g. after upgrading Expo SDK or changing native config in
`app.json` — run:

```bash
npx expo prebuild --clean
```

## JSON program format

See [`docs/PROGRAM_SCHEMA.md`](docs/PROGRAM_SCHEMA.md) for the full field-by-field
reference, and [`docs/program.schema.json`](docs/program.schema.json) for the
machine-readable JSON Schema (draft-07). Example files:

- [`assets/sample-programs/sample-program.json`](assets/sample-programs/sample-program.json) —
  7-day starter, also loadable in-app via Import → "Load sample program".
- [`docs/sample-programs/example-30-day-program.json`](docs/sample-programs/example-30-day-program.json) —
  30-day example for exercising calendars/streaks/monthly stats.

## Data & privacy

All program data, completion state, and settings are stored locally in
SQLite on the device (`forgeworkout.db`) and in `AsyncStorage` (theme
preference only). Nothing is sent to any server. Exporting a program writes
a JSON file to the app's local document directory and hands it to the
system share sheet — you control where it goes.
