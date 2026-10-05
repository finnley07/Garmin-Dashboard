import type { ActivityDetail, GarminActivity } from '../types/garmin'
import { aggregateMuscleGroups } from './muscleGroups'

export function buildLocalActivityDetail(activity: GarminActivity): ActivityDetail {
  const exercises = activity.summarizedExerciseSets ?? []

  return {
    activity,
    hrZones: null,
    splits: null,
    exerciseSets: exercises.length ? exercises : null,
    muscleGroups: aggregateMuscleGroups(exercises),
    details: null,
    source: 'local',
  }
}

export function needsRemoteDetail(activity: GarminActivity): boolean {
  const typeKey = activity.activityType?.typeKey ?? ''

  if (typeKey === 'running' || typeKey === 'cycling') return true
  if (typeKey === 'strength_training' && !activity.summarizedExerciseSets?.length) {
    return true
  }

  return false
}
