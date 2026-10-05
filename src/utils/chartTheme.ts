export const chartColors = {
  cyan: 'rgba(59, 130, 246, 0.75)',
  cyanSolid: '#3b82f6',
  purple: 'rgba(96, 165, 250, 0.65)',
  purpleSolid: '#60a5fa',
  coral: 'rgba(148, 163, 184, 0.65)',
  green: 'rgba(34, 197, 94, 0.65)',
  amber: 'rgba(148, 163, 184, 0.55)',
  palette: [
    'rgba(59, 130, 246, 0.75)',
    'rgba(96, 165, 250, 0.65)',
    'rgba(148, 163, 184, 0.65)',
    'rgba(100, 116, 139, 0.65)',
    'rgba(59, 130, 246, 0.5)',
    'rgba(148, 163, 184, 0.5)',
    'rgba(96, 165, 250, 0.5)',
    'rgba(100, 116, 139, 0.5)',
  ],
  grid: 'rgba(255, 255, 255, 0.06)',
  tick: '#8a8a94',
  tooltipBg: '#1a1a1e',
  tooltipBorder: 'rgba(59, 130, 246, 0.35)',
}

export const chartFont = {
  family: "'Outfit', system-ui, sans-serif",
  size: 11,
}

export function chartPerformanceOptions() {
  return {
    animation: false as const,
    animations: {
      colors: false,
      x: false,
      y: false,
    },
  }
}

export function chartScaleDefaults() {
  return {
    grid: { color: chartColors.grid },
    ticks: { color: chartColors.tick, font: chartFont },
    border: { display: false },
  }
}

export function chartTooltipDefaults() {
  return {
    backgroundColor: chartColors.tooltipBg,
    borderColor: chartColors.tooltipBorder,
    borderWidth: 1,
    titleColor: '#ececef',
    bodyColor: '#8a8a94',
    padding: 12,
    cornerRadius: 8,
    titleFont: { ...chartFont, weight: 'bold' as const },
    bodyFont: chartFont,
  }
}
