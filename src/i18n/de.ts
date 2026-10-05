import type { MessageTree } from "./types";

const de: MessageTree = {
  language: {
    label: "Sprache",
    de: "Deutsch",
    en: "English",
  },
  nav: {
    dashboard: "Dashboard",
    trainings: "Trainings",
    profile: "Profil",
  },
  common: {
    athlete: "Athlet",
    export: "Export",
    full: "Vollständig",
    loading: "Lade…",
    close: "Schließen",
    all: "Alle",
    of: "von",
    units: "Einheiten",
    days: "Tage",
    sessions: "Einheiten",
    km: "km",
    hours: "h",
    other: "Sonstiges",
    resetFilter: "Filter zurücksetzen",
    exportTitle: "Dashboard-Daten als JSON exportieren",
    fullSyncTitle: "Alle Trainings neu von Garmin laden",
  },
  sync: {
    loadData: "Daten laden",
    resync: "Neu synchronisieren",
    syncing: "Synchronisiere…",
    loadingData: "Lade Daten…",
    noNewTrainings: "Keine neuen Trainings – Metriken aktualisiert.",
    newTraining: "{count} neues Training geladen.",
    newTrainings: "{count} neue Trainings geladen.",
    initialLoaded: "{count} Trainings initial geladen.",
    loadError: "Fehler beim Laden",
    apiOffline:
      "API nicht erreichbar. Starte das Projekt mit npm run dev (Frontend + Backend).",
    recommendationsUpdated: "Empfehlungen an dein Profil angepasst.",
    reanalyzeDone: "Neu analysiert – Claude hat die Empfehlungen aktualisiert.",
    reanalyzeFallback:
      "Claude war nicht erreichbar – lokale Regeln wurden verwendet.",
    reanalyzeNoData: "Noch keine lokalen Daten – zuerst synchronisieren.",
    reanalyzeClaudeOff: "Claude-Analyse ist in den Einstellungen deaktiviert.",
    reanalyzeError: "Neuanalyse fehlgeschlagen",
    savedLocally: "Trainings gespeichert",
    lastSynced: "Zuletzt synchronisiert",
    incremental: "Inkrementell",
    subtitleLoad: "Lade deine Trainingsdaten von Garmin Connect",
    retry: "Erneut versuchen",
  },
  banner: {
    apiOffline:
      "API-Server nicht erreichbar (Port 3001). Starte im Projektordner: npm run dev — nicht nur Vite alleine. Alte Prozesse ggf. mit Ctrl+C beenden.",
    garminCredentials:
      "Garmin-Zugangsdaten fehlen – öffne die Einstellungen (Zahnrad) und trage E-Mail und Passwort ein.",
    claudeCli:
      "Claude CLI nicht gefunden – es werden regelbasierte Coach-Tipps genutzt. Pfad in den Einstellungen anpassen oder claude installieren.",
    claudeAuth:
      "Claude-CLI-Sitzung abgelaufen – bis zur erneuten Anmeldung werden regelbasierte Coach-Tipps genutzt.",
    claudeAuthFix: "Anmelden",
    claudeAuthFixing: "Anmeldung wird geöffnet…",
    claudeAuthFixFailed: "Anmeldefenster konnte nicht geöffnet werden",
    claudeAuthManual: "Stattdessen `claude auth login` in einem Terminal ausführen.",
  },
  setup: {
    title: "Einstellungen",
    welcomeTitle: "Willkommen – Einrichtung",
    subtitle: "Passe Garmin-Zugang, Claude CLI und Server-Optionen an.",
    welcomeSubtitle:
      "Bevor du startest, hinterlege deine Garmin Connect Zugangsdaten. Alles wird lokal auf deinem Rechner gespeichert.",
    garminSection: "Garmin Connect",
    garminHint:
      "Gleiche Zugangsdaten wie in der Garmin Connect App – werden nur lokal für den Sync genutzt.",
    garminEmail: "Garmin E-Mail",
    garminPassword: "Garmin Passwort",
    passwordPlaceholder: "Passwort eingeben",
    passwordKeep: "Leer lassen = gespeichertes Passwort behalten",
    claudeSection: "Claude CLI (optional)",
    claudeHint:
      "Für verständlichere KI-Coach-Empfehlungen. Ohne Claude werden lokale Regeln genutzt.",
    claudePath: "Pfad zur claude.exe",
    claudePathPlaceholder:
      "z. B. C:\\Users\\…\\AppData\\Roaming\\npm\\claude.cmd",
    claudeModel: "Modell",
    claudeModelHint:
      "Modell für die Coaching-Analyse. Haiku reicht für diese Aufgabe und ist am günstigsten.",
    claudeModelDefault: "Standard der CLI",
    claudeModelRecommended: "empfohlen",
    claudeModelCustom: "Anderes Modell…",
    claudeModelCustomLabel: "Modell-ID",
    claudeModelCustomPlaceholder: "z. B. claude-sonnet-5",
    claudeModelCustomHint:
      "Modell-ID oder Alias, wie von „claude --model“ akzeptiert.",
    claudeFallbackModel: "Ersatzmodell",
    claudeFallbackNone: "Keines",
    claudeFallbackHint:
      "Wird genutzt, wenn das Hauptmodell überlastet oder nicht verfügbar ist – sonst fällt die Analyse auf lokale Regeln zurück.",
    claudeEffort: "Denkaufwand",
    claudeEffortHint:
      "Die Coaching-Analyse ist eine kleine Aufgabe – „niedrig“ reicht und ist am schnellsten.",
    effortLow: "Niedrig (empfohlen)",
    effortMedium: "Mittel",
    effortHigh: "Hoch",
    claudeMaxCost: "Kostenlimit pro Aufruf ($)",
    claudeMaxCostHint: "0 = kein Limit. Greift zusätzlich zum Timeout.",
    claudeTest: "Claude testen",
    claudeTesting: "Teste…",
    claudeTestHint:
      "Speichert die Claude-Einstellungen und führt einen echten Testaufruf aus: Pfad, Flags, Modell und JSON-Antwort.",
    claudeTestDefaultModel: "Standardmodell",
    claudeTestLegacy: "Legacy-Modus (CLI kennt die neuen Flags nicht)",
    claudeTestFailed: "Claude-Test fehlgeschlagen",
    analysisMode: "Analyse-Modus",
    analysisSmart: "Smart (empfohlen)",
    analysisSmartHint: "Claude nur bei relevanten Änderungen – spart Tokens.",
    analysisAlways: "Immer",
    analysisAlwaysHint: "Bei jedem Sync eine neue KI-Analyse.",
    analysisOff: "Aus",
    analysisOffHint: "Nur regelbasierte Empfehlungen, kein Claude.",
    maxActivities: "Max. Aktivitäten im KI-Prompt",
    serverSection: "Server",
    serverHint:
      "API-Port für Backend und Vite-Proxy. Änderung erst nach Server-Neustart aktiv.",
    port: "Port",
    configPath: "Konfigurationsdatei",
    save: "Speichern",
    saving: "Speichere…",
    saved: "Einstellungen gespeichert.",
    savedPortChanged:
      "Gespeichert. Port-Änderung: Server neu starten (npm run dev).",
    saveError: "Speichern fehlgeschlagen",
    loadError: "Einstellungen konnten nicht geladen werden",
    emailRequired: "Garmin E-Mail ist erforderlich.",
    passwordRequired: "Garmin Passwort ist erforderlich.",
    backToDashboard: "Zurück zum Dashboard",
    openSettings: "Einstellungen",
    languageSection: "Sprache",
    language: "Anzeigesprache",
    languageHint:
      "Standard ist Englisch. Wird in der Konfigurationsdatei gespeichert.",
    syncSection: "Sync & Daten",
    syncHint:
      "Steuert, wie viele Trainings und Metriken geladen und zwischengespeichert werden.",
    maxActivitiesLimit: "Max. Trainings (Voll-Sync)",
    maxActivitiesLimitHint:
      "Obergrenze beim ersten bzw. vollständigen Sync (50–2000).",
    metricsHistoryDays: "Metrik-Verlauf (Tage)",
    metricsHistoryDaysHint:
      "HRV, Stress, Schlaf, VO₂max-Historie (7–365 Tage).",
    incrementalSyncBufferDays: "Inkrementeller Sync-Puffer (Tage)",
    incrementalSyncBufferDaysHint:
      "Zusätzliche Tage zurück bei Teilsync – verhindert Lücken.",
    detailCacheDays: "Aktivitäts-Detail-Cache (Tage)",
    detailCacheDaysHint: "Splits/Übungen im Cache behalten (1–90 Tage).",
    claudeTimeout: "Claude-Timeout (Sekunden)",
    claudeTimeoutHint: "Max. Wartezeit auf Claude CLI (30–600 s).",
    garminSessionIdle: "Garmin-Session Idle (Minuten)",
    garminSessionIdleHint:
      "MCP-Verbindung schließen nach Inaktivität (1–120 min).",
    autoSyncSection: "Automatischer Sync",
    autoSyncHint:
      "Neue Workouts periodisch im Hintergrund laden. Server muss laufen bleiben.",
    autoSyncEnabled: "Automatischen Sync aktivieren",
    autoSyncOnStartup: "Sync beim Server-Start",
    autoSyncInterval: "Sync-Intervall (Minuten)",
    autoSyncIntervalHint: "Minimum 15 Minuten. Standard: 360 (6 Stunden).",
    syncOnStartup: "Bei jedem Start neu synchronisieren & KI-Auswertung",
    syncOnStartupHint:
      "Unabhängig vom automatischen Sync: holt bei jedem Programmstart neue Garmin-Daten und lässt sie neu bewerten (Claude-Aufruf je nach Analyse-Modus). Standard: aus.",
    testGarmin: "Garmin-Login testen",
    testingGarmin: "Teste…",
    garminTestOk: "Garmin-Login erfolgreich.",
    garminTestOkName: "Angemeldet als {name}.",
    garminTestFail: "Garmin-Login fehlgeschlagen.",
  },
  loading: {
    garminMcp: "Garmin MCP Server wird gestartet…",
    firstFetch: "Erster Abruf kann etwas dauern",
    profile: "Profil wird geladen…",
    details: "Lade zusätzliche Details…",
    detailsError: "Details konnten nicht geladen werden",
  },
  empty: {
    noTrainings: "Keine Trainings",
    noTrainingsHint:
      "Lade zuerst deine Garmin-Daten, um Trainings im Detail zu sehen.",
    welcome: "Willkommen!",
    welcomeHint:
      "Klicke auf Daten laden für den ersten Abruf. Danach werden nur noch neue Trainings nachgeladen – deutlich schneller.",
    noRecent: "Noch keine Trainings geladen.",
    selectTraining: "Wähle ein Training aus der Liste.",
    noFilterResults: "Keine Trainings für diesen Filter gefunden.",
  },
  stats: {
    thisWeek: "Diese Woche",
    weekKm: "Wochen-km",
    streak: "Trainings-Streak",
    total: "Gesamt",
    weekLoad: "Wochen-Load",
  },
  dashboard: {
    expand: "Bereich aufklappen",
    collapse: "Bereich einklappen",
    expandAll: "Alle aufklappen",
    collapseAll: "Alle einklappen",
    chartCount: "{count} Charts",
    recommendationsCount: "{count} Empfehlungen",
    mode: {
      label: "Dashboard-Ansicht",
      summary: "Überblick",
      details: "Details",
      toggle: "Detaillierte Dashboard-Ansicht umschalten",
      summaryHint:
        "Kompakte Ansicht mit den wichtigsten Kennzahlen und Coaching-Tipps.",
      detailsHint:
        "Volle Ansicht mit Charts, Verlauf, Analytics und allen Garmin-Metriken.",
    },
    summary: {
      title: "Wichtigste Kennzahlen",
      lastWorkout: "Letztes Training",
    },
    intro: {
      title: "Dein Garmin-Daten-Coach",
      subtitle:
        "Garmin Connect zeigt viele Zahlen – hier erklären wir sie verständlich und geben dir konkrete Tipps zur Verbesserung. Klicke auf ℹ️ bei jeder Kennzahl.",
      subtitleCompact:
        "Das Wichtigste und Verbesserungs-Tipps auf einen Blick. Details aktivieren für Charts, Trends und alle Metriken.",
    },
    sections: {
      status: "Deine Kennzahlen erklärt",
      todayPlan: "Was heute Sinn macht",
      recovery: "Erholung verstehen",
      week: "Wochenfortschritt",
      analytics: "Trends & Muster",
      insights: "Bestleistungen & Prognosen",
      recommendations: "Coach-Empfehlungen",
    },
  },
  recovery: {
    title: "Recovery & Schlaf",
    sleep: "Schlaf-Score",
    total: "Gesamt",
    bodyBattery: "Body Battery",
    stress: "Stress",
    restingHr: "Ruhe-HF",
    hrv: "HRV (Woche)",
    recoveryTime: "Erholungszeit",
    readinessFactors: "Readiness-Faktoren",
  },
  performance: {
    vo2title: "VO₂max",
    vo2cycling: "Rad VO₂",
    fitnessAge: "Fitness-Alter",
    heat: "Hitze-Akklimatisation",
    vo2hint: "Trend erscheint nach mehreren Syncs mit VO₂-Historie.",
    loadTitle: "Trainingsbelastung",
    acute: "Akut",
    chronic: "Chronisch",
    loadBalance: "Load Balance (28 Tage)",
    loadTrend: "Belastungstrend (8 Wochen)",
    trainingLoad: "Training Load",
    racePredictions: "Renn-Prognosen (Garmin)",
  },
  plan: {
    title: "Heute empfohlen",
    focus: "Fokus",
    intensity: {
      rest: "Ruhe",
      easy: "Leicht",
      moderate: "Moderat",
      hard: "Intensiv",
    },
    scheduledToday: "Laut Wochenplan heute",
    scheduleOpen: "Offen",
    scheduleDone: "Erledigt",
    sessionTypes: {
      other: "Sonstiges",
      rest: "Ruhetag",
    },
    disciplines: {
      running: "Laufen",
      strength: "Kraft",
      swimming: "Schwimmen",
    },
    focusOptions: {
      recovery: "Erholung",
      catchUpSleep: "Schlaf aufholen",
      tempoOrIntervals: "Tempo oder Intervalle",
      planRun: "Lauf einplanen",
      progressiveOverload: "Progressive Overload",
      strengthSession: "Krafteinheit",
      qualityRunOrStrength: "Qualität Laufen oder Kraft",
      weaknessDiscipline: "Schwäche disziplin trainieren",
      qualitySession: "Qualitäts-Einheit",
      continuePlan: "Plan fortsetzen",
    },
    messages: {
      restDay: {
        title: "Regenerationstag",
        description:
          "Readiness und Belastung sprechen für Ruhe oder sehr leichte Bewegung (Spaziergang, Mobility).",
      },
      easySession: {
        title: "Leichte Einheit",
        description:
          "Schlaf-Score {sleep}/100 – kein hartes Training. Lockere Zone-2-Einheit oder Technik.",
      },
      qualityDay: {
        title: "Gute Tag für Qualität",
        description:
          "Readiness {readiness}/100 – ideal für intensivere Einheiten oder längeres Volumen.",
      },
      weeklyGap: {
        title: "Fokus: {label}",
        description:
          "Wochenziel: {actual}/{target} {label}-Einheiten – heute passt eine moderate {label}-Session.",
      },
      balanced: {
        title: "Ausgewogene Einheit",
        description:
          "Readiness {readiness}/100 – normale Trainingsintensität laut Profil.",
      },
    },
  },
  pr: {
    types: {
      "1km": "1 km",
      "1mile": "1 Meile",
      "5km": "5 km",
      "10km": "10 km",
      halfMarathon: "Halbmarathon",
      marathon: "Marathon",
      longestDistance: "Längste Distanz",
      longestRide: "Längste Fahrt",
      fastest100m: "Schnellste 100m",
      "400m": "400m",
    },
  },
  muscle: {
    chest: "Brust",
    back: "Rücken",
    shoulders: "Schultern",
    traps: "Trapez",
    biceps: "Bizeps",
    triceps: "Trizeps",
    forearms: "Unterarme",
    core: "Core",
    legs: "Beine",
    hamstrings: "Hamstrings",
    glutes: "Gesäß",
    calves: "Waden",
    fullBody: "Ganzkörper",
    other: "Sonstige",
  },
  wellness: {
    trainingStatus: "Trainingsstatus",
    readiness: "Readiness",
    vo2max: "VO₂max",
    sleepScore: "Schlaf-Score",
    load: "Load",
    historyHint: "Klicken für Verlauf",
    vo2HistoryTitle: "VO₂max Verlauf",
    sleepHistoryTitle: "Schlaf-Score Verlauf",
    readinessHistoryTitle: "Readiness Verlauf",
    historyEmpty: "Noch nicht genug Historiendaten (mind. 2 Tage nach Sync).",
  },
  wellnessHistory: {
    title: "Erholungs-Trends (84 Tage)",
    hrv: "HRV Verlauf",
    stress: "Stress Verlauf",
    bodyBattery: "Body Battery Verlauf",
    sleepDuration: "Schlafdauer Verlauf",
  },
  trainingEffect: {
    title: "Trainingseffekt",
    hint: "Aerob/anaerob pro Einheit – zeigt, wie hart deine Workouts Garmin-intern wirken.",
    aerobic: "Aerob",
    anaerobic: "Anaerob",
    recent: "Letzte Einheiten",
    weekly: "Wochen-Durchschnitt",
  },
  trainingStatusHistory: {
    title: "Trainingsstatus-Verlauf",
    hint: "Wird bei jedem Sync gespeichert – Garmin bietet leider keine Status-Historie direkt an.",
  },
  raceCalendar: {
    title: "Wettkampf-Kalender",
    hint: "Geplante Rennen aus deinem Profil, verglichen mit Garmin-Prognosen.",
    name: "Renname",
    date: "Datum",
    distance: "Distanz",
    targetTime: "Zielzeit (mm:ss oder h:mm:ss)",
    target: "Ziel",
    prediction: "Garmin-Prognose",
    inDays: "in {count} Tagen",
    past: "vergangen",
    add: "Rennen hinzufügen",
    remove: "Entfernen",
    distances: {
      "5k": "5 km",
      "10k": "10 km",
      halfMarathon: "Halbmarathon",
      marathon: "Marathon",
      other: "Sonstiges",
    },
  },
  charts: {
    weeklyTrend: "Wochen-Trend (8 Wochen)",
    kilometers: "Kilometer",
    distancePerActivity: "Distanz pro Training",
    distanceKm: "Distanz (km)",
    activityTypes: "Aktivitätstypen",
    hrZones: "HF-Zonen (28 Tage)",
    hrZonesHint: "{count} Cardio-Einheiten aggregiert",
    muscleBalanceHint: "Krafttraining der letzten 7 Tage",
    hrZonesActivity: "Herzfrequenz-Zonen",
    hrZonesEmpty: "Keine HF-Zonendaten verfügbar",
    splits: "Kilometer-Splits",
    splitsEmpty: "Keine Split-Daten verfügbar",
    paceLabel: "Pace (min/km)",
    muscleGroups: "Muskelgruppen",
    muscleGroupsAria: "Muskelgruppen-Körperdiagramm",
    musclePrimary: "Primär",
    muscleSecondary: "Sekundär",
    muscleInactive: "Inaktiv",
    bodyFront: "Vorne",
    bodyBack: "Hinten",
  },
  hrZones: {
    z1: "Z1 Erholung",
    z2: "Z2 Grundlage",
    z3: "Z3 Tempo",
    z4: "Z4 Schwelle",
    z5: "Z5 Max",
    zone1: "Zone 1 (Erholung)",
    zone2: "Zone 2 (Grundlage)",
    zone3: "Zone 3 (Tempo)",
    zone4: "Zone 4 (Schwelle)",
    zone5: "Zone 5 (Maximum)",
  },
  progress: {
    title: "Wochenfortschritt",
    hint: "Letzte 7 Tage vs. Profil-Ziele",
    running: "Laufen",
    cycling: "Rad",
    strength: "Kraft",
    swimming: "Schwimmen",
    kilometers: "Kilometer",
    hours: "Stunden",
  },
  recent: {
    title: "Letzte Trainings",
    showAll: "Alle anzeigen →",
  },
  records: {
    title: "Persönliche Bestleistungen",
  },
  recommendations: {
    title: "Was du heute wissen solltest",
    subtitle:
      "Verständliche Erklärungen und konkrete Tipps – statt Garmin-Connect-Chaos.",
    subtitleCompact:
      "Die wichtigsten Coaching-Tipps basierend auf deinen aktuellen Daten – nach Priorität sortiert.",
    moreInDetails: "+{count} weitere Tipps in der Detail-Ansicht.",
    hint: "Basierend auf Garmin-Daten und deinem Profil. Mit Claude CLI werden die Tipps noch persönlicher formuliert.",
    empty:
      "Noch keine Empfehlungen – lade deine Garmin-Daten, um personalisierte Tipps zu erhalten.",
    sourceClaude: "Claude Coach",
    tokens: "Tokens",
    localAdded: "+{count} lokale Regel",
    reanalyze: "Daten neu prüfen",
    reanalyzing: "Prüfe…",
    reanalyzeHint:
      "Fragt Claude direkt neu ab, unabhängig vom Smart-Modus-Cache. Kann bis zu einigen Minuten dauern.",
    sourceLocal: "Regelbasiert",
    category: {
      training: "Training",
      recovery: "Erholung",
      performance: "Leistung",
      general: "Allgemein",
    },
    priority: {
      high: "Hoch",
      medium: "Mittel",
      low: "Niedrig",
    },
  },
  trainings: {
    title: "Trainings",
    search: "Training suchen…",
    searchAria: "Training suchen",
    clickHint: "Klicken für Details",
    setsCount: "{count} Sätze",
  },
  activityTypes: {
    running: "Laufen",
    cycling: "Radfahren",
    swimming: "Schwimmen",
    strength_training: "Krafttraining",
    walking: "Gehen",
    hiking: "Wandern",
    elliptical: "Crosstrainer",
    yoga: "Yoga",
    unknown: "Sonstige",
  },
  detail: {
    duration: "Dauer",
    calories: "Kalorien",
    distance: "Distanz",
    avgHr: "Ø HF",
    maxHr: "Max HF",
    avgPace: "Ø Pace",
    elevation: "Höhenmeter",
    sets: "Sätze",
    reps: "Wiederholungen",
    bestKm: "Bester km",
    gapPace: "GAP Pace",
    laps: "Runden",
    trainingEffect: "Trainingseffekt",
    aerobic: "Aerob",
    anaerobic: "Anaerob",
    exercises: "Übungen",
    exercise: "Übung",
    maxWeight: "Max. Gewicht",
    volume: "Volumen",
    muscleGroups: "Trainierte Muskelgruppen",
    setsReps: "{sets} Sätze · {reps} Wdh.",
  },
  profile: {
    title: "Trainingsprofil",
    subtitle:
      "Wähle deine Trainingsart – die Wochenziele passen sich automatisch an.",
    garmin: "Garmin",
    plannedSessions: "{count} Einheiten / Woche geplant",
    personal: "Persönlich",
    displayName: "Anzeigename",
    bodySection: "Körperdaten",
    bodyHint:
      "Grundlage für persönliche Schwellen: HF-Zonen und VO₂max-Referenz. Alles optional – fehlende Werte werden aus Garmin oder geschätzt.",
    birthYear: "Geburtsjahr",
    sex: "Geschlecht",
    sexUnspecified: "Keine Angabe",
    sexMale: "Männlich",
    sexFemale: "Weiblich",
    heightCm: "Größe (cm)",
    weightKg: "Gewicht (kg)",
    weightPlaceholder: "leer = aus Garmin",
    maxHr: "HFmax (bpm)",
    maxHrHint: "Leer lassen = aus dem Alter geschätzt (208 − 0,7 × Alter).",
    maxHrEstimate: "geschätzt: {value}",
    restingHr: "Ruhe-HF (bpm)",
    optionalPlaceholder: "optional",
    displayNamePlaceholder: "z. B. Alex",
    athleteType: "Trainingsart",
    athleteTypeHint: "Was beschreibt dein Training am besten?",
    customType: "Eigene Bezeichnung",
    customTypePlaceholder: "z. B. CrossFit, Klettern, Yoga-Fokus",
    weeklyGoals: "Wochenziele für „{type}“",
    weeklyGoalsHint:
      "Definiere pro Disziplin, wie viele Einheiten du pro Woche anstrebst. Leer lassen = kein Ziel für diese Disziplin.",
    weeklySchedule: "Wochenplan (optional)",
    weeklyScheduleHint:
      "Ordne einzelnen Wochentagen eine feste Einheit zu, z. B. Montag Kraft, Dienstag Laufen. Gesetzte Tage werden im Dashboard am jeweiligen Tag angezeigt – inklusive Status, ob die Einheit schon erledigt ist.",
    weekdays: {
      mon: "Mo",
      tue: "Di",
      wed: "Mi",
      thu: "Do",
      fri: "Fr",
      sat: "Sa",
      sun: "So",
    },
    otherSection: "Sonstiges",
    otherHint: "Immer verfügbar – z. B. Yoga, Mobility, Klettern, Teamsport.",
    otherSessions: "Sonstige Einheiten / Woche",
    otherDescription: "Was ist „Sonstiges“?",
    otherDescriptionPlaceholder: "z. B. Yoga, Stretching, Bouldern",
    experience: "Erfahrung & Intensität",
    experienceLevel: "Erfahrungslevel",
    preferredIntensity: "Bevorzugte Intensität",
    remarks: "Eigene Bemerkungen & KI-Kontext",
    customRemarks: "Custom Bemerkungen",
    customRemarksPlaceholder:
      "Freitext zu deinem Training – z. B. Push/Pull/Legs Split, nur morgens trainieren, …",
    injuryNotes: "Verletzungen / Einschränkungen",
    injuryNotesPlaceholder: "z. B. Knieprobleme, kein Springen",
    personalNotes: "Persönliche Notizen für KI-Empfehlungen",
    personalNotesPlaceholder:
      "z. B. Marathon im Oktober, Fokus 10k unter 45 min",
    plannedRaces: "Geplante Wettkämpfe",
    plannedRacesHint:
      "Trage Rennen ein – im Dashboard werden sie mit Garmin-Prognosen verglichen.",
    save: "Profil speichern",
    saving: "Speichere…",
    saved: "Profil gespeichert.",
    savedWithRecs:
      "Profil gespeichert – Empfehlungen wurden an deinen Plan angepasst.",
    savedClaudePending:
      "Profil gespeichert – KI-Empfehlungen werden im Hintergrund aktualisiert.",
    saveError: "Speichern fehlgeschlagen",
    loadError:
      "Profil konnte nicht vom Server geladen werden – es werden Standardwerte angezeigt.",
    retry: "Erneut laden",
    athleteTypes: {
      bodybuilding: {
        label: "Bodybuilding / Kraft",
        description: "Fokus Muskelaufbau, Krafteinheiten, Volumen",
      },
      runner: {
        label: "Läufer",
        description: "Laufen, Pace, Kilometerziele",
      },
      cyclist: {
        label: "Radfahren",
        description: "Rad-Einheiten, Distanz, Ausdauer",
      },
      swimmer: {
        label: "Schwimmen",
        description: "Schwimm-Einheiten, Technik, Ausdauer",
      },
      hybrid: {
        label: "Hybrid",
        description: "Laufen + Kraft – beides definierbar",
      },
      triathlon: {
        label: "Triathlon",
        description: "Laufen, Rad, Schwimmen kombiniert",
      },
      general: {
        label: "Allgemeine Fitness",
        description: "Abwechslungsreich, flexibel",
      },
      other: {
        label: "Sonstiges",
        description: "Individuell – alles selbst definieren",
      },
    },
    experienceLevels: {
      beginner: "Einsteiger",
      intermediate: "Fortgeschritten",
      advanced: "Erfahren",
    },
    intensity: {
      easy: "Ruhig & regenerativ",
      balanced: "Ausgewogen",
      hard: "Ambitioniert & intensiv",
    },
    targets: {
      runningSessions: "Laufeinheiten / Woche",
      cyclingSessions: "Rad-Einheiten / Woche",
      strengthSessions: "Krafteinheiten / Woche",
      swimmingSessions: "Schwimm-Einheiten / Woche",
      weeklyKm: "Kilometer / Woche",
      weeklyHours: "Stunden / Woche",
    },
  },
  analytics: {
    muscleBalance: "Kraft-Muskel-Balance (7 Tage)",
    muscleBalanceHint:
      "Trainierte Muskelgruppen in den letzten Kraft-Einheiten.",
    heatmap: "Trainings-Heatmap",
    heatmapHint: "Aktivitäten pro Tag der letzten 84 Tage.",
    less: "Weniger",
    more: "Mehr",
    periodCompare: "Perioden-Vergleich",
    period: {
      thisWeek: "Diese Woche",
      lastWeek: "Letzte Woche",
      avg4w: "4-Wochen-Ø",
      sessions: "Einheiten",
      km: "Kilometer",
      hours: "Stunden",
      load: "Training Load",
    },
    paceTrend: "Pace-Trend",
    paceTrendHint:
      "Durchschnittstempo der letzten Cardio-Einheiten (niedriger = schneller).",
    paceAxis: "Pace (min/km)",
    minPerKm: "min/km",
    routePreview: "Routen-Vorschau",
    selectActivity: "Aktivität",
    routeEmpty: "Keine GPS-Route für diese Aktivität verfügbar.",
    routeError: "Route konnte nicht geladen werden.",
  },
  data: {
    title: "Daten & Export",
    hint: "Workouts exportieren, vollständiges Backup laden oder aus Backup wiederherstellen.",
    exportActivitiesCsv: "Aktivitäten (CSV)",
    exportWeeklyCsv: "Wochen-Statistik (CSV)",
    exportJson: "Dashboard (JSON)",
    backup: "Backup herunterladen",
    restore: "Backup wiederherstellen",
    restoring: "Stelle wieder her…",
    backupDone: "Backup heruntergeladen.",
    backupError: "Backup fehlgeschlagen.",
    restoreError: "Wiederherstellung fehlgeschlagen.",
    importCsv: "Aktivitäten importieren (CSV)",
    importEmpty: "Keine gültigen Zeilen in der CSV gefunden.",
    importDone: "{count} Aktivitäten importiert.",
    importError: "Import fehlgeschlagen.",
  },
  loadQuality: {
    title: "Belastungsqualität",
    subtitle:
      "Aus deinen Trainings berechnet – zeigt, was Garmin Connect so nicht ausweist.",
    monotony: "Monotonie",
    monotonyHint: "{sessions} Einheiten, {rest} Ruhetage in 7 Tagen",
    strain: "Strain",
    strainHint: "Woche {acute} vs. Ø {chronic}",
    loadTrend: "Lasttrend",
    loadTrendHint: "Diese Woche vs. die 3 Wochen davor",
    intensity: "Intensität leicht/mittel/hart",
    verdict: {
      "too-hard": "Zu wenig echte Grundlage – 75–85 % leicht wäre üblich.",
      balanced: "Gute Verteilung zwischen leicht und intensiv.",
      "too-easy": "Fast alles leicht – gezielte Reize fehlen.",
    },
    loadSource: {
      estimated:
        "Trainingslast aus Dauer und Herzfrequenz geschätzt – Garmin liefert für diese Einheiten keine Last.",
      duration:
        "Trainingslast nur aus der Dauer abgeleitet – ohne Herzfrequenz ist das ein grober Näherungswert.",
      none: "Keine Trainingslast verfügbar.",
    },
    missingBody:
      "Für noch genauere Auswertung fehlen im Profil: {fields}. Ohne diese Werte wird geschätzt.",
  },
  info: {
    loadQuality:
      "Kennzahlen, die aus deinen Rohdaten berechnet werden: Monotonie und Strain nach Foster, Intensitätsverteilung aus den HF-Zonen sowie Protein und Energieverfügbarkeit relativ zu deinem Körpergewicht.",
    monotony:
      "Monotonie = mittlere Tagesbelastung geteilt durch ihre Streuung (7 Tage). Über 2 heißt: alle Tage sind ähnlich belastet. Kontrast aus harten und wirklich leichten Tagen wird besser verkraftet als gleichmäßige Mittelmaß-Belastung.",
    strain:
      "Strain = Wochenlast × Monotonie. Hohe Werte entstehen aus viel Umfang ohne Erholungskontrast und gehen erfahrungsgemäß mit mehr Infekten und Überlastungsbeschwerden einher.",
    intensityDistribution:
      "Verteilung deiner Trainingszeit über die Herzfrequenzzonen (28 Tage). Leicht = Zone 1–2, mittel = Zone 3, hart = Zone 4–5. Bewährt sind rund 75–85 % leicht, der Rest gezielt intensiv.",
    energyAvailability:
      "Zufuhr minus Trainingsverbrauch, im Verhältnis zu deinem geschätzten Grundumsatz. Unter 100 % bleibt dauerhaft zu wenig Energie für Regeneration, Hormonhaushalt und Leistung.",
    learnMore: "Was bedeutet das?",
    recommendations:
      "Personalisierte Coaching-Tipps aus deinen Garmin-Daten. Claude erklärt, was die Zahlen bedeuten und was du konkret tun kannst – verständlicher als in Garmin Connect.",
    todayPlan:
      "Tagesempfehlung basierend auf Readiness, Schlaf, Belastung und deinem Wochenplan. Sagt dir, ob heute Ruhe, leichtes oder intensives Training sinnvoll ist.",
    statusOverview:
      "Die wichtigsten Garmin-Metriken auf einen Blick. Jede Kennzahl hat ein ℹ️ mit Erklärung – so verstehst du, was Garmin dir sagen will.",
    trainingStatus:
      "Garmin bewertet, ob dein aktuelles Trainingsmuster produktiv ist: z. B. „Produktiv“, „Erholung“ oder „Überlastung“. Zeigt, ob du Fortschritt machst oder zu viel trainierst.",
    readiness:
      "Training Readiness (0–100): Wie bereit dein Körper heute für Belastung ist. Niedrig = lieber regenerieren; hoch = guter Tag für Qualität oder Volumen.",
    vo2max:
      "VO₂max schätzt deine maximale Sauerstoffaufnahme – ein Indikator für Ausdauerleistung. Steigt langfristig durch regelmäßiges Training, sinkt bei langer Pause.",
    sleepScore:
      "Schlaf-Score (0–100): Bewertet Schlafdauer, -qualität und Erholung. Schlechter Schlaf senkt Readiness und erhöht Verletzungsrisiko – oft wichtiger als ein extra Training.",
    thisWeek:
      "Anzahl der Trainingseinheiten in den letzten 7 Tagen. Hilft zu prüfen, ob du deinem Wochenplan folgst.",
    weekKm:
      "Gesamtdistanz aller Einheiten dieser Woche in Kilometern. Für Läufer, Radfahrer und Triathleten ein zentraler Volumen-Indikator.",
    streak:
      "Aufeinanderfolgende Tage mit mindestens einer Aktivität. Motiviert Regelmäßigkeit – aber Ruhetage sind genauso wichtig.",
    totalActivities:
      "Gesamtzahl synchronisierter Workouts in deiner lokalen Datenbank. Je mehr Historie, desto besser die Trends und Empfehlungen.",
    weekLoad:
      "Summe des Training Load dieser Woche. Garmin gewichtet Intensität und Dauer – höher bedeutet mehr Gesamtbelastung, nicht automatisch „besser“.",
    recoverySection:
      "Tiefere Einblicke in Erholung und Schlaf. Hier siehst du, ob dein Körper bereit ist für härteres Training oder Pause braucht.",
    sleep:
      "Schlaf-Score und Phasen (Tief, REM, leicht). Guter Schlaf ist die Basis für Anpassung an Training und schnellere Regeneration.",
    bodyBattery:
      "Garmin-Schätzung deiner Energiereserve (0–100). Sinkt bei Stress und Belastung, steigt bei Ruhe und Schlaf.",
    stress:
      "Durchschnittlicher Stresslevel des Tages. Chronisch hoher Stress beeinträchtigt Erholung und Trainingsqualität.",
    restingHr:
      "Ruheherzfrequenz in Schlägen pro Minute. Langfristig sinkend = gutes Zeichen für bessere Ausdauer; plötzlicher Anstieg kann Überlastung oder Krankheit bedeuten.",
    hrv: "Herzfrequenz-Variabilität (ms): Misst Erholungsfähigkeit des Nervensystems. Höhere Werte deuten meist auf bessere Regeneration hin.",
    recoveryTime:
      "Garmin schätzt, wie viele Stunden bis zur vollen Erholung nach der letzten Belastung vergehen. Nicht ignorieren vor harten Einheiten.",
    readinessFactors:
      "Zeigt, welche Faktoren deinen Readiness-Score beeinflussen: Schlaf, Erholungszeit, Belastung (ACWR), HRV, Stress und Schlaf-Trend.",
    vo2Panel:
      "Dein aktueller VO₂max-Wert und Verlauf. Langfristiger Trend ist wichtiger als einzelne Tageswerte.",
    fitnessAge:
      "Garmin vergleicht deine Fitness mit dem Durchschnitt deines Alters. Niedriger = fitter als typisch für dein Alter.",
    heatAcclimation:
      "Wie gut dein Körper an Hitze gewöhnt ist. Relevant bei Sommertraining und vor Wettkämpfen in warmen Bedingungen.",
    acwr: "Acute:Chronic Workload Ratio – vergleicht kurzfristige (7 Tage) mit langfristiger (28 Tage) Belastung. Optimal meist 0,8–1,3; darüber steigt Verletzungsrisiko.",
    acuteLoad:
      "Akute Belastung der letzten ~7 Tage. Zeigt, wie hart du gerade trainierst.",
    chronicLoad:
      "Chronische Belastung der letzten ~28 Tage. Deine Trainings-Baseline – steigt langsam mit konstantem Volumen.",
    loadBalance:
      "Garmin vergleicht deine Belastung in Aerob niedrig/hoch und Anaerob mit empfohlenen Zielbereichen – zeigt Lücken im Trainingsmix.",
    trainingLoad:
      "Trainingsbelastung kombiniert Intensität und Umfang. ACWR vergleicht kurz- und langfristige Last – der zentrale Wert, um Überlastung zu vermeiden.",
    weekSection:
      "Fortschritt gegenüber deinen Wochenzielen und die letzten Einheiten. Praktisch, um zu sehen, was noch fehlt.",
    weeklyProgress:
      "Vergleicht deine tatsächlichen Einheiten dieser Woche mit den Zielen aus deinem Profil (z. B. 3× Laufen, 2× Kraft).",
    recentActivities:
      "Deine neuesten Workouts – klickbar für Details wie HF-Zonen, Splits und Muskelgruppen.",
    analyticsSection:
      "Charts und Trends über mehrere Wochen. Hilft, Muster zu erkennen, die in Garmin Connect versteckt sind.",
    weeklyTrend:
      "Kilometer und Einheiten pro Woche über 8 Wochen. Zeigt, ob dein Volumen steigt, fällt oder stabil ist.",
    activityTypes:
      "Verteilung deiner Trainingsarten. Wichtig für Ausgewogenheit – z. B. zu wenig Kraft bei viel Laufen.",
    hrZones:
      "Aggregierte Herzfrequenz-Zonen deiner Cardio-Einheiten der letzten 28 Tage. Zeigt, ob du genug lockere Grundlage (Zone 2) trainierst.",
    distanceChart:
      "Distanz pro einzelner Aktivität – gut, um Ausreißer und typische Einheitslängen zu sehen.",
    weeklyLoadTrend:
      "Training Load pro Woche über 8 Wochen. Zeigt Belastungs-Spitzen und Erholungsphasen.",
    recordsSection:
      "Persönliche Bestzeiten und Garmin-Rennprognosen – mit Kontext leichter zu interpretieren als in der Connect-App.",
    personalRecords:
      "Deine Garmin-Personal Records (PRs) – schnellste Zeiten und längste Distanzen. Klick öffnet das zugehörige Training.",
    racePredictions:
      "Garmin schätzt deine Renndzeiten (5 km, 10 km, HM, Marathon) aus Training und VO₂max. Orientierungswert, kein Garantie-Wert.",
    planCard:
      "Automatische Tagesempfehlung: kombiniert Readiness, Schlaf, ACWR und deine Wochenziele zu einer konkreten Empfehlung für heute.",
    wellnessHistory:
      "84-Tage-Trends für HRV, Stress, Body Battery und Schlafdauer – direkt aus Garmin, verständlich visualisiert.",
    trainingEffect:
      "Garmin-Trainingseffekt (aerob/anaerob) pro Workout und als Wochen-Durchschnitt – zeigt Intensität jenseits der Distanz.",
    trainingStatusHistory:
      "Lokal gespeicherter Verlauf deines Trainingsstatus bei jedem Sync, da Garmin keine Status-Historie liefert.",
    raceCalendar:
      "Deine geplanten Rennen aus dem Profil im Vergleich zu Garmin-Zielzeiten und Prognosen.",
    muscleBalance:
      "Zeigt, welche Muskelgruppen du in Kraft-Workouts der letzten 7 Tage trainiert hast – hilft, Lücken im Programm zu erkennen.",
    heatmap:
      "Kalender-Ansicht deiner Trainingstage. Dunklere Felder = mehr Einheiten oder höhere Belastung an dem Tag.",
    periodCompare:
      "Vergleicht diese Woche vs. letzte Woche und deinen 4-Wochen-Durchschnitt bei Einheiten, km, Stunden und Load.",
    paceTrend:
      "Tempo-Verlauf bei Lauf, Rad und Gehen. Nützlich für Fitness-Fortschritt oder Ermüdung.",
    routePreview:
      "Einfache GPS-Spur einer kürzlichen Cardio-Einheit. Benötigt Routendaten aus Garmin Connect.",
    dataExport:
      "Aktivitäten als CSV/JSON exportieren, lokales Backup laden, wiederherstellen oder Aktivitäten per CSV importieren.",
  },
};

export default de;
