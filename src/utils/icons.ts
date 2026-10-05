import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faArrowsRotate,
  faBed,
  faBolt,
  faCalendarDays,
  faChartColumn,
  faChartLine,
  faChartPie,
  faChevronRight,
  faCircleExclamation,
  faCircleInfo,
  faDumbbell,
  faFire,
  faFireFlameCurved,
  faGaugeHigh,
  faGear,
  faHeart,
  faHeartPulse,
  faLightbulb,
  faList,
  faLungs,
  faMedal,
  faPen,
  faPersonBiking,
  faPersonHiking,
  faPersonRunning,
  faPersonSwimming,
  faPersonWalking,
  faRoad,
  faSpa,
  faStopwatch,
  faTableColumns,
  faTrophy,
  faUser,
  faWandMagicSparkles,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import type { AthleteType } from '../types/garmin'

export type AppIconName =
  | 'watch'
  | 'calendar'
  | 'distance'
  | 'streak'
  | 'workouts'
  | 'load'
  | 'dashboard'
  | 'trainings'
  | 'profile'
  | 'heart'
  | 'dumbbell'
  | 'fire'
  | 'chevron-right'
  | 'close'
  | 'warning'
  | 'info'
  | 'lightbulb'
  | 'chart-pie'
  | 'chart-column'
  | 'sparkles'
  | 'trophy'
  | 'readiness'
  | 'sleep'
  | 'vo2'
  | 'gauge'
  | 'bolt'
  | 'medal'
  | 'pen'
  | 'settings'
  | 'refresh'

const ICON_MAP: Record<AppIconName, IconDefinition> = {
  watch: faStopwatch,
  calendar: faCalendarDays,
  distance: faRoad,
  streak: faFireFlameCurved,
  workouts: faDumbbell,
  load: faChartLine,
  dashboard: faTableColumns,
  trainings: faList,
  profile: faUser,
  heart: faHeart,
  dumbbell: faDumbbell,
  fire: faFire,
  'chevron-right': faChevronRight,
  close: faXmark,
  warning: faCircleExclamation,
  info: faCircleInfo,
  lightbulb: faLightbulb,
  'chart-pie': faChartPie,
  'chart-column': faChartColumn,
  sparkles: faWandMagicSparkles,
  trophy: faTrophy,
  readiness: faHeartPulse,
  sleep: faBed,
  vo2: faLungs,
  gauge: faGaugeHigh,
  bolt: faBolt,
  medal: faMedal,
  pen: faPen,
  settings: faGear,
  refresh: faArrowsRotate,
}

export function resolveIcon(name: AppIconName): IconDefinition {
  return ICON_MAP[name]
}

export const ACTIVITY_TYPE_ICONS: Record<string, IconDefinition> = {
  running: faPersonRunning,
  cycling: faPersonBiking,
  swimming: faPersonSwimming,
  strength_training: faDumbbell,
  walking: faPersonWalking,
  hiking: faPersonHiking,
  elliptical: faArrowsRotate,
  yoga: faSpa,
  unknown: faBolt,
}

export function getActivityTypeIcon(typeKey: string): IconDefinition {
  return ACTIVITY_TYPE_ICONS[typeKey] ?? ACTIVITY_TYPE_ICONS.unknown!
}

export const ATHLETE_TYPE_ICONS: Record<AthleteType, IconDefinition> = {
  bodybuilding: faDumbbell,
  runner: faPersonRunning,
  cyclist: faPersonBiking,
  swimmer: faPersonSwimming,
  hybrid: faBolt,
  triathlon: faMedal,
  general: faHeartPulse,
  other: faPen,
}
