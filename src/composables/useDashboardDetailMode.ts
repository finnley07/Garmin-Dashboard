import { ref, watch } from 'vue'

const STORAGE_KEY = 'dash-detail-mode'

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeStored(showDetails: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, showDetails ? '1' : '0')
  } catch {
    // ignore
  }
}

export function useDashboardDetailMode() {
  const showDetails = ref(readStored())

  watch(showDetails, (value) => {
    writeStored(value)
  })

  function setShowDetails(value: boolean) {
    showDetails.value = value
  }

  function toggleDetails() {
    showDetails.value = !showDetails.value
  }

  return { showDetails, setShowDetails, toggleDetails }
}
