import type { ExerciseSetSummary, MuscleGroupStat } from '../types/garmin'

export type RegionRole = 'primary' | 'secondary' | 'none'

export interface RegionHeat {
  regionId: string
  role: RegionRole
  intensity: number
  muscles: string[]
  volume: number
  sets: number
}

interface ExerciseMuscleMapping {
  primary: string[]
  secondary: string[]
}

const EXERCISE_MUSCLES: Record<string, ExerciseMuscleMapping> = {
  BENCH_PRESS: { primary: ['Brust'], secondary: ['Trizeps', 'Schultern'] },
  CHEST_PRESS: { primary: ['Brust'], secondary: ['Trizeps', 'Schultern'] },
  FLY: { primary: ['Brust'], secondary: ['Schultern'] },
  PUSH_UP: { primary: ['Brust'], secondary: ['Trizeps', 'Core'] },
  DIP: { primary: ['Brust', 'Trizeps'], secondary: ['Schultern', 'Core'] },
  ROW: { primary: ['Rücken'], secondary: ['Bizeps', 'Schultern', 'Core'] },
  PULL_UP: { primary: ['Rücken'], secondary: ['Bizeps', 'Schultern'] },
  PULL: { primary: ['Rücken'], secondary: ['Bizeps'] },
  LAT_PULLDOWN: { primary: ['Rücken'], secondary: ['Bizeps'] },
  SHOULDER_PRESS: { primary: ['Schultern'], secondary: ['Trizeps', 'Core'] },
  LATERAL_RAISE: { primary: ['Schultern'], secondary: ['Trapez'] },
  SHOULDER: { primary: ['Schultern'], secondary: ['Trapez'] },
  CURL: { primary: ['Bizeps'], secondary: ['Unterarme'] },
  TRICEPS_EXTENSION: { primary: ['Trizeps'], secondary: [] },
  TRICEPS: { primary: ['Trizeps'], secondary: ['Schultern'] },
  SQUAT: { primary: ['Beine', 'Gesäß'], secondary: ['Core', 'Rücken'] },
  LEG_PRESS: { primary: ['Beine'], secondary: ['Gesäß'] },
  LUNGE: { primary: ['Beine', 'Gesäß'], secondary: ['Core'] },
  LEG_EXTENSION: { primary: ['Beine'], secondary: [] },
  LEG_CURL: { primary: ['Hamstrings'], secondary: ['Gesäß'] },
  DEADLIFT: { primary: ['Rücken', 'Beine', 'Gesäß'], secondary: ['Core', 'Unterarme'] },
  HIP_STABILITY: { primary: ['Gesäß'], secondary: ['Core', 'Hamstrings'] },
  HIP_RAISE: { primary: ['Gesäß'], secondary: ['Hamstrings', 'Core'] },
  CALF_RAISE: { primary: ['Waden'], secondary: [] },
  CRUNCH: { primary: ['Core'], secondary: [] },
  PLANK: { primary: ['Core'], secondary: ['Schultern'] },
  SIT_UP: { primary: ['Core'], secondary: ['Beine'] },
  SLED: { primary: ['Beine', 'Gesäß'], secondary: ['Rücken', 'Schultern', 'Core'] },
}

const CATEGORY_TO_MUSCLE: Record<string, string> = {
  BENCH_PRESS: 'Brust',
  CHEST_PRESS: 'Brust',
  FLY: 'Brust',
  PUSH_UP: 'Brust',
  DIP: 'Brust',
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
  LEG_CURL: 'Hamstrings',
  DEADLIFT: 'Rücken',
  HIP_STABILITY: 'Gesäß',
  HIP_RAISE: 'Gesäß',
  CALF_RAISE: 'Waden',
  CRUNCH: 'Core',
  PLANK: 'Core',
  SIT_UP: 'Core',
  SLED: 'Ganzkörper',
}

export const MUSCLE_TO_REGIONS: Record<string, string[]> = {
  Brust: ['chest-upper', 'chest-lower'],
  Rücken: ['lats-l', 'lats-r', 'traps', 'lower-back'],
  Schultern: ['delt-front-l', 'delt-front-r', 'delt-rear-l', 'delt-rear-r'],
  Trapez: ['traps', 'delt-rear-l', 'delt-rear-r'],
  Bizeps: ['biceps-l', 'biceps-r'],
  Trizeps: ['triceps-l', 'triceps-r'],
  Unterarme: ['forearm-l', 'forearm-r'],
  Core: ['abs-upper', 'abs-lower', 'oblique-l', 'oblique-r'],
  Beine: ['quad-l', 'quad-r'],
  Hamstrings: ['ham-l', 'ham-r'],
  Gesäß: ['glutes-l', 'glutes-r'],
  Waden: ['calf-front-l', 'calf-front-r', 'calf-back-l', 'calf-back-r'],
  Ganzkörper: [
    'chest-upper',
    'quad-l',
    'quad-r',
    'lats-l',
    'lats-r',
    'abs-upper',
    'delt-front-l',
    'delt-front-r',
  ],
}

export const ALL_BODY_REGIONS = [
  'delt-front-l',
  'delt-front-r',
  'chest-upper',
  'chest-lower',
  'biceps-l',
  'biceps-r',
  'forearm-l',
  'forearm-r',
  'abs-upper',
  'abs-lower',
  'oblique-l',
  'oblique-r',
  'quad-l',
  'quad-r',
  'calf-front-l',
  'calf-front-r',
  'traps',
  'lats-l',
  'lats-r',
  'lower-back',
  'delt-rear-l',
  'delt-rear-r',
  'triceps-l',
  'triceps-r',
  'glutes-l',
  'glutes-r',
  'ham-l',
  'ham-r',
  'calf-back-l',
  'calf-back-r',
] as const

export type BodyRegionId = (typeof ALL_BODY_REGIONS)[number]

const MUSCLE_LABEL_KEYS: Record<string, string> = {
  Brust: 'muscle.chest',
  Rücken: 'muscle.back',
  Schultern: 'muscle.shoulders',
  Trapez: 'muscle.traps',
  Bizeps: 'muscle.biceps',
  Trizeps: 'muscle.triceps',
  Unterarme: 'muscle.forearms',
  Core: 'muscle.core',
  Beine: 'muscle.legs',
  Hamstrings: 'muscle.hamstrings',
  Gesäß: 'muscle.glutes',
  Waden: 'muscle.calves',
  Ganzkörper: 'muscle.fullBody',
  Sonstige: 'muscle.other',
}

export function muscleLabelKey(muscle: string): string {
  return MUSCLE_LABEL_KEYS[muscle] ?? 'muscle.other'
}

function formatExerciseLabel(category: string, subCategory?: string): string {
  const source = subCategory ?? category
  return source
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function getExerciseMuscleMapping(category: string): ExerciseMuscleMapping {
  if (EXERCISE_MUSCLES[category]) return EXERCISE_MUSCLES[category]

  for (const [key, mapping] of Object.entries(EXERCISE_MUSCLES)) {
    if (category.includes(key)) return mapping
  }

  const fallback = CATEGORY_TO_MUSCLE[category]
  if (fallback) {
    for (const [key, muscle] of Object.entries(CATEGORY_TO_MUSCLE)) {
      if (category.includes(key)) {
        return { primary: [muscle === 'Ganzkörper' ? 'Ganzkörper' : muscle], secondary: [] }
      }
    }
    return { primary: [fallback], secondary: [] }
  }

  return { primary: ['Sonstige'], secondary: [] }
}

function exerciseWeight(exercise: ExerciseSetSummary): number {
  const volume = exercise.volume ?? 0
  const sets = exercise.sets ?? 0
  const reps = exercise.reps ?? 0
  return volume > 0 ? volume : sets * 1000 + reps * 100
}

export function computeRegionHeatmap(exercises: ExerciseSetSummary[]): Map<string, RegionHeat> {
  const primaryScores = new Map<string, { score: number; muscles: Set<string>; volume: number; sets: number }>()
  const secondaryScores = new Map<string, { score: number; muscles: Set<string>; volume: number; sets: number }>()

  const addScore = (
    map: Map<string, { score: number; muscles: Set<string>; volume: number; sets: number }>,
    muscle: string,
    weight: number,
    volume: number,
    sets: number,
  ) => {
    const regions = MUSCLE_TO_REGIONS[muscle]
    if (!regions?.length) return

    const share = weight / regions.length
    for (const regionId of regions) {
      const existing = map.get(regionId) ?? {
        score: 0,
        muscles: new Set<string>(),
        volume: 0,
        sets: 0,
      }
      existing.score += share
      existing.muscles.add(muscle)
      existing.volume += volume / regions.length
      existing.sets += sets / regions.length
      map.set(regionId, existing)
    }
  }

  for (const exercise of exercises) {
    const mapping = getExerciseMuscleMapping(exercise.category)
    const weight = exerciseWeight(exercise)
    const volume = exercise.volume ?? 0
    const sets = exercise.sets ?? 0

    for (const muscle of mapping.primary) {
      addScore(primaryScores, muscle, weight, volume, sets)
    }
    for (const muscle of mapping.secondary) {
      addScore(secondaryScores, muscle, weight * 0.55, volume * 0.55, sets * 0.55)
    }
  }

  const maxPrimary = Math.max(...[...primaryScores.values()].map((v) => v.score), 1)
  const maxSecondary = Math.max(...[...secondaryScores.values()].map((v) => v.score), 1)

  const result = new Map<string, RegionHeat>()

  for (const regionId of ALL_BODY_REGIONS) {
    const primary = primaryScores.get(regionId)
    const secondary = secondaryScores.get(regionId)

    if (primary && primary.score > 0) {
      result.set(regionId, {
        regionId,
        role: 'primary',
        intensity: Math.min(1, primary.score / maxPrimary),
        muscles: [...primary.muscles],
        volume: primary.volume,
        sets: Math.round(primary.sets),
      })
    } else if (secondary && secondary.score > 0) {
      result.set(regionId, {
        regionId,
        role: 'secondary',
        intensity: Math.min(1, secondary.score / maxSecondary),
        muscles: [...secondary.muscles],
        volume: secondary.volume,
        sets: Math.round(secondary.sets),
      })
    } else {
      result.set(regionId, {
        regionId,
        role: 'none',
        intensity: 0,
        muscles: [],
        volume: 0,
        sets: 0,
      })
    }
  }

  return result
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
    const mapping = getExerciseMuscleMapping(exercise.category)
    const label = formatExerciseLabel(exercise.category, exercise.subCategory)
    const muscles = [...new Set([...mapping.primary, ...mapping.secondary])]

    for (const muscle of muscles) {
      if (muscle === 'Sonstige' || muscle === 'Ganzkörper') continue
      const isPrimary = mapping.primary.includes(muscle)
      const factor = isPrimary ? 1 : 0.55
      const existing = map.get(muscle) ?? {
        name: muscle,
        volume: 0,
        sets: 0,
        reps: 0,
        exercises: [],
      }

      existing.volume += (exercise.volume ?? 0) * factor
      existing.sets += (exercise.sets ?? 0) * factor
      existing.reps += (exercise.reps ?? 0) * factor
      if (!existing.exercises.includes(label)) {
        existing.exercises.push(label)
      }

      map.set(muscle, existing)
    }
  }

  return [...map.values()].sort((a, b) => b.volume - a.volume)
}
