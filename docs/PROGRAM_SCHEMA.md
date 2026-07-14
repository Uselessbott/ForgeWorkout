# ForgeWorkout Program File Format

ForgeWorkout programs are plain JSON files. You can write them by hand, generate
them with a script or LLM, or export them from the app itself (Programs tab →
Export). The formal contract lives in [`program.schema.json`](./program.schema.json)
(JSON Schema draft-07) — use it to validate files automatically. This document
explains the same contract in plain language.

## Top-level shape

```json
{
  "schemaVersion": 1,
  "meta": { ... },
  "days": [ ... ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `schemaVersion` | integer | yes | Always `1` for this version of the app. |
| `meta` | object | yes | Program-level metadata, see below. |
| `days` | array of day objects | yes | One entry per day of the program, `day` 1..N. |

## `meta`

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Program title shown in the app. |
| `description` | string | no | Shown under the title. |
| `durationDays` | integer | yes | Total number of days. Should equal `days.length`. |
| `targetCalories` | number | no | Daily calorie target, drives the Diet Insights progress bar. |
| `targetProtein` | number | no | Daily protein target (g), drives the Diet Insights progress bar. |
| `startDate` | string (`yyyy-mm-dd`) | no | Calendar date for day 1. If omitted, defaults to the date you import the file (you can also override this on import). |
| `notes` | string | no | Free-form program notes. |

## `days[]`

Each entry represents one day of the program.

| Field | Type | Required | Notes |
|---|---|---|---|
| `day` | integer | yes | 1-based day number. Must be unique and should be sequential. |
| `isRestDay` | boolean | no | When `true`, the Today/Calendar views show a rest banner instead of a workout checklist. Rest days are excluded from workout streaks. |
| `workout` | object or `null` | no | See below. Omit or set `null` for days with no training. |
| `diet` | object or `null` | no | See below. Omit or set `null` for days with no meal plan. |
| `notes` | string | no | Free-form notes shown on the day screen. |

### `workout`

```json
{
  "title": "Push Day",
  "notes": "Optional coaching note for the whole session.",
  "exercises": [
    { "name": "Bench Press", "sets": 4, "reps": "8", "weight": "60kg" }
  ]
}
```

- `title` (string, required)
- `notes` (string, optional)
- `exercises` (array, required — can be empty)
  - `name` (string, required)
  - `sets` (number, required)
  - `reps` (string, required) — free-form so you can express "8-10", "30s", "AMRAP", etc.
  - `weight` (string, optional)
  - `notes` (string, optional) — per-exercise coaching cue

Marking a workout "complete" (the checkmark on the day screen) is a separate,
manual action from checking off individual exercises — this lets you log a
session as done even if you swapped an exercise or two.

### `diet`

```json
{
  "notes": "Optional note for the whole day's meal plan.",
  "meals": [
    {
      "type": "breakfast",
      "items": [
        { "name": "Oats with whey", "quantity": "1 bowl", "calories": 450, "protein": 35, "carbs": 55, "fat": 8 }
      ]
    }
  ]
}
```

- `meals` (array, required — can be empty)
  - `type`: one of `"breakfast" | "lunch" | "dinner" | "snack" | "custom"`
  - `label` (string, optional) — display name when `type` is `"custom"`
  - `items` (array, required — can be empty)
    - `name` (string, required)
    - `quantity` (string, optional) — e.g. `"200g"`, `"1 cup"`
    - `calories`, `protein`, `carbs`, `fat` (numbers, required) — per the whole item, not per 100g

A meal counts toward "meal completion %" once you check it off in the app —
this happens per-meal, not per-food-item.

## Validation errors

When you import a file, ForgeWorkout runs it through the same schema check
described here and shows every problem it finds (missing fields, wrong types,
duplicate day numbers, etc.) so you can fix the file and re-import.

## Examples

- [`../assets/sample-programs/sample-program.json`](../assets/sample-programs/sample-program.json) —
  the 7-day starter program bundled with the app (also available in-app via
  Import → "Load sample program").
- [`sample-programs/example-30-day-program.json`](./sample-programs/example-30-day-program.json) —
  a longer, procedurally-generated 4-week program for testing calendars,
  streaks, and monthly stats.
