import type { Match } from './domain'
import { parseAppState, serializeAppState } from './domain'

const STORAGE_KEY = 'match-play-golf-state'

export function saveAppState(match: Match): void {
  localStorage.setItem(STORAGE_KEY, serializeAppState(match))
}

export function restoreAppState(): ReturnType<typeof parseAppState> | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try { return parseAppState(raw) } catch { return null }
}

export function clearAppState(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function downloadAppState(match: Match): void {
  const blob = new Blob([serializeAppState(match)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'match-play-golf.json'
  link.click()
  URL.revokeObjectURL(url)
}
