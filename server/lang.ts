import { getAppConfig } from './app-config.js'
import type { AthleteType } from './types.js'

/**
 * The rule-based recommendations are the one place users see raw server text
 * (everything else in the UI goes through the frontend's own i18n). Without
 * this, the local rules and the Claude baseline they feed always came out in
 * German regardless of the configured app language – so an English dashboard
 * would still show German recommendation titles whenever a local rule fired,
 * or when a Claude answer got a local high-priority finding merged back in.
 */
export function tr(de: string, en: string): string {
  return getAppConfig().language === 'de' ? de : en
}

export const ATHLETE_TYPE_LABELS_EN: Record<AthleteType, string> = {
  bodybuilding: 'Bodybuilding / strength',
  runner: 'Runner',
  cyclist: 'Cyclist',
  swimmer: 'Swimmer',
  hybrid: 'Hybrid (running + strength)',
  triathlon: 'Triathlon',
  general: 'General fitness',
  other: 'Other / custom',
}
