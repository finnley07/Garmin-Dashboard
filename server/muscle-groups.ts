export interface ExerciseSetSummary {
  category: string
  subCategory?: string
  reps?: number
  volume?: number
  duration?: number
  sets?: number
  maxWeight?: number
}

export interface MuscleGroupStat {
  name: string
  volume: number
  sets: number
  reps: number
  exercises: string[]
}

const CATEGORY_TO_MUSCLE: Record<string, string> = {
  BENCH_PRESS: 'Brust',
  CHEST_PRESS: 'Brust',
  FLY: 'Brust',
  PUSH_UP: 'Brust',
  DIP: 'Brust/Trizeps',
  ROW: 'Rücken',
  PULL_UP: 'Rücken',
  PULL: 'Rücken',
  LAT_PULLDOWN: 'Rücken',
  SHOULDER_PRESS: 'Schultern',
  LATERAL_RAISE: 'Schultern',
  SHOULDER: 'Schultern',
  CURL: 'Bizeps',
  TRICEPS_EXTENSION: 'Trizeps',
  TRICEPS: 'Trizeps',
  SQUAT: 'Beine',
  LEG_PRESS: 'Beine',
  LUNGE: 'Beine',
  LEG_EXTENSION: 'Beine',
  LEG_CURL: 'Beine',
  DEADLIFT: 'Rücken/Beine',
  HIP_STABILITY: 'Gesäß/Hüfte',
  HIP_RAISE: 'Gesäß/Hüfte',
  CALF_RAISE: 'Waden',
  CRUNCH: 'Core',
  PLANK: 'Core',
  SIT_UP: 'Core',
  SLED: 'Ganzkörper',
  CARDIO: 'Cardio',
  WARM_UP: 'Aufwärmen',
  STRETCH: 'Dehnung',
}

export function formatExerciseLabel(category: string, subCategory?: string): string {
  const source = subCategory ?? category
  return source
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function getMuscleGroup(category: string): string {
  if (CATEGORY_TO_MUSCLE[category]) return CATEGORY_TO_MUSCLE[category]

  for (const [key, muscle] of Object.entries(CATEGORY_TO_MUSCLE)) {
    if (category.includes(key)) return muscle
  }

  return 'Sonstige'
}

export function aggregateMuscleGroups(exercises: ExerciseSetSummary[]): MuscleGroupStat[] {
  const map = new Map<string, MuscleGroupStat>()

  for (const exercise of exercises) {
    const muscle = getMuscleGroup(exercise.category)
    const label = formatExerciseLabel(exercise.category, exercise.subCategory)
    const existing = map.get(muscle) ?? {
      name: muscle,
      volume: 0,
      sets: 0,
      reps: 0,
      exercises: [],
    }

    existing.volume += exercise.volume ?? 0
    existing.sets += exercise.sets ?? 0
    existing.reps += exercise.reps ?? 0
    if (!existing.exercises.includes(label)) {
      existing.exercises.push(label)
    }

    map.set(muscle, existing)
  }

  return [...map.values()].sort((a, b) => b.volume - a.volume)
}

export function gramsToKg(grams: number): number {
  return Math.round((grams / 1000) * 10) / 10
}
