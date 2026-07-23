export type HoleResult = 'played' | 'unplayed'

export interface Hole { number: number; par: number; strokeIndex: number }
export interface Course { id: string; name: string; holes: Hole[] }
export interface Player { name: string; handicap: number }
export interface HoleScore { strokes: Array<number | null> }

export interface Match {
  course: Course
  players: Player[]
  scores: HoleScore[]
  currentHole: number
}

export interface SavedAppState { version: 1; savedAt: string; match: Match }

export const COURSE_CATALOG: Course[] = []

const eaglePars = [4, 4, 4, 3, 4, 3, 5, 4, 4, 3, 4, 4, 3, 4, 5, 4, 5, 4]
const eagleStrokeIndexes = [12, 2, 18, 16, 6, 14, 10, 8, 4, 9, 11, 1, 17, 5, 15, 3, 13, 7]
const eagleCourse: Course = {
  id: 'golf-national-eagle',
  name: "L'Aigle — Golf National",
  holes: eaglePars.map((par, index) => ({ number: index + 1, par, strokeIndex: eagleStrokeIndexes[index] })),
}

COURSE_CATALOG.push(eagleCourse)

export function getCourseById(courseId: string): Course {
  return COURSE_CATALOG.find((course) => course.id === courseId) ?? COURSE_CATALOG[0]
}

export function createDefaultCourse(): Course {
  return getCourseById('golf-national-eagle')
}

export function createNewMatch(playerCount = 3): Match {
  return {
    course: createDefaultCourse(),
    players: Array.from({ length: playerCount }, (_, index) => ({ name: `Joueur ${index + 1}`, handicap: 18 })),
    scores: Array.from({ length: 18 }, () => ({ strokes: Array.from({ length: playerCount }, () => null) })),
    currentHole: 0,
  }
}

export function getStrokesReceived(match: Match, hole: Hole): number[] {
  const lowestHandicap = Math.min(...match.players.map((player) => player.handicap))
  return match.players.map((player) => {
    const difference = Math.max(0, Math.round(player.handicap - lowestHandicap))
    const fullRounds = Math.floor(difference / 18)
    const remainder = difference % 18
    return fullRounds + (hole.strokeIndex <= remainder ? 1 : 0)
  })
}

export function getNetScores(match: Match, holeIndex: number): Array<number | null> {
  const strokesReceived = getStrokesReceived(match, match.course.holes[holeIndex])
  return match.scores[holeIndex].strokes.map((strokes, index) => strokes === null ? null : strokes - strokesReceived[index])
}

export function getRelativeNetScores(match: Match, holeIndex: number): Array<number | null> {
  const netScores = getNetScores(match, holeIndex)
  const playedScores = netScores.filter((score): score is number => score !== null)
  if (playedScores.length === 0) return netScores
  const lowestScore = Math.min(...playedScores)
  return netScores.map((score) => score === null ? null : score - lowestScore)
}

export function getHolePoints(match: Match, holeIndex: number): number[] {
  const netScores = getNetScores(match, holeIndex)
  if (netScores.some((score) => score === null)) return match.players.map(() => 0)
  const ordered = [...(netScores as number[])].sort((left, right) => left - right)
  const pointValues = match.players.length === 3 ? [4, 2, 0] : [3, 2, 1, 0]
  return netScores.map((score) => {
    const rank = ordered.indexOf(score as number)
    const tiedScores = netScores.filter((candidate) => candidate === score).length
    return pointValues.slice(rank, rank + tiedScores).reduce((sum, points) => sum + points, 0) / tiedScores
  })
}

export function getHoleResult(match: Match, index: number): HoleResult {
  return match.scores[index].strokes.every((score) => score !== null) ? 'played' : 'unplayed'
}

export function getTotalPoints(match: Match): number[] {
  return match.players.map((_, playerIndex) => match.scores.reduce((total, __, holeIndex) => total + getHolePoints(match, holeIndex)[playerIndex], 0))
}

export function getRelativeTotalPoints(match: Match): number[] {
  const totalPoints = getTotalPoints(match)
  const lowestTotal = Math.min(...totalPoints)
  return totalPoints.map((points) => points - lowestTotal)
}

export function serializeAppState(match: Match): string {
  return JSON.stringify({ version: 1, savedAt: new Date().toISOString(), match } satisfies SavedAppState)
}

export function parseAppState(raw: string): SavedAppState {
  const value: unknown = JSON.parse(raw)
  if (!value || typeof value !== 'object') throw new Error('Format invalide')
  const state = value as Partial<SavedAppState>
  if (state.version !== 1 || !state.match || !Array.isArray(state.match.players) || ![3, 4].includes(state.match.players.length) || !Array.isArray(state.match.scores) || state.match.scores.length !== 18) throw new Error('Version de sauvegarde non reconnue')
  return state as SavedAppState
}
