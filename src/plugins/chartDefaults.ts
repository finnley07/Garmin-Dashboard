import { Chart } from 'chart.js'

let applied = false

/** Disable Chart.js animations globally — reduces mount cost and scroll jank. */
export function applyChartPerformanceDefaults() {
  if (applied) return
  applied = true

  Chart.defaults.animation = false
  Chart.defaults.animations = {
    ...Chart.defaults.animations,
    colors: false,
    x: false,
    y: false,
  }
  Chart.defaults.responsive = true
  Chart.defaults.maintainAspectRatio = false
}
