import type { Recommendation } from "./types.js";

const PRIORITY_ORDER: Record<Recommendation["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * A recommendation plus the signal it came from. Several rules describe the same
 * underlying condition from different angles (training status, readiness and
 * ACWR are all facets of one fatigue signal) – the family lets the selection
 * keep the best of them instead of all of them.
 *
 * The field is internal and stripped before the result is stored or shown.
 */
export interface FamilyRecommendation extends Recommendation {
  family?: string;
}

export interface SelectOptions {
  limit?: number;
  /** Maximum entries per signal family. */
  maxPerFamily?: number;
  /** Maximum entries per category, so one topic cannot fill every slot. */
  maxPerCategory?: number;
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function strip(rec: FamilyRecommendation): Recommendation {
  return {
    category: rec.category,
    priority: rec.priority,
    title: rec.title,
    description: rec.description,
  };
}

/**
 * Picks the final set of recommendations: one per signal family, at most two per
 * category, highest priority first.
 *
 * Without the family rule a bad day fills every slot with variations of "you are
 * tired", and the specific findings (load jump, monotony, protein gap) never
 * make it into the list.
 */
export function selectRecommendations(
  recommendations: FamilyRecommendation[],
  options: SelectOptions = {},
): Recommendation[] {
  const limit = options.limit ?? 4;
  const maxPerFamily = options.maxPerFamily ?? 1;
  const maxPerCategory = options.maxPerCategory ?? 2;

  const seenTitles = new Set<string>();
  const deduped: FamilyRecommendation[] = [];
  for (const rec of recommendations) {
    const key = normalizeTitle(rec.title);
    if (!key || seenTitles.has(key)) continue;
    seenTitles.add(key);
    deduped.push(rec);
  }

  // Stable sort: within one priority the caller's order decides, so rules can be
  // registered from most to least specific.
  const sorted = [...deduped].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );

  const perFamily = new Map<string, number>();
  const perCategory = new Map<string, number>();
  const selected: FamilyRecommendation[] = [];

  const eligible = (rec: FamilyRecommendation): boolean => {
    if (selected.includes(rec)) return false;
    if (rec.family && (perFamily.get(rec.family) ?? 0) >= maxPerFamily)
      return false;
    return (perCategory.get(rec.category) ?? 0) < maxPerCategory;
  };

  const take = (rec: FamilyRecommendation): void => {
    if (rec.family)
      perFamily.set(rec.family, (perFamily.get(rec.family) ?? 0) + 1);
    perCategory.set(rec.category, (perCategory.get(rec.category) ?? 0) + 1);
    selected.push(rec);
  };

  // Priority-major, category round-robin: within one priority level every
  // category gets a slot before any category gets a second one. Without this a
  // single bad day fills the list with recovery tips and another
  // structure findings never surface.
  for (const priority of ["high", "medium", "low"] as const) {
    const inPriority = sorted.filter((rec) => rec.priority === priority);
    if (inPriority.length === 0) continue;

    let progressed = true;
    while (selected.length < limit && progressed) {
      progressed = false;
      const roundCategories = new Set<string>();

      for (const rec of inPriority) {
        if (selected.length >= limit) break;
        if (roundCategories.has(rec.category)) continue;
        if (!eligible(rec)) continue;

        roundCategories.add(rec.category);
        take(rec);
        progressed = true;
      }
    }
  }

  // Fill remaining slots if the category cap left the list short. The family cap
  // is NOT relaxed here: a second entry from the same family would just be a
  // rephrasing of a tip that is already in the list, and three distinct tips beat
  // four with a duplicate.
  if (selected.length < limit) {
    for (const rec of sorted) {
      if (selected.length >= limit) break;
      if (selected.includes(rec)) continue;
      if (rec.family && (perFamily.get(rec.family) ?? 0) >= maxPerFamily)
        continue;
      take(rec);
    }
  }

  return selected.map(strip);
}
