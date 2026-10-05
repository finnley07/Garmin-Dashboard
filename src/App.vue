<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
  fetchAppConfig,
  fetchHealth,
  fetchUserProfile,
  getCachedData,
  getSyncStatus,
  reanalyzeData,
  readGarminData,
  relaunchClaudeLogin,
} from "./api/garmin";
import StatCard from "./components/StatCard.vue";
import DistanceChart from "./components/DistanceChart.vue";
import ActivityTypeChart from "./components/ActivityTypeChart.vue";
import Recommendations from "./components/Recommendations.vue";
import RecentActivities from "./components/RecentActivities.vue";
import TrainingsPage from "./components/TrainingsPage.vue";
import ProfilePage from "./components/ProfilePage.vue";
import WellnessCards from "./components/WellnessCards.vue";
import SectionTitle from "./components/SectionTitle.vue";
import WeeklyProgress from "./components/WeeklyProgress.vue";
import WeeklyTrendChart from "./components/WeeklyTrendChart.vue";
import PersonalRecordsPanel from "./components/PersonalRecordsPanel.vue";
import HrZoneSummary from "./components/HrZoneSummary.vue";
import RecoveryPanel from "./components/RecoveryPanel.vue";
import Vo2Panel from "./components/Vo2Panel.vue";
import TrainingLoadPanel from "./components/TrainingLoadPanel.vue";
import LoadQualityPanel from "./components/LoadQualityPanel.vue";
import TrainingPlanCard from "./components/TrainingPlanCard.vue";
import WeeklyLoadTrend from "./components/WeeklyLoadTrend.vue";
import RacePredictionsPanel from "./components/RacePredictionsPanel.vue";
import WellnessHistoryPanel from "./components/WellnessHistoryPanel.vue";
import TrainingEffectPanel from "./components/TrainingEffectPanel.vue";
import TrainingStatusPanel from "./components/TrainingStatusPanel.vue";
import RaceCalendarPanel from "./components/RaceCalendarPanel.vue";
import SyncStatusBar from "./components/SyncStatusBar.vue";
import DashboardMuscleBalance from "./components/DashboardMuscleBalance.vue";
import TrainingHeatmap from "./components/TrainingHeatmap.vue";
import PeriodComparisonPanel from "./components/PeriodComparisonPanel.vue";
import PaceTrendChart from "./components/PaceTrendChart.vue";
import RoutePreviewPanel from "./components/RoutePreviewPanel.vue";
import DataManagementPanel from "./components/DataManagementPanel.vue";
import CollapsibleSection from "./components/CollapsibleSection.vue";
import SetupPage from "./components/SetupPage.vue";
import DashboardModeToggle from "./components/DashboardModeToggle.vue";
import DashboardSummary from "./components/DashboardSummary.vue";
import { useDashboardDetailMode } from "./composables/useDashboardDetailMode";
import type { DashboardData, UserProfileSettings } from "./types/garmin";
import type { AppConfigPublic } from "./types/appConfig";
import {
  computeDashboardStats,
  computeRecentWeekStats,
  computeTrainingStreak,
} from "./utils/activityStats";
import { filterDashboardActivities } from "./utils/activityFilters";
import { parseExtendedWellness } from "./utils/wellness";
import { useI18n } from "./i18n";
import LanguageSelector from "./components/LanguageSelector.vue";
import AppIcon from "./components/AppIcon.vue";
import { formatNumber } from "./utils/formatters";
import {
  createDefaultUserProfile,
  normalizeUserProfile,
} from "./utils/defaultProfile";
import { sumTargetSessions } from "./utils/profileLabels";
import { setLocale } from "./i18n";

const { t, localeTag } = useI18n();

const data = ref<DashboardData | null>(null);
const userProfile = ref<UserProfileSettings>(createDefaultUserProfile());
const profileLoading = ref(false);
const profileLoadError = ref<string | null>(null);
const view = ref<"dashboard" | "trainings" | "profile" | "setup">("dashboard");
const loading = ref(false);
const error = ref<string | null>(null);
const health = ref<{
  setupCompleted: boolean;
  hasGarminCredentials: boolean;
  hasClaudeCli: boolean;
  claudeAuth: { needsLogin: boolean; message: string | null };
} | null>(null);
const appConfig = ref<AppConfigPublic | null>(null);
const setupRequired = computed(
  () => appConfig.value !== null && !appConfig.value.setupCompleted,
);
const syncMessage = ref<string | null>(null);
const pendingActivityId = ref<number | null>(null);
const apiOffline = ref(false);

const weekStats = computed(() =>
  data.value ? computeRecentWeekStats(data.value.activities) : null,
);
/**
 * Planned sessions per week from the profile, so the "this week" stat can show
 * "2/6" instead of a bare count. A plain progress number instead of a verdict –
 * whether 2/6 on a Wednesday is "on track" or "behind" depends on the day of
 * the week, which a single stat can't judge, so it doesn't try to.
 */
const plannedWeeklySessions = computed(() =>
  userProfile.value ? sumTargetSessions(userProfile.value.weeklyTargets) : 0,
);
const dashboardActivities = computed(() =>
  data.value ? filterDashboardActivities(data.value.activities) : [],
);
const dashboardStats = computed(() =>
  data.value ? computeDashboardStats(data.value.activities) : null,
);
const trainingStreak = computed(() =>
  data.value ? computeTrainingStreak(data.value.activities) : 0,
);
const sectionRecovery = ref<InstanceType<typeof CollapsibleSection> | null>(
  null,
);
const sectionWeek = ref<InstanceType<typeof CollapsibleSection> | null>(null);
const sectionAnalytics = ref<InstanceType<typeof CollapsibleSection> | null>(
  null,
);
const sectionRecords = ref<InstanceType<typeof CollapsibleSection> | null>(
  null,
);

const { showDetails, setShowDetails } = useDashboardDetailMode();

const wellnessOverview = computed(() => {
  if (!data.value) return null;
  return parseExtendedWellness({
    trainingStatus: data.value.trainingStatus,
    trainingReadiness: data.value.trainingReadiness,
    vo2max: data.value.vo2max,
    vo2maxHistory: data.value.vo2maxHistory,
    sleepData: data.value.sleepData,
    healthSnapshot: data.value.healthSnapshot,
  });
});

const recoverySummary = computed(() => {
  if (!data.value) return "";
  const w = parseExtendedWellness({
    trainingStatus: data.value.trainingStatus,
    trainingReadiness: data.value.trainingReadiness,
    vo2max: data.value.vo2max,
    sleepData: data.value.sleepData,
    healthSnapshot: data.value.healthSnapshot,
  });
  const parts: string[] = [];
  if (w.readinessScore) parts.push(`Readiness ${w.readinessScore}`);
  if (w.sleepScore) parts.push(`${t("recovery.sleep")} ${w.sleepScore}`);
  if (w.acwrRatio) parts.push(`ACWR ${w.acwrRatio.toFixed(2)}`);
  return parts.join(" · ");
});

const weekSummary = computed(() => {
  if (!weekStats.value) return "";
  return `${weekStats.value.sessions} ${t("common.sessions")} · ${formatNumber(weekStats.value.km, 1)} ${t("common.km")}`;
});

const analyticsSummary = computed(() =>
  t("dashboard.chartCount", { count: 9 }),
);

const recordsSummary = computed(() => t("dashboard.sections.insights"));

function expandAllSections() {
  sectionRecovery.value?.expand();
  sectionWeek.value?.expand();
  sectionAnalytics.value?.expand();
  sectionRecords.value?.expand();
}

function collapseAllSections() {
  sectionRecovery.value?.collapse();
  sectionWeek.value?.collapse();
  sectionAnalytics.value?.collapse();
  sectionRecords.value?.collapse();
}

async function loadUserProfileFromApi() {
  profileLoading.value = true;
  profileLoadError.value = null;
  try {
    userProfile.value = normalizeUserProfile(await fetchUserProfile());
    return true;
  } catch (e) {
    profileLoadError.value =
      e instanceof Error ? e.message : t("profile.loadError");
    return false;
  } finally {
    profileLoading.value = false;
  }
}

async function initApp() {
  profileLoading.value = true;
  profileLoadError.value = null;

  try {
    health.value = await fetchHealth();
    appConfig.value = await fetchAppConfig();
    setLocale(appConfig.value.language);
    if (!appConfig.value.setupCompleted) {
      view.value = "setup";
    }
    apiOffline.value = false;
  } catch {
    apiOffline.value = true;
  }

  try {
    data.value = await getCachedData();
    if (data.value?.userProfile) {
      userProfile.value = normalizeUserProfile(data.value.userProfile);
    } else {
      const status = await getSyncStatus();
      if (status.userProfile) {
        userProfile.value = normalizeUserProfile(status.userProfile);
      } else {
        await loadUserProfileFromApi();
      }
    }
  } catch {
    if (!apiOffline.value) apiOffline.value = true;
    const loaded = await loadUserProfileFromApi();
    if (!loaded) {
      userProfile.value = createDefaultUserProfile();
    }
  } finally {
    profileLoading.value = false;
  }
}

watch(view, (nextView) => {
  if (nextView === "profile" && profileLoadError.value) {
    void loadUserProfileFromApi();
  }
});

async function loadData(forceFull = false) {
  loading.value = true;
  error.value = null;
  syncMessage.value = null;
  try {
    const hadLocalData = Boolean(data.value);
    data.value = await readGarminData(forceFull);
    userProfile.value = normalizeUserProfile(data.value.userProfile);

    if (
      data.value.sync.syncMode === "incremental" &&
      data.value.sync.newActivitiesCount === 0
    ) {
      syncMessage.value = hadLocalData ? t("sync.noNewTrainings") : null;
    } else if (data.value.sync.newActivitiesCount > 0) {
      syncMessage.value =
        data.value.sync.newActivitiesCount === 1
          ? t("sync.newTraining", { count: data.value.sync.newActivitiesCount })
          : t("sync.newTrainings", {
              count: data.value.sync.newActivitiesCount,
            });
    } else if (data.value.sync.syncMode === "full") {
      syncMessage.value = t("sync.initialLoaded", {
        count: data.value.sync.totalActivities,
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : t("sync.loadError");
    if (msg.includes("fetch") || msg.includes("Failed") || apiOffline.value) {
      error.value = t("sync.apiOffline");
    } else {
      error.value = msg;
    }
  } finally {
    loading.value = false;
    health.value = await fetchHealth().catch(() => health.value);
  }
}

const reanalyzing = ref(false);

async function reanalyze() {
  reanalyzing.value = true;
  error.value = null;
  syncMessage.value = null;
  try {
    const result = await reanalyzeData();
    if (result.status === "no-data") {
      error.value = t("sync.reanalyzeNoData");
      return;
    }
    if (result.status === "claude-off") {
      error.value = t("sync.reanalyzeClaudeOff");
      return;
    }

    data.value = result.dashboard;
    userProfile.value = normalizeUserProfile(result.dashboard.userProfile);
    syncMessage.value = result.claudeFailed
      ? t("sync.reanalyzeFallback")
      : t("sync.reanalyzeDone");
  } catch (e) {
    error.value = e instanceof Error ? e.message : t("sync.reanalyzeError");
  } finally {
    reanalyzing.value = false;
    health.value = await fetchHealth().catch(() => health.value);
  }
}

const claudeLoginState = ref<"idle" | "starting" | "failed">("idle");
const claudeLoginError = ref<string | null>(null);

async function fixClaudeAuth() {
  claudeLoginState.value = "starting";
  claudeLoginError.value = null;
  try {
    const result = await relaunchClaudeLogin();
    if (!result.started) {
      claudeLoginState.value = "failed";
      claudeLoginError.value = result.reason ?? null;
      return;
    }
    claudeLoginState.value = "idle";
  } catch (e) {
    claudeLoginState.value = "failed";
    claudeLoginError.value = e instanceof Error ? e.message : null;
  }
}

onMounted(() => {
  void initApp();
});

function onProfileSaved(payload: {
  profile: UserProfileSettings;
  recommendationsUpdated: boolean;
  recommendations: DashboardData["recommendations"] | null;
  analysisSource: DashboardData["analysisSource"] | null;
  claudePending?: boolean;
}) {
  userProfile.value = payload.profile;
  if (data.value) {
    data.value.userProfile = payload.profile;
    if (payload.recommendations) {
      data.value.recommendations = payload.recommendations;
    }
    if (payload.analysisSource) {
      data.value.analysisSource = payload.analysisSource;
    }
  }
  if (payload.recommendationsUpdated) {
    syncMessage.value = payload.claudePending
      ? t("profile.savedClaudePending")
      : t("sync.recommendationsUpdated");
  }
  if (payload.claudePending) {
    void pollForClaudeRecommendations();
  }
}

async function pollForClaudeRecommendations() {
  for (let attempt = 0; attempt < 36; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    try {
      const cached = await getCachedData();
      if (cached?.analysisSource === "claude") {
        data.value = cached;
        userProfile.value = normalizeUserProfile(cached.userProfile);
        syncMessage.value = t("sync.recommendationsUpdated");
        return;
      }
    } catch {
      // ignore transient fetch errors while polling
    }
  }
}

const profileName = () => {
  if (userProfile.value?.displayName) return userProfile.value.displayName;
  const name =
    data.value?.profile?.fullName ?? data.value?.profile?.displayName;
  return typeof name === "string" ? name : t("common.athlete");
};

const garminName = () => {
  const name =
    data.value?.profile?.fullName ?? data.value?.profile?.displayName;
  return typeof name === "string" ? name : undefined;
};

function openActivity(activityId: number) {
  pendingActivityId.value = activityId;
  view.value = "trainings";
}

function exportData() {
  if (!data.value) return;
  const blob = new Blob([JSON.stringify(data.value, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `garmin-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function openSettings() {
  view.value = "setup";
}

async function reloadDashboard() {
  try {
    data.value = await getCachedData();
    if (data.value?.userProfile) {
      userProfile.value = normalizeUserProfile(data.value.userProfile);
    }
  } catch {
    // ignore
  }
}

async function onConfigSaved(config: AppConfigPublic) {
  appConfig.value = config;
  setLocale(config.language);
  try {
    health.value = await fetchHealth();
  } catch {
    // ignore
  }
  if (config.setupCompleted) {
    view.value = "dashboard";
  }
}
</script>

<template>
  <div class="dashboard">
    <header class="header">
      <div class="header-left">
        <div class="logo"><AppIcon name="watch" size="xl" /></div>
        <div>
          <h1 class="brand-title">
            <span class="brand-accent">Garmin</span> Activity
          </h1>
          <p v-if="data" class="subtitle">
            {{ profileName() }} · {{ data.sync.totalActivities }}
            {{ t("sync.savedLocally") }} ·
            {{ t("sync.lastSynced") }}
            {{ new Date(data.sync.lastSyncedAt).toLocaleString(localeTag()) }}
            <span
              v-if="data.sync.syncMode === 'incremental'"
              class="sync-tag"
              >{{ t("sync.incremental") }}</span
            >
          </p>
          <p v-else class="subtitle">{{ t("sync.subtitleLoad") }}</p>
        </div>
      </div>
      <nav v-if="!setupRequired" class="main-nav">
        <button
          class="nav-btn"
          :class="{ active: view === 'dashboard' }"
          :title="t('nav.dashboard')"
          @click="view = 'dashboard'"
        >
          <AppIcon name="dashboard" size="sm" />
          <span class="nav-btn-label">{{ t("nav.dashboard") }}</span>
        </button>
        <button
          class="nav-btn"
          :class="{ active: view === 'trainings' }"
          :title="t('nav.trainings')"
          @click="view = 'trainings'"
        >
          <AppIcon name="trainings" size="sm" />
          <span class="nav-btn-label">{{ t("nav.trainings") }}</span>
        </button>
        <button
          class="nav-btn"
          :class="{ active: view === 'profile' }"
          :title="t('nav.profile')"
          @click="view = 'profile'"
        >
          <AppIcon name="profile" size="sm" />
          <span class="nav-btn-label">{{ t("nav.profile") }}</span>
        </button>
      </nav>
      <div class="header-actions">
        <LanguageSelector />
        <button
          v-if="!apiOffline"
          type="button"
          class="icon-btn settings-btn"
          :class="{ active: view === 'setup' }"
          :title="t('setup.openSettings')"
          @click="openSettings"
        >
          <AppIcon name="settings" size="sm" />
        </button>
        <template v-if="!setupRequired">
          <button class="read-btn" :disabled="loading" @click="loadData(false)">
            <span v-if="loading" class="spinner" />
            {{
              loading
                ? data
                  ? t("sync.syncing")
                  : t("sync.loadingData")
                : data
                  ? t("sync.resync")
                  : t("sync.loadData")
            }}
          </button>
          <button
            v-if="data"
            class="read-btn secondary"
            :title="t('common.exportTitle')"
            @click="exportData"
          >
            {{ t("common.export") }}
          </button>
          <button
            v-if="data"
            class="read-btn secondary"
            :disabled="loading"
            :title="t('common.fullSyncTitle')"
            @click="loadData(true)"
          >
            {{ t("common.full") }}
          </button>
        </template>
      </div>
    </header>

    <SyncStatusBar :syncing="loading" :on-retry="() => loadData(false)" />

    <div v-if="apiOffline" class="banner error">
      <AppIcon name="warning" size="sm" />
      {{ t("banner.apiOffline") }}
      <code>npm run dev</code>
    </div>

    <div
      v-if="health && health.setupCompleted && !health.hasGarminCredentials"
      class="banner warning"
    >
      <AppIcon name="warning" size="sm" />
      {{ t("banner.garminCredentials") }}
    </div>

    <div v-if="health && !health.hasClaudeCli" class="banner info">
      <AppIcon name="lightbulb" size="sm" />
      {{ t("banner.claudeCli") }}
      <code>claude</code>
    </div>

    <div
      v-if="health && health.hasClaudeCli && health.claudeAuth.needsLogin"
      class="banner info"
    >
      <AppIcon name="lightbulb" size="sm" />
      <span>{{ t("banner.claudeAuth") }}</span>
      <button
        type="button"
        class="banner-action"
        :disabled="claudeLoginState === 'starting'"
        @click="fixClaudeAuth"
      >
        {{
          claudeLoginState === "starting"
            ? t("banner.claudeAuthFixing")
            : t("banner.claudeAuthFix")
        }}
      </button>
      <span v-if="claudeLoginState === 'failed'" class="banner-sub">
        {{ t("banner.claudeAuthFixFailed") }}{{ claudeLoginError ? `: ${claudeLoginError}` : "" }}
        — {{ t("banner.claudeAuthManual") }}
      </span>
    </div>

    <div v-if="syncMessage" class="banner success">{{ syncMessage }}</div>

    <div v-if="error" class="banner error">{{ error }}</div>

    <div v-if="view === 'setup'" class="page-content setup-view">
      <SetupPage
        :initial="appConfig"
        :required="setupRequired"
        @saved="onConfigSaved"
        @cancel="view = 'dashboard'"
      />
    </div>

    <div
      v-else-if="view === 'dashboard' && loading && !data"
      class="loading-state"
    >
      <div class="loading-spinner" />
      <p>{{ t("loading.garminMcp") }}</p>
      <p class="loading-sub">{{ t("loading.firstFetch") }}</p>
    </div>

    <template v-if="view === 'profile'">
      <div class="page-content profile-view">
        <div v-if="profileLoading" class="profile-loading-hint">
          {{ t("loading.profile") }}
        </div>
        <div v-if="profileLoadError" class="banner warning profile-load-banner">
          {{ profileLoadError }}
          <button
            type="button"
            class="inline-retry"
            @click="loadUserProfileFromApi"
          >
            {{ t("profile.retry") }}
          </button>
        </div>
        <ProfilePage
          :profile="userProfile"
          :garmin-name="garminName()"
          @saved="onProfileSaved"
        />
      </div>
    </template>

    <template v-else-if="view === 'trainings' && data">
      <div class="page-content">
        <TrainingsPage
          :activities="data.activities"
          :initial-activity-id="pendingActivityId"
          @activity-opened="pendingActivityId = null"
        />
      </div>
    </template>

    <div
      v-else-if="view === 'trainings' && !loading && !error"
      class="empty-state"
    >
      <div class="empty-icon"><AppIcon name="workouts" size="2x" /></div>
      <h2>{{ t("empty.noTrainings") }}</h2>
      <p>{{ t("empty.noTrainingsHint") }}</p>
    </div>

    <template v-else-if="view === 'dashboard' && data">
      <div class="dashboard-layout">
        <DashboardModeToggle
          :show-details="showDetails"
          @update:show-details="setShowDetails"
        />

        <section class="dash-coach dash-recommendations">
          <Recommendations
            :recommendations="data.recommendations"
            :source="data.analysisSource"
            :usage="data.claudeUsage"
            :max-items="showDetails ? undefined : 3"
            :compact="!showDetails"
            :checking="reanalyzing"
            @reanalyze="reanalyze"
          />
        </section>

        <section class="dash-highlight">
          <SectionTitle
            :title="t('dashboard.sections.todayPlan')"
            info-key="planCard"
            tag="h2"
          />
          <TrainingPlanCard
            :activities="dashboardActivities"
            :profile="userProfile"
            :training-status="data.trainingStatus"
            :training-readiness="data.trainingReadiness"
            :vo2max="data.vo2max"
          />
        </section>

        <template v-if="!showDetails">
          <DashboardSummary
            v-if="wellnessOverview"
            :wellness="wellnessOverview"
            :week-stats="weekStats"
            :activities="dashboardActivities"
            :training-streak="trainingStreak"
          />
        </template>

        <template v-else>
          <section class="dash-overview">
            <SectionTitle
              :title="t('dashboard.sections.status')"
              info-key="statusOverview"
              tag="h2"
            />
            <WellnessCards
              :training-status="data.trainingStatus"
              :training-readiness="data.trainingReadiness"
              :vo2max="data.vo2max"
              :vo2max-history="data.vo2maxHistory"
              :readiness-history="data.readinessHistory"
              :sleep-history="data.sleepHistory"
            />
            <div class="stats-grid">
              <StatCard
                :label="t('stats.thisWeek')"
                :value="
                  plannedWeeklySessions > 0
                    ? `${weekStats?.sessions ?? 0}/${plannedWeeklySessions} ${t('common.sessions')}`
                    : `${weekStats?.sessions ?? 0} ${t('common.sessions')}`
                "
                icon="calendar"
                info-key="thisWeek"
              />
              <StatCard
                :label="t('stats.weekKm')"
                :value="`${formatNumber(weekStats?.km ?? 0, 1)} ${t('common.km')}`"
                icon="distance"
                info-key="weekKm"
              />
              <StatCard
                :label="t('stats.streak')"
                :value="`${trainingStreak} ${t('common.days')}`"
                icon="streak"
                info-key="streak"
              />
              <StatCard
                :label="t('stats.total')"
                :value="String(dashboardStats?.totalActivities ?? 0)"
                icon="workouts"
                info-key="totalActivities"
              />
              <StatCard
                :label="t('stats.weekLoad')"
                :value="
                  weekStats?.load ? Math.round(weekStats.load).toString() : '–'
                "
                icon="load"
                info-key="weekLoad"
              />
            </div>
          </section>

          <div class="dash-toolbar">
            <button
              type="button"
              class="toolbar-btn"
              @click="expandAllSections"
            >
              {{ t("dashboard.expandAll") }}
            </button>
            <button
              type="button"
              class="toolbar-btn"
              @click="collapseAllSections"
            >
              {{ t("dashboard.collapseAll") }}
            </button>
          </div>

          <CollapsibleSection
            ref="sectionRecovery"
            :title="t('dashboard.sections.recovery')"
            :summary="recoverySummary"
            info-key="recoverySection"
            storage-key="recovery"
          >
            <div class="dash-planning">
              <RecoveryPanel
                :training-status="data.trainingStatus"
                :training-readiness="data.trainingReadiness"
                :vo2max="data.vo2max"
                :sleep-data="data.sleepData"
                :health-snapshot="data.healthSnapshot"
                :sleep-history="data.sleepHistory"
                :hrv-history="data.hrvHistory"
                :stress-history="data.stressHistory"
                :body-battery-history="data.bodyBatteryHistory"
                :readiness-history="data.readinessHistory"
              />
              <WellnessHistoryPanel
                :training-status="data.trainingStatus"
                :training-readiness="data.trainingReadiness"
                :vo2max="data.vo2max"
                :sleep-data="data.sleepData"
                :health-snapshot="data.healthSnapshot"
                :sleep-history="data.sleepHistory"
                :hrv-history="data.hrvHistory"
                :stress-history="data.stressHistory"
                :body-battery-history="data.bodyBatteryHistory"
                :readiness-history="data.readinessHistory"
              />
              <TrainingStatusPanel
                :training-status-history="data.trainingStatusHistory"
              />
              <Vo2Panel
                :training-status="data.trainingStatus"
                :training-readiness="data.trainingReadiness"
                :vo2max="data.vo2max"
                :vo2max-history="data.vo2maxHistory"
              />
              <TrainingLoadPanel
                :training-status="data.trainingStatus"
                :training-readiness="data.trainingReadiness"
                :vo2max="data.vo2max"
              />
              <LoadQualityPanel :analysis="data.analysis" />
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            ref="sectionWeek"
            :title="t('dashboard.sections.week')"
            :summary="weekSummary"
            info-key="weekSection"
            :default-open="true"
            storage-key="week"
          >
            <div class="dash-two-col">
              <WeeklyProgress
                :activities="dashboardActivities"
                :profile="userProfile"
              />
              <RecentActivities
                :activities="dashboardActivities"
                @open-trainings="view = 'trainings'"
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            ref="sectionAnalytics"
            :title="t('dashboard.sections.analytics')"
            :summary="analyticsSummary"
            info-key="analyticsSection"
            storage-key="analytics"
          >
            <div class="dash-analytics">
              <WeeklyTrendChart
                class="analytics-main"
                :activities="dashboardActivities"
              />
              <TrainingHeatmap :activities="dashboardActivities" />
              <PeriodComparisonPanel :activities="dashboardActivities" />
              <ActivityTypeChart :stats="dashboardStats ?? data.stats" />
              <HrZoneSummary :activities="dashboardActivities" />
              <PaceTrendChart :activities="dashboardActivities" />
              <RoutePreviewPanel :activities="dashboardActivities" />
              <DistanceChart :activities="dashboardActivities" />
              <WeeklyLoadTrend :activities="dashboardActivities" />
              <TrainingEffectPanel :activities="dashboardActivities" />
              <DashboardMuscleBalance :activities="dashboardActivities" />
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            ref="sectionRecords"
            :title="t('dashboard.sections.insights')"
            :summary="recordsSummary"
            info-key="recordsSection"
            storage-key="records"
          >
            <div class="dash-records">
              <DataManagementPanel :data="data" @restored="reloadDashboard" />
              <RaceCalendarPanel
                :profile="userProfile"
                :race-predictions="data.racePredictions"
              />
              <PersonalRecordsPanel
                :personal-records="data.personalRecords"
                @select-activity="openActivity"
              />
              <RacePredictionsPanel
                :training-status="data.trainingStatus"
                :training-readiness="data.trainingReadiness"
                :vo2max="data.vo2max"
                :race-predictions="data.racePredictions"
              />
            </div>
          </CollapsibleSection>
        </template>
      </div>
    </template>

    <div
      v-else-if="view === 'dashboard' && !loading && !error"
      class="empty-state"
    >
      <div class="empty-icon"><AppIcon name="chart-pie" size="2x" /></div>
      <h2>{{ t("empty.welcome") }}</h2>
      <p>{{ t("empty.welcomeHint") }}</p>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  width: 100%;
  min-height: 100vh;
  padding: 0 0 4rem;
}

.header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem 1.5rem;
  margin-bottom: 0;
  padding: 0.85rem clamp(1rem, 2.5vw, 2.5rem);
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}

.brand-accent {
  color: var(--accent);
}

.main-nav {
  grid-column: 2;
  justify-self: center;
}

.header-actions {
  grid-column: 3;
  justify-self: end;
}

.header-left {
  grid-column: 1;
  justify-self: start;
  min-width: 0;
}

.banner {
  margin-left: clamp(1rem, 2.5vw, 2.5rem);
  margin-right: clamp(1rem, 2.5vw, 2.5rem);
  margin-top: 1rem;
}

.dashboard-layout {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1.25rem clamp(1rem, 2.5vw, 2.5rem) 0;
}

.dash-overview,
.dash-highlight,
.dash-recommendations,
.dash-coach {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dash-coach {
  order: -2;
}

.dash-highlight {
  order: -1;
}

.dash-recommendations :deep(.recommendations-card),
.dash-coach :deep(.recommendations-card) {
  margin: 0;
}

.overview-label {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.dash-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.toolbar-btn {
  padding: 0.4rem 0.85rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast),
    background var(--transition-fast);
}

.toolbar-btn:hover {
  color: var(--text);
  border-color: var(--border-hover);
  background: var(--surface-elevated);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.65rem;
}

.page-content {
  padding: 1.5rem clamp(1rem, 2.5vw, 2.5rem) 0;
}

.profile-view {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.profile-loading-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.profile-load-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin: 0;
}

.inline-retry {
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-elevated);
  color: var(--text);
  cursor: pointer;
  font: inherit;
  font-size: 0.8rem;
}

.dash-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stats-grid :deep(.stat-card) {
  padding: 0.85rem 1rem;
}

.stats-grid :deep(.stat-icon) {
  width: 40px;
  height: 40px;
}

.stats-grid :deep(.stat-value) {
  font-size: 1.2rem;
}

.dash-planning {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  align-items: stretch;
}

.dash-planning > * {
  min-height: 100%;
}

.dash-two-col {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 0.75rem;
  align-items: stretch;
}

.dash-two-col > * {
  min-height: 100%;
}

.dash-analytics {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 0.75rem;
}

.dash-analytics :deep(.chart-container) {
  height: 220px;
}

.dash-analytics > * {
  grid-column: span 4;
  min-width: 0;
  content-visibility: auto;
  contain-intrinsic-size: auto 280px;
}

.dash-analytics .analytics-main {
  grid-column: span 6;
}

.dash-analytics .analytics-wide {
  grid-column: span 6;
}

.dash-records {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  align-items: start;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem clamp(1rem, 2.5vw, 2.5rem);
  color: var(--text-muted);
}

@media (max-width: 1400px) {
  .dash-planning {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .header {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.85rem;
  }

  .header-left {
    grid-column: 1;
    justify-self: stretch;
  }

  .main-nav {
    grid-column: 1;
    justify-self: center;
  }

  .header-actions {
    grid-column: 1;
    justify-self: stretch;
    width: 100%;
    flex-wrap: wrap;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fill, minmax(min(160px, 100%), 1fr));
  }

  .dash-two-col,
  .dash-records,
  .dash-planning {
    grid-template-columns: minmax(0, 1fr);
  }

  .dash-analytics > * {
    grid-column: span 6;
  }

  .dash-analytics .analytics-main {
    grid-column: span 12;
  }

  .dash-analytics > * {
    grid-column: span 12;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 360px) {
  /* Icon-only nav on very narrow phones - three full labels don't fit next to
     the language selector, settings gear and sync buttons at this width. */
  .nav-btn-label {
    display: none;
  }

  .nav-btn {
    padding: 0.5rem 0.65rem;
  }
}

.main-nav {
  display: flex;
  gap: 0.25rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.25rem;
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 0.5rem 0.9rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition:
    color var(--transition-fast),
    background var(--transition-fast);
}

.nav-btn:hover:not(.active) {
  color: var(--text);
  background: var(--surface-elevated);
}

.nav-btn.active {
  background: var(--accent);
  color: #fff;
}

.nav-btn.active :deep(svg) {
  color: #fff;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  width: 46px;
  height: 46px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  flex-shrink: 0;
}

.brand-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--text);
}

.subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.82rem;
  color: var(--text-muted);
  font-weight: 500;
}

.sync-tag {
  margin-left: 0.45rem;
  padding: 0.12rem 0.5rem;
  background: var(--accent-soft);
  color: var(--accent-hover);
  border: 1px solid var(--border-hover);
  border-radius: var(--radius-sm);
  font-size: 0.68rem;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.read-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.2rem;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background var(--transition-fast),
    opacity var(--transition-fast);
}

.read-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.read-btn:disabled {
  opacity: 0.65;
  cursor: wait;
}

.read-btn.secondary {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
}

.read-btn.secondary:hover:not(:disabled) {
  border-color: var(--border-hover);
  background: var(--surface-elevated);
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.35rem;
  height: 2.35rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease;
}

.icon-btn:hover,
.icon-btn.active {
  color: var(--accent);
  border-color: var(--border-hover);
  background: rgba(34, 211, 238, 0.08);
}

.setup-view {
  padding-top: 1.5rem;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  margin-bottom: 1rem;
  font-size: 0.85rem;
}

.banner code {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.banner.warning {
  background: var(--surface);
  border: 1px solid rgba(234, 179, 8, 0.35);
  color: var(--warning);
}

.banner.info {
  background: var(--surface);
  border: 1px solid var(--border-hover);
  color: var(--accent-hover);
}

.banner.error {
  background: var(--surface);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: var(--error);
}

.banner.success {
  background: var(--surface);
  border: 1px solid rgba(34, 197, 94, 0.35);
  color: var(--success);
}

.banner-action {
  border: 1px solid currentColor;
  background: transparent;
  color: inherit;
  border-radius: 6px;
  padding: 0.25rem 0.65rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.banner-action:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
}

.banner-action:disabled {
  opacity: 0.6;
  cursor: default;
}

.banner-sub {
  flex-basis: 100%;
  font-size: 0.78rem;
  opacity: 0.85;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  margin: 0 auto 1.5rem;
}

.loading-sub {
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.empty-icon {
  margin-bottom: 1.25rem;
  color: var(--accent);
}

.empty-state h2 {
  color: var(--text);
  margin-bottom: 0.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
