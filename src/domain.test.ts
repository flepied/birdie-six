import { describe, expect, it } from 'vitest'
import { createNewMatch, getHolePoints, getRelativeNetScores, getRelativeTotalPoints, getStrokesReceived, parseAppState, serializeAppState } from './domain'

describe('chouette domain', () => {
  it('supports three and four players', () => {
    expect(createNewMatch(3).players).toHaveLength(3)
    expect(createNewMatch(4).scores[0].strokes).toHaveLength(4)
  })
  it('starts with the official L’Aigle course card', () => {
    const match = createNewMatch(3)
    expect(match.course.name).toContain("L'Aigle")
    expect(match.course.holes.reduce((total, hole) => total + hole.par, 0)).toBe(71)
    expect(match.course.holes.map((hole) => hole.strokeIndex)).toEqual([12, 2, 18, 16, 6, 14, 10, 8, 4, 9, 11, 1, 17, 5, 15, 3, 13, 7])
  })
  it('distributes handicap strokes from the lowest handicap', () => {
    const match = createNewMatch(3)
    match.players[0].handicap = 10
    match.players[1].handicap = 18
    expect(getStrokesReceived(match, match.course.holes[1])).toEqual([0, 1, 1])
    match.players[1].handicap = 29
    expect(getStrokesReceived(match, match.course.holes[11])).toEqual([0, 2, 1])
  })
  it('awards six points with the standard 4-2-0 three-player scale', () => {
    const match = createNewMatch(3)
    match.scores[0] = { strokes: [3, 4, 5] }
    expect(getHolePoints(match, 0)).toEqual([4, 2, 0])
    match.scores[1] = { strokes: [3, 3, 5] }
    expect(getHolePoints(match, 1)).toEqual([3, 3, 0])
  })
  it('normalizes net scores against the lowest score on the hole', () => {
    const match = createNewMatch(3)
    match.scores[0] = { strokes: [4, 5, 7] }
    expect(getRelativeNetScores(match, 0)).toEqual([0, 1, 3])
  })
  it('normalizes final totals against the lowest total', () => {
    const match = createNewMatch(3)
    match.scores[0] = { strokes: [4, 4, 4] }
    expect(getRelativeTotalPoints(match)).toEqual([0, 0, 0])
  })
  it('awards six points with the 3-2-1-0 four-player scale', () => {
    const match = createNewMatch(4)
    match.scores[0] = { strokes: [3, 4, 5, 6] }
    expect(getHolePoints(match, 0)).toEqual([3, 2, 1, 0])
  })
  it('round-trips a versioned save file', () => {
    const match = createNewMatch(3)
    expect(parseAppState(serializeAppState(match)).match.players).toHaveLength(3)
    expect(() => parseAppState('{"version": 2}')).toThrow()
  })
})
