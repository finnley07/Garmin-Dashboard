import { getCachedDetail, saveDetailCache } from './detail-cache.js'
import { withGarminSession, type CallToolFn } from './garmin-session.js'
import { aggregateMuscleGroups, type ExerciseSetSummary } from './muscle-groups.js'
import type { ActivityDetail, GarminActivity } from './types.js'

function buildFromLocal(cached: GarminActivity): ActivityDetail {
  const exercises = cached.summarizedExerciseSets ?? []

  return {
    activity: cached,
    hrZones: null,
    splits: null,
    exerciseSets: exercises.length ? exercises : null,
    muscleGroups: aggregateMuscleGroups(exercises),
    details: null,
    source: 'local',
  }
}

function needsRemoteEnrichment(cached: GarminActivity): {
  splits: boolean
  exerciseSets: boolean
} {
  const typeKey = cached.activityType?.typeKey ?? ''
  return {
    splits: typeKey === 'running' || typeKey === 'cycling',
    exerciseSets:
      typeKey === 'strength_training' && !cached.summarizedExerciseSets?.length,
  }
}

async function fetchRemoteExtras(
  call: CallToolFn,
  activityId: number,
  needs: { splits: boolean; exerciseSets: boolean },
): Promise<Pick<ActivityDetail, 'splits' | 'exerciseSets'>> {
  const [splits, exerciseSets] = await Promise.all([
    needs.splits
      ? call<unknown[]>('get_activity_splits', { activityId })
      : Promise.resolve(null),
    needs.exerciseSets
      ? call<unknown[]>('get_activity_exercise_sets', { activityId })
      : Promise.resolve(null),
  ])

  return {
    splits: Array.isArray(splits) ? splits : null,
    exerciseSets: Array.isArray(exerciseSets) ? exerciseSets : null,
  }
}

export async function getActivityDetail(
  cachedActivity: GarminActivity | null,
  activityId: number,
  forceRefresh = false,
): Promise<ActivityDetail> {
  if (!forceRefresh) {
    const disk = await getCachedDetail(activityId)
    if (disk) return { ...disk, source: 'cache' }
  }

  if (cachedActivity) {
    const local = buildFromLocal(cachedActivity)
    const needs = needsRemoteEnrichment(cachedActivity)

    if (!needs.splits && !needs.exerciseSets) {
      await saveDetailCache(activityId, local)
      return local
    }

    const remote = await withGarminSession((call) =>
      fetchRemoteExtras(call, activityId, needs),
    )

    const exercises =
      (remote.exerciseSets as ExerciseSetSummary[] | null) ??
      cachedActivity.summarizedExerciseSets ??
      []

    const merged: ActivityDetail = {
      activity: cachedActivity,
      hrZones: null,
      splits: remote.splits,
      exerciseSets: exercises.length ? exercises : null,
      muscleGroups: aggregateMuscleGroups(exercises),
      details: null,
      source: 'remote',
    }

    await saveDetailCache(activityId, merged)
    return merged
  }

  const remote = await withGarminSession(async (call) => {
    const activity = await call<GarminActivity>('get_activity', { activityId })
    if (!activity) throw new Error('Activity not found')

    const typeKey = activity.activityType?.typeKey ?? ''
    const needs = {
      splits: typeKey === 'running' || typeKey === 'cycling',
      exerciseSets: typeKey === 'strength_training',
    }

    const extras = await fetchRemoteExtras(call, activityId, needs)
    const exercises =
      (extras.exerciseSets as ExerciseSetSummary[] | null) ??
      activity.summarizedExerciseSets ??
      []

    return {
      activity,
      hrZones: null,
      ...extras,
      exerciseSets: exercises.length ? exercises : null,
      muscleGroups: aggregateMuscleGroups(exercises),
      details: null,
      source: 'remote' as const,
    }
  })

  await saveDetailCache(activityId, remote)
  return remote
}
