import type { MessageTree } from "./types";

const en: MessageTree = {
  language: {
    label: "Language",
    de: "Deutsch",
    en: "English",
  },
  nav: {
    dashboard: "Dashboard",
    trainings: "Workouts",
    profile: "Profile",
  },
  common: {
    athlete: "Athlete",
    export: "Export",
    full: "Full sync",
    loading: "Loading…",
    close: "Close",
    all: "All",
    of: "of",
    units: "sessions",
    days: "days",
    sessions: "sessions",
    km: "km",
    hours: "h",
    other: "Other",
    resetFilter: "Reset filter",
    exportTitle: "Export dashboard data as JSON",
    fullSyncTitle: "Reload all workouts from Garmin",
  },
  sync: {
    loadData: "Load data",
    resync: "Sync again",
    syncing: "Syncing…",
    loadingData: "Loading data…",
    noNewTrainings: "No new workouts – metrics updated.",
    newTraining: "{count} new workout loaded.",
    newTrainings: "{count} new workouts loaded.",
    initialLoaded: "{count} workouts loaded initially.",
    loadError: "Failed to load",
    apiOffline:
      "API unreachable. Start the project with npm run dev (frontend + backend).",
    recommendationsUpdated: "Recommendations updated for your profile.",
    reanalyzeDone: "Re-analyzed – Claude updated the recommendations.",
    reanalyzeFallback:
      "Claude was unreachable – local rules were used instead.",
    reanalyzeNoData: "No local data yet – sync first.",
    reanalyzeClaudeOff: "Claude analysis is turned off in Settings.",
    reanalyzeError: "Re-analysis failed",
    savedLocally: "workouts saved",
    lastSynced: "Last synced",
    incremental: "Incremental",
    subtitleLoad: "Load your training data from Garmin Connect",
    retry: "Retry",
  },
  banner: {
    apiOffline:
      "API server unreachable (port 3001). Run npm run dev in the project folder — not Vite alone. Stop old processes with Ctrl+C if needed.",
    garminCredentials:
      "Garmin credentials missing – open Settings (gear icon) and enter email and password.",
    claudeCli:
      "Claude CLI not found – using rule-based coaching tips. Set the path in Settings or install claude.",
    claudeAuth:
      "Claude CLI session expired – using rule-based coaching tips until you sign in again.",
    claudeAuthFix: "Sign in",
    claudeAuthFixing: "Opening sign-in…",
    claudeAuthFixFailed: "Could not open the sign-in window",
    claudeAuthManual: "Run `claude auth login` in a terminal instead.",
  },
  setup: {
    title: "Settings",
    welcomeTitle: "Welcome – Setup",
    subtitle: "Configure Garmin access, Claude CLI, and server options.",
    welcomeSubtitle:
      "Before you start, enter your Garmin Connect credentials. Everything is stored locally on your machine.",
    garminSection: "Garmin Connect",
    garminHint:
      "Same credentials as the Garmin Connect app – used locally for sync only.",
    garminEmail: "Garmin email",
    garminPassword: "Garmin password",
    passwordPlaceholder: "Enter password",
    passwordKeep: "Leave blank to keep saved password",
    claudeSection: "Claude CLI (optional)",
    claudeHint:
      "For clearer AI coaching recommendations. Without Claude, local rules are used.",
    claudePath: "Path to claude executable",
    claudePathPlaceholder:
      "e.g. C:\\Users\\…\\AppData\\Roaming\\npm\\claude.cmd",
    claudeModel: "Model",
    claudeModelHint:
      "Model used for the coaching analysis. Haiku is enough for this task and the cheapest option.",
    claudeModelDefault: "CLI default",
    claudeModelRecommended: "recommended",
    claudeModelCustom: "Other model…",
    claudeModelCustomLabel: "Model id",
    claudeModelCustomPlaceholder: "e.g. claude-sonnet-5",
    claudeModelCustomHint: 'Model id or alias as accepted by "claude --model".',
    claudeFallbackModel: "Fallback model",
    claudeFallbackNone: "None",
    claudeFallbackHint:
      "Used when the primary model is overloaded or unavailable – otherwise the analysis drops back to the local rules.",
    claudeEffort: "Reasoning effort",
    claudeEffortHint:
      'The coaching analysis is a small task – "low" is enough and fastest.',
    effortLow: "Low (recommended)",
    effortMedium: "Medium",
    effortHigh: "High",
    claudeMaxCost: "Cost limit per call ($)",
    claudeMaxCostHint: "0 = no limit. Applies on top of the timeout.",
    claudeTest: "Test Claude",
    claudeTesting: "Testing…",
    claudeTestHint:
      "Saves the Claude settings and runs a real test call: path, flags, model and JSON response.",
    claudeTestDefaultModel: "default model",
    claudeTestLegacy: "legacy mode (CLI does not know the new flags)",
    claudeTestFailed: "Claude test failed",
    analysisMode: "Analysis mode",
    analysisSmart: "Smart (recommended)",
    analysisSmartHint:
      "Claude only when data meaningfully changes – saves tokens.",
    analysisAlways: "Always",
    analysisAlwaysHint: "New AI analysis on every sync.",
    analysisOff: "Off",
    analysisOffHint: "Rule-based recommendations only, no Claude.",
    maxActivities: "Max activities in AI prompt",
    serverSection: "Server",
    serverHint:
      "API port for backend and Vite proxy. Port changes apply after server restart.",
    port: "Port",
    configPath: "Config file",
    save: "Save",
    saving: "Saving…",
    saved: "Settings saved.",
    savedPortChanged: "Saved. Port changed – restart the server (npm run dev).",
    saveError: "Failed to save",
    loadError: "Could not load settings",
    emailRequired: "Garmin email is required.",
    passwordRequired: "Garmin password is required.",
    backToDashboard: "Back to dashboard",
    openSettings: "Settings",
    languageSection: "Language",
    language: "Display language",
    languageHint: "Default is English. Saved in your config file.",
    syncSection: "Sync & data",
    syncHint: "Controls how many workouts and metrics are fetched and cached.",
    maxActivitiesLimit: "Max workouts (full sync)",
    maxActivitiesLimitHint: "Cap on first or full sync (50–2000).",
    metricsHistoryDays: "Metrics history (days)",
    metricsHistoryDaysHint:
      "HRV, stress, sleep, VO₂ history range (7–365 days).",
    incrementalSyncBufferDays: "Incremental sync buffer (days)",
    incrementalSyncBufferDaysHint:
      "Extra look-back days on partial sync – avoids gaps.",
    detailCacheDays: "Activity detail cache (days)",
    detailCacheDaysHint: "Keep splits/exercises cached (1–90 days).",
    claudeTimeout: "Claude timeout (seconds)",
    claudeTimeoutHint: "Max wait for Claude CLI (30–600 s).",
    garminSessionIdle: "Garmin session idle (minutes)",
    garminSessionIdleHint: "Close MCP connection after inactivity (1–120 min).",
    autoSyncSection: "Automatic sync",
    autoSyncHint:
      "Periodically fetch new workouts in the background. Requires the server to stay running.",
    autoSyncEnabled: "Enable automatic sync",
    autoSyncOnStartup: "Sync on server startup",
    autoSyncInterval: "Sync interval (minutes)",
    autoSyncIntervalHint: "Minimum 15 minutes. Default: 360 (6 hours).",
    syncOnStartup: "Sync & re-run AI analysis on every startup",
    syncOnStartupHint:
      "Independent of automatic sync: fetches fresh Garmin data on every app launch and re-evaluates it (Claude call depends on the analysis mode). Default: off.",
    testGarmin: "Test Garmin login",
    testingGarmin: "Testing…",
    garminTestOk: "Garmin login successful.",
    garminTestOkName: "Logged in as {name}.",
    garminTestFail: "Garmin login failed.",
  },
  loading: {
    garminMcp: "Starting Garmin MCP server…",
    firstFetch: "First fetch may take a moment",
    profile: "Loading profile…",
    details: "Loading additional details…",
    detailsError: "Could not load details",
  },
  empty: {
    noTrainings: "No workouts",
    noTrainingsHint: "Load your Garmin data first to view workout details.",
    welcome: "Welcome!",
    welcomeHint:
      "Click Load data for the first fetch. After that, only new workouts are fetched – much faster.",
    noRecent: "No workouts loaded yet.",
    selectTraining: "Select a workout from the list.",
    noFilterResults: "No workouts match this filter.",
  },
  stats: {
    thisWeek: "This week",
    weekKm: "Weekly km",
    streak: "Training streak",
    total: "Total",
    weekLoad: "Weekly load",
  },
  dashboard: {
    expand: "Expand section",
    collapse: "Collapse section",
    expandAll: "Expand all",
    collapseAll: "Collapse all",
    chartCount: "{count} charts",
    recommendationsCount: "{count} recommendations",
    mode: {
      label: "Dashboard view",
      summary: "Overview",
      details: "Details",
      toggle: "Toggle detailed dashboard view",
      summaryHint:
        "Compact view with the most important metrics and coaching tips.",
      detailsHint:
        "Full view with charts, history, analytics, and all Garmin metrics.",
    },
    summary: {
      title: "Key metrics at a glance",
      lastWorkout: "Latest workout",
    },
    intro: {
      title: "Your Garmin data coach",
      subtitle:
        "Garmin Connect shows lots of numbers – here we explain them clearly and give actionable tips. Tap ℹ️ on any metric to learn what it means.",
      subtitleCompact:
        "Your essentials and improvement tips in one place. Turn on Details for charts, trends, and full metrics.",
    },
    sections: {
      status: "Your metrics explained",
      todayPlan: "What makes sense today",
      recovery: "Understanding recovery",
      week: "Weekly progress",
      analytics: "Trends & patterns",
      insights: "Records & predictions",
      recommendations: "Coach recommendations",
    },
  },
  recovery: {
    title: "Recovery & sleep",
    sleep: "Sleep score",
    total: "Total",
    bodyBattery: "Body battery",
    stress: "Stress",
    restingHr: "Resting HR",
    hrv: "HRV (weekly)",
    recoveryTime: "Recovery time",
    readinessFactors: "Readiness factors",
  },
  performance: {
    vo2title: "VO₂ max",
    vo2cycling: "Cycling VO₂",
    fitnessAge: "Fitness age",
    heat: "Heat acclimation",
    vo2hint: "Trend appears after several syncs with VO₂ history.",
    loadTitle: "Training load",
    acute: "Acute",
    chronic: "Chronic",
    loadBalance: "Load balance (28 days)",
    loadTrend: "Load trend (8 weeks)",
    trainingLoad: "Training load",
    racePredictions: "Race predictions (Garmin)",
  },
  plan: {
    title: "Recommended today",
    focus: "Focus",
    intensity: {
      rest: "Rest",
      easy: "Easy",
      moderate: "Moderate",
      hard: "Hard",
    },
    scheduledToday: "Today's plan",
    scheduleOpen: "Open",
    scheduleDone: "Done",
    sessionTypes: {
      other: "Other",
      rest: "Rest day",
    },
    disciplines: {
      running: "Running",
      strength: "Strength",
      swimming: "Swimming",
    },
    focusOptions: {
      recovery: "Recovery",
      catchUpSleep: "Catch up on sleep",
      tempoOrIntervals: "Tempo or intervals",
      planRun: "Plan a run",
      progressiveOverload: "Progressive overload",
      strengthSession: "Strength session",
      qualityRunOrStrength: "Quality run or strength",
      weaknessDiscipline: "Train your weakest discipline",
      qualitySession: "Quality session",
      continuePlan: "Continue plan",
    },
    messages: {
      restDay: {
        title: "Recovery day",
        description:
          "Readiness and load suggest rest or very light movement (a walk, mobility work).",
      },
      easySession: {
        title: "Easy session",
        description:
          "Sleep score {sleep}/100 – no hard training. Go for an easy zone-2 session or technique work.",
      },
      qualityDay: {
        title: "Good day for quality",
        description:
          "Readiness {readiness}/100 – ideal for more intense sessions or extra volume.",
      },
      weeklyGap: {
        title: "Focus: {label}",
        description:
          "Weekly target: {actual}/{target} {label} sessions – a moderate {label} session fits today.",
      },
      balanced: {
        title: "Balanced session",
        description:
          "Readiness {readiness}/100 – normal training intensity per your plan.",
      },
    },
  },
  pr: {
    types: {
      "1km": "1 km",
      "1mile": "1 mile",
      "5km": "5 km",
      "10km": "10 km",
      halfMarathon: "Half marathon",
      marathon: "Marathon",
      longestDistance: "Longest distance",
      longestRide: "Longest ride",
      fastest100m: "Fastest 100m",
      "400m": "400m",
    },
  },
  muscle: {
    chest: "Chest",
    back: "Back",
    shoulders: "Shoulders",
    traps: "Traps",
    biceps: "Biceps",
    triceps: "Triceps",
    forearms: "Forearms",
    core: "Core",
    legs: "Legs",
    hamstrings: "Hamstrings",
    glutes: "Glutes",
    calves: "Calves",
    fullBody: "Full body",
    other: "Other",
  },
  wellness: {
    trainingStatus: "Training status",
    readiness: "Readiness",
    vo2max: "VO₂ max",
    sleepScore: "Sleep score",
    load: "Load",
    historyHint: "Click for history",
    vo2HistoryTitle: "VO₂ max history",
    sleepHistoryTitle: "Sleep score history",
    readinessHistoryTitle: "Readiness history",
    historyEmpty: "Not enough history yet (need at least 2 synced days).",
  },
  wellnessHistory: {
    title: "Recovery trends (84 days)",
    hrv: "HRV trend",
    stress: "Stress trend",
    bodyBattery: "Body battery trend",
    sleepDuration: "Sleep duration trend",
  },
  trainingEffect: {
    title: "Training effect",
    hint: "Aerobic/anaerobic per session – how hard Garmin rated your workouts.",
    aerobic: "Aerobic",
    anaerobic: "Anaerobic",
    recent: "Recent sessions",
    weekly: "Weekly average",
  },
  trainingStatusHistory: {
    title: "Training status history",
    hint: "Saved on each sync – Garmin does not provide status history directly.",
  },
  raceCalendar: {
    title: "Race calendar",
    hint: "Planned races from your profile compared to Garmin predictions.",
    name: "Race name",
    date: "Date",
    distance: "Distance",
    targetTime: "Target time (mm:ss or h:mm:ss)",
    target: "Target",
    prediction: "Garmin prediction",
    inDays: "in {count} days",
    past: "past",
    add: "Add race",
    remove: "Remove",
    distances: {
      "5k": "5K",
      "10k": "10K",
      halfMarathon: "Half marathon",
      marathon: "Marathon",
      other: "Other",
    },
  },
  charts: {
    weeklyTrend: "Weekly trend (8 weeks)",
    kilometers: "Kilometers",
    distancePerActivity: "Distance per workout",
    distanceKm: "Distance (km)",
    activityTypes: "Activity types",
    hrZones: "HR zones (28 days)",
    hrZonesHint: "{count} cardio sessions aggregated",
    muscleBalanceHint: "Strength training in the last 7 days",
    hrZonesActivity: "Heart rate zones",
    hrZonesEmpty: "No HR zone data available",
    splits: "Kilometer splits",
    splitsEmpty: "No split data available",
    paceLabel: "Pace (min/km)",
    muscleGroups: "Muscle groups",
    muscleGroupsAria: "Muscle group body diagram",
    musclePrimary: "Primary",
    muscleSecondary: "Secondary",
    muscleInactive: "Inactive",
    bodyFront: "Front",
    bodyBack: "Back",
  },
  hrZones: {
    z1: "Z1 Recovery",
    z2: "Z2 Base",
    z3: "Z3 Tempo",
    z4: "Z4 Threshold",
    z5: "Z5 Max",
    zone1: "Zone 1 (Recovery)",
    zone2: "Zone 2 (Base)",
    zone3: "Zone 3 (Tempo)",
    zone4: "Zone 4 (Threshold)",
    zone5: "Zone 5 (Maximum)",
  },
  progress: {
    title: "Weekly progress",
    hint: "Last 7 days vs. profile targets",
    running: "Running",
    cycling: "Cycling",
    strength: "Strength",
    swimming: "Swimming",
    kilometers: "Kilometers",
    hours: "Hours",
  },
  recent: {
    title: "Recent workouts",
    showAll: "Show all →",
  },
  records: {
    title: "Personal records",
  },
  recommendations: {
    title: "What you should know today",
    subtitle:
      "Clear explanations and actionable tips – instead of Garmin Connect confusion.",
    subtitleCompact:
      "Top coaching tips based on your current data – prioritized by importance.",
    moreInDetails: "+{count} more tips in Details view.",
    hint: "Based on Garmin data and your profile. With Claude CLI, tips are even more personalized.",
    empty:
      "No recommendations yet – load your Garmin data to get personalized coaching tips.",
    sourceClaude: "Claude coach",
    tokens: "tokens",
    localAdded: "+{count} local rule",
    reanalyze: "Check data",
    reanalyzing: "Checking…",
    reanalyzeHint:
      "Asks Claude again directly, bypassing the smart-mode cache. Can take up to a few minutes.",
    sourceLocal: "Rule-based",
    category: {
      training: "Training",
      recovery: "Recovery",
      performance: "Performance",
      general: "General",
    },
    priority: {
      high: "High",
      medium: "Medium",
      low: "Low",
    },
  },
  trainings: {
    title: "Workouts",
    search: "Search workouts…",
    searchAria: "Search workouts",
    clickHint: "Click for details",
    setsCount: "{count} sets",
  },
  activityTypes: {
    running: "Running",
    cycling: "Cycling",
    swimming: "Swimming",
    strength_training: "Strength",
    walking: "Walking",
    hiking: "Hiking",
    elliptical: "Elliptical",
    yoga: "Yoga",
    unknown: "Other",
  },
  detail: {
    duration: "Duration",
    calories: "Calories",
    distance: "Distance",
    avgHr: "Avg HR",
    maxHr: "Max HR",
    avgPace: "Avg pace",
    elevation: "Elevation gain",
    sets: "Sets",
    reps: "Reps",
    bestKm: "Best km",
    gapPace: "GAP pace",
    laps: "Laps",
    trainingEffect: "Training effect",
    aerobic: "Aerobic",
    anaerobic: "Anaerobic",
    exercises: "Exercises",
    exercise: "Exercise",
    maxWeight: "Max weight",
    volume: "Volume",
    muscleGroups: "Muscle groups trained",
    setsReps: "{sets} sets · {reps} reps",
  },
  profile: {
    title: "Training profile",
    subtitle:
      "Choose your training type – weekly targets adjust automatically.",
    garmin: "Garmin",
    plannedSessions: "{count} sessions / week planned",
    personal: "Personal",
    displayName: "Display name",
    bodySection: "Body data",
    bodyHint:
      "The basis for personal thresholds: HR zones and VO₂max reference. All optional – missing values are taken from Garmin or estimated.",
    birthYear: "Year of birth",
    sex: "Sex",
    sexUnspecified: "Not specified",
    sexMale: "Male",
    sexFemale: "Female",
    heightCm: "Height (cm)",
    weightKg: "Weight (kg)",
    weightPlaceholder: "empty = from Garmin",
    maxHr: "Max HR (bpm)",
    maxHrHint: "Leave empty to estimate from age (208 − 0.7 × age).",
    maxHrEstimate: "estimated: {value}",
    restingHr: "Resting HR (bpm)",
    optionalPlaceholder: "optional",
    displayNamePlaceholder: "e.g. Alex",
    athleteType: "Training type",
    athleteTypeHint: "What best describes your training?",
    customType: "Custom label",
    customTypePlaceholder: "e.g. CrossFit, climbing, yoga focus",
    weeklyGoals: "Weekly targets for “{type}”",
    weeklyGoalsHint:
      "Set how many sessions per week you aim for in each discipline. Leave empty = no target.",
    weeklySchedule: "Weekly schedule (optional)",
    weeklyScheduleHint:
      "Assign a fixed session to individual weekdays, e.g. Monday strength, Tuesday running. Days you set show up on the dashboard on that day, including whether the session is already done.",
    weekdays: {
      mon: "Mon",
      tue: "Tue",
      wed: "Wed",
      thu: "Thu",
      fri: "Fri",
      sat: "Sat",
      sun: "Sun",
    },
    otherSection: "Other",
    otherHint: "Always available – e.g. yoga, mobility, climbing, team sports.",
    otherSessions: "Other sessions / week",
    otherDescription: "What is “Other”?",
    otherDescriptionPlaceholder: "e.g. yoga, stretching, bouldering",
    experience: "Experience & intensity",
    experienceLevel: "Experience level",
    preferredIntensity: "Preferred intensity",
    remarks: "Custom notes & AI context",
    customRemarks: "Custom remarks",
    customRemarksPlaceholder:
      "Free text about your training – e.g. push/pull/legs split, mornings only, …",
    injuryNotes: "Injuries / limitations",
    injuryNotesPlaceholder: "e.g. knee issues, no jumping",
    personalNotes: "Personal notes for AI recommendations",
    personalNotesPlaceholder: "e.g. marathon in October, sub-45 min 10k focus",
    plannedRaces: "Planned races",
    plannedRacesHint:
      "Add races – the dashboard compares them with Garmin predictions.",
    save: "Save profile",
    saving: "Saving…",
    saved: "Profile saved.",
    savedWithRecs: "Profile saved – recommendations updated for your plan.",
    savedClaudePending:
      "Profile saved – AI recommendations are updating in the background.",
    saveError: "Save failed",
    loadError: "Could not load profile from server – showing defaults.",
    retry: "Retry",
    athleteTypes: {
      bodybuilding: {
        label: "Bodybuilding / Strength",
        description: "Focus muscle building, strength sessions, volume",
      },
      runner: {
        label: "Runner",
        description: "Running, pace, distance goals",
      },
      cyclist: {
        label: "Cycling",
        description: "Ride sessions, distance, endurance",
      },
      swimmer: {
        label: "Swimming",
        description: "Swim sessions, technique, endurance",
      },
      hybrid: {
        label: "Hybrid",
        description: "Running + strength – both configurable",
      },
      triathlon: {
        label: "Triathlon",
        description: "Run, bike, swim combined",
      },
      general: {
        label: "General fitness",
        description: "Varied, flexible",
      },
      other: {
        label: "Other",
        description: "Custom – define everything yourself",
      },
    },
    experienceLevels: {
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
    },
    intensity: {
      easy: "Easy & restorative",
      balanced: "Balanced",
      hard: "Ambitious & intense",
    },
    targets: {
      runningSessions: "Running sessions / week",
      cyclingSessions: "Cycling sessions / week",
      strengthSessions: "Strength sessions / week",
      swimmingSessions: "Swim sessions / week",
      weeklyKm: "Kilometers / week",
      weeklyHours: "Hours / week",
    },
  },
  analytics: {
    muscleBalance: "Strength muscle balance (7 days)",
    muscleBalanceHint: "Muscle groups trained in recent strength sessions.",
    heatmap: "Training heatmap",
    heatmapHint: "Activity count per day over the last 84 days.",
    less: "Less",
    more: "More",
    periodCompare: "Period comparison",
    period: {
      thisWeek: "This week",
      lastWeek: "Last week",
      avg4w: "4-week avg",
      sessions: "Sessions",
      km: "Kilometers",
      hours: "Hours",
      load: "Training load",
    },
    paceTrend: "Pace trend",
    paceTrendHint: "Average pace of recent cardio sessions (lower = faster).",
    paceAxis: "Pace (min/km)",
    minPerKm: "min/km",
    routePreview: "Route preview",
    selectActivity: "Activity",
    routeEmpty: "No GPS route available for this activity.",
    routeError: "Could not load route.",
  },
  data: {
    title: "Data & export",
    hint: "Export workouts, download a full backup, or restore from a previous backup.",
    exportActivitiesCsv: "Activities (CSV)",
    exportWeeklyCsv: "Weekly stats (CSV)",
    exportJson: "Dashboard (JSON)",
    backup: "Download backup",
    restore: "Restore backup",
    restoring: "Restoring…",
    backupDone: "Backup downloaded.",
    backupError: "Backup failed.",
    restoreError: "Restore failed.",
    importCsv: "Import activities (CSV)",
    importEmpty: "No valid rows found in CSV.",
    importDone: "{count} activities imported.",
    importError: "Import failed.",
  },
  loadQuality: {
    title: "Load quality",
    subtitle:
      "Computed from your sessions – numbers Garmin Connect does not report.",
    monotony: "Monotony",
    monotonyHint: "{sessions} sessions, {rest} rest days in 7 days",
    strain: "Strain",
    strainHint: "This week {acute} vs. avg {chronic}",
    loadTrend: "Load trend",
    loadTrendHint: "This week vs. the 3 weeks before",
    intensity: "Intensity easy/moderate/hard",
    verdict: {
      "too-hard":
        "Not enough real easy volume – 75–85 % easy is the usual target.",
      balanced: "Good balance between easy and intense work.",
      "too-easy": "Almost everything easy – targeted hard stimuli are missing.",
    },
    loadSource: {
      estimated:
        "Training load estimated from duration and heart rate – Garmin reports none for these sessions.",
      duration:
        "Training load derived from duration only – without heart rate this is a rough approximation.",
      none: "No training load available.",
    },
    missingBody:
      "For a sharper analysis the profile is missing: {fields}. Those values are estimated for now.",
  },
  info: {
    loadQuality:
      "Metrics computed from your raw data: Foster monotony and strain, intensity distribution from the HR zones, plus protein and energy availability relative to your body weight.",
    monotony:
      "Monotony = mean daily load divided by its standard deviation (7 days). Above 2 means every day carries a similar load. Contrast between hard and genuinely easy days is absorbed better than a constant medium load.",
    strain:
      "Strain = weekly load × monotony. High values come from high volume without recovery contrast and correlate with more infections and overuse complaints.",
    intensityDistribution:
      "How your training time is distributed across heart rate zones (28 days). Easy = zones 1–2, moderate = zone 3, hard = zones 4–5. Around 75–85 % easy is the established pattern.",
    learnMore: "What does this mean?",
    recommendations:
      "Personalized coaching tips from your Garmin data. Claude explains what the numbers mean and what you can do – clearer than Garmin Connect.",
    todayPlan:
      "Daily recommendation based on readiness, sleep, load, and your weekly plan. Tells you whether rest, easy, or hard training makes sense today.",
    statusOverview:
      "Your key Garmin metrics at a glance. Each metric has an ℹ️ with an explanation – so you understand what Garmin is telling you.",
    trainingStatus:
      "Garmin evaluates whether your current training pattern is productive: e.g. “Productive”, “Recovery”, or “Overreaching”. Shows if you are progressing or training too much.",
    readiness:
      "Training Readiness (0–100): How ready your body is for load today. Low = prioritize recovery; high = good day for quality or volume.",
    vo2max:
      "VO₂ max estimates your maximum oxygen uptake – an indicator of endurance. Rises with consistent training, drops after long breaks.",
    sleepScore:
      "Sleep score (0–100): Rates sleep duration, quality, and recovery. Poor sleep lowers readiness and raises injury risk – often more important than an extra workout.",
    thisWeek:
      "Number of workouts in the last 7 days. Helps check if you are following your weekly plan.",
    weekKm:
      "Total distance of all sessions this week in kilometers. A key volume indicator for runners, cyclists, and triathletes.",
    streak:
      "Consecutive days with at least one activity. Encourages consistency – but rest days matter just as much.",
    totalActivities:
      "Total synced workouts in your local database. More history means better trends and recommendations.",
    weekLoad:
      "Sum of training load this week. Garmin weights intensity and duration – higher means more total stress, not automatically “better”.",
    recoverySection:
      "Deeper look at recovery and sleep. See whether your body is ready for harder training or needs rest.",
    sleep:
      "Sleep score and stages (deep, REM, light). Good sleep is the foundation for adapting to training and faster recovery.",
    bodyBattery:
      "Garmin estimate of your energy reserve (0–100). Drops with stress and load, rises with rest and sleep.",
    stress:
      "Average daily stress level. Chronically high stress hurts recovery and training quality.",
    restingHr:
      "Resting heart rate in beats per minute. Long-term decrease = good endurance sign; sudden increase may mean overload or illness.",
    hrv: "Heart rate variability (ms): Measures nervous system recovery. Higher values usually mean better regeneration.",
    recoveryTime:
      "Garmin estimate of hours until full recovery after recent load. Do not ignore before hard sessions.",
    readinessFactors:
      "Shows what influences your readiness score: sleep, recovery time, load (ACWR), HRV, stress, and sleep trend.",
    vo2Panel:
      "Your current VO₂ max and trend. Long-term trend matters more than single-day values.",
    fitnessAge:
      "Garmin compares your fitness to your age group average. Lower = fitter than typical for your age.",
    heatAcclimation:
      "How adapted your body is to heat. Relevant for summer training and warm-weather races.",
    acwr: "Acute:Chronic Workload Ratio – compares short-term (7 days) vs long-term (28 days) load. Optimal is usually 0.8–1.3; above that, injury risk rises.",
    acuteLoad:
      "Acute load over ~7 days. Shows how hard you are training right now.",
    chronicLoad:
      "Chronic load over ~28 days. Your training baseline – rises slowly with consistent volume.",
    loadBalance:
      "Garmin compares your load in low/high aerobic and anaerobic zones to target ranges – shows gaps in your training mix.",
    trainingLoad:
      "Training load combines intensity and volume. ACWR compares short- vs long-term load – the key value to avoid overtraining.",
    weekSection:
      "Progress vs weekly goals and recent sessions. Practical for seeing what is still missing.",
    weeklyProgress:
      "Compares your actual sessions this week to profile targets (e.g. 3× run, 2× strength).",
    recentActivities:
      "Your latest workouts – click for details like HR zones, splits, and muscle groups.",
    analyticsSection:
      "Charts and trends over several weeks. Helps spot patterns hidden in Garmin Connect.",
    weeklyTrend:
      "Kilometers and sessions per week over 8 weeks. Shows whether volume is rising, falling, or stable.",
    activityTypes:
      "Distribution of workout types. Important for balance – e.g. too little strength with lots of running.",
    hrZones:
      "Aggregated HR zones from cardio sessions in the last 28 days. Shows if you train enough easy base (Zone 2).",
    distanceChart:
      "Distance per individual activity – good for spotting outliers and typical session lengths.",
    weeklyLoadTrend:
      "Training load per week over 8 weeks. Shows load peaks and recovery phases.",
    recordsSection:
      "Personal bests and Garmin race predictions – easier to interpret here than in Connect.",
    personalRecords:
      "Your Garmin personal records (PRs) – fastest times and longest distances. Click opens the linked workout.",
    racePredictions:
      "Garmin estimates race times (5K, 10K, half, marathon) from training and VO₂ max. Guidance only, not a guarantee.",
    planCard:
      "Automatic daily recommendation: combines readiness, sleep, ACWR, and weekly goals into concrete advice for today.",
    wellnessHistory:
      "84-day trends for HRV, stress, body battery, and sleep duration – from Garmin, visualized clearly.",
    trainingEffect:
      "Garmin training effect (aerobic/anaerobic) per workout and as weekly averages – intensity beyond distance.",
    trainingStatusHistory:
      "Locally stored training status history on each sync, since Garmin provides no status history API.",
    raceCalendar:
      "Your planned races from profile compared to Garmin target times and predictions.",
    muscleBalance:
      "Shows which muscle groups you trained in strength workouts over the last 7 days – helps spot gaps in your program.",
    heatmap:
      "GitHub-style calendar of training days. Darker cells mean more sessions or higher load on that day.",
    periodCompare:
      "Compares this week vs last week and your 4-week average for sessions, km, hours, and load.",
    paceTrend:
      "Pace over recent runs, rides, and walks. Useful for spotting fitness gains or fatigue.",
    routePreview:
      "Simple GPS trace of a recent cardio activity. Requires route data from Garmin Connect.",
    dataExport:
      "Export activities as CSV/JSON, download a full local backup, restore, or import activities from CSV.",
  },
};

export default en;
