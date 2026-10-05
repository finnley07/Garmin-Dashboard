<script setup lang="ts">
import { computed } from "vue";
import type { GarminActivity } from "../types/garmin";
import type { WeekStats } from "../utils/activityStats";
import type { ExtendedWellness } from "../utils/wellness";
import { useI18n } from "../i18n";
import SectionTitle from "./SectionTitle.vue";
import InfoTooltip from "./InfoTooltip.vue";
import { formatNumber } from "../utils/formatters";

const props = defineProps<{
  wellness: ExtendedWellness;
  weekStats: WeekStats | null;
  activities: GarminActivity[];
  trainingStreak: number;
}>();

const { t } = useI18n();

const latestActivity = computed(() => {
  if (!props.activities.length) return null;
  return [...props.activities].sort(
    (a, b) =>
      new Date(b.startTimeLocal).getTime() -
      new Date(a.startTimeLocal).getTime(),
  )[0];
});

const acwrClass = computed(() => {
  const ratio = props.wellness.acwrRatio;
  if (ratio == null) return "";
  if (ratio > 1.3) return "warn";
  if (ratio < 0.8) return "muted";
  return "good";
});
</script>

<template>
  <section class="dash-summary">
    <SectionTitle
      :title="t('dashboard.summary.title')"
      info-key="summaryOverview"
      tag="h2"
    />

    <div class="summary-grid">
      <article v-if="wellness.readinessScore" class="summary-card readiness">
        <span class="label">
          {{ t("wellness.readiness") }}
          <InfoTooltip info-key="readiness" />
        </span>
        <strong>{{ wellness.readinessScore }}<small>/100</small></strong>
        <span v-if="wellness.readinessLevel" class="meta">{{
          wellness.readinessLevel
        }}</span>
      </article>

      <article v-if="wellness.sleepScore" class="summary-card sleep">
        <span class="label">
          {{ t("wellness.sleepScore") }}
          <InfoTooltip info-key="sleepScore" />
        </span>
        <strong>{{ wellness.sleepScore }}</strong>
        <span v-if="wellness.sleep.durationHours" class="meta">
          {{ wellness.sleep.durationHours }}h
        </span>
      </article>

      <article v-if="wellness.trainingStatus" class="summary-card status">
        <span class="label">
          {{ t("wellness.trainingStatus") }}
          <InfoTooltip info-key="trainingStatus" />
        </span>
        <strong class="text-value">{{ wellness.trainingStatus }}</strong>
      </article>

      <article v-if="wellness.vo2max" class="summary-card vo2">
        <span class="label">
          {{ t("wellness.vo2max") }}
          <InfoTooltip info-key="vo2max" />
        </span>
        <strong>{{ wellness.vo2max.toFixed(1) }}</strong>
      </article>

      <article
        v-if="wellness.acwrRatio != null"
        class="summary-card acwr"
        :class="acwrClass"
      >
        <span class="label">
          ACWR
          <InfoTooltip info-key="acwr" />
        </span>
        <strong>{{ wellness.acwrRatio.toFixed(2) }}</strong>
        <span v-if="wellness.acwrStatus" class="meta">{{
          wellness.acwrStatus
        }}</span>
      </article>

      <article v-if="weekStats" class="summary-card week">
        <span class="label">
          {{ t("stats.thisWeek") }}
          <InfoTooltip info-key="thisWeek" />
        </span>
        <strong>{{ weekStats.sessions }} {{ t("common.sessions") }}</strong>
        <span class="meta"
          >{{ formatNumber(weekStats.km, 1) }} {{ t("common.km") }}</span
        >
      </article>

      <article v-if="trainingStreak > 0" class="summary-card streak">
        <span class="label">
          {{ t("stats.streak") }}
          <InfoTooltip info-key="streak" />
        </span>
        <strong>{{ trainingStreak }} {{ t("common.days") }}</strong>
      </article>
    </div>

    <article v-if="latestActivity" class="latest-activity">
      <span class="label">{{ t("dashboard.summary.lastWorkout") }}</span>
      <strong>{{ latestActivity.activityName }}</strong>
      <span class="meta">
        {{ new Date(latestActivity.startTimeLocal).toLocaleDateString() }}
        ·
        {{ latestActivity.activityType.typeKey }}
        <template v-if="latestActivity.distance">
          · {{ formatNumber(latestActivity.distance / 1000, 1) }}
          {{ t("common.km") }}
        </template>
      </span>
    </article>
  </section>
</template>

<style scoped>
.dash-summary {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(140px, 100%), 1fr));
  gap: 0.75rem;
}

.summary-card {
  padding: 0.95rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.summary-card.acwr.good strong {
  color: var(--success);
}

.summary-card.acwr.warn strong {
  color: var(--warning);
}

.label {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.66rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.summary-card strong {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.1;
  color: var(--text);
}

.summary-card strong.text-value {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  line-height: 1.25;
}

.summary-card strong small {
  font-size: 0.68rem;
  color: var(--text-muted);
  font-weight: 500;
  font-family: var(--font-sans);
}

.meta {
  font-size: 0.72rem;
  color: var(--accent);
  font-weight: 500;
}

.latest-activity {
  padding: 0.85rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--surface-elevated);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.latest-activity strong {
  font-size: 0.92rem;
  color: var(--text);
}
</style>
