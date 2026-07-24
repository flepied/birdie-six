import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { COURSE_CATALOG, createNewMatch, getCourseById, getGrossScoresToPar, getHolePoints, getHoleResult, getNetScores, getRelativeNetScores, getRelativeTotalPoints, getStrokesReceived, getTotalPoints, parseAppState } from './domain'
import type { Match } from './domain'
import { clearAppState, downloadAppState, restoreAppState, saveAppState } from './storage'

export default function App() {
  const [match, setMatch] = useState<Match>(() => getInitialMatch())
  const [savedAt, setSavedAt] = useState<string | null>(() => restoreAppState()?.savedAt ?? null)
  const [notice, setNotice] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const holeIndex = Math.min(match.currentHole, 17)
  const hole = match.course.holes[holeIndex]
  const holeScores = match.scores[holeIndex].strokes
  const holePoints = getHolePoints(match, holeIndex)
  const rawTotalPoints = useMemo(() => getTotalPoints(match), [match])
  const grossScoresToPar = useMemo(() => getGrossScoresToPar(match), [match])
  const totalPoints = useMemo(() => getRelativeTotalPoints(match), [match])
  const strokesReceived = getStrokesReceived(match, hole)
  const netScores = getNetScores(match, holeIndex)
  const relativeNetScores = getRelativeNetScores(match, holeIndex)
  const sortedPlayers = match.players.map((player, index) => ({ player, index })).sort((left, right) => totalPoints[right.index] - totalPoints[left.index])

  function updateMatch(update: (current: Match) => Match) { setMatch((current) => update(current)) }
  function setPlayerCount(count: 3 | 4) {
    if (count === match.players.length) return
    const nextPlayers = count === 4 ? [...match.players, { name: 'Joueur 4', handicap: 18 }] : match.players.slice(0, 3)
    updateMatch((current) => ({ ...current, players: nextPlayers, scores: current.scores.map((score) => ({ strokes: count === 4 ? [...score.strokes, null] : score.strokes.slice(0, 3) })) }))
  }
  function setScore(playerIndex: number, value: string) {
    const score = value === '' ? null : Math.max(1, Number.parseInt(value, 10) || 1)
    updateMatch((current) => ({ ...current, scores: current.scores.map((item, index) => index === holeIndex ? { strokes: item.strokes.map((itemScore, index) => index === playerIndex ? score : itemScore) } : item) }))
  }
  function save() { saveAppState(match); setSavedAt(new Date().toISOString()); setNotice('Partie sauvegardée sur cet appareil.') }
  function newGame() { if (window.confirm('Commencer une nouvelle partie ? La sauvegarde actuelle sera supprimée.')) { clearAppState(); setMatch(createNewMatch(match.players.length)); setSavedAt(null); setNotice('Nouvelle partie créée.') } }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try { const importedMatch = parseAppState(await file.text()).match; updateMatch(() => importedMatch); setNotice('Sauvegarde importée.'); setSavedAt(null) } catch { setNotice('Impossible de lire cette sauvegarde.') }
    event.target.value = ''
  }

  return <main className="app-shell">
    <header className="app-header"><div><span className="eyebrow">CHOUETTE · 6 POINTS PAR TROU</span><h1>Golf, trou après trou.</h1></div><button className="icon-button" onClick={() => setNotice('Ajoutez cette page à votre écran d’accueil depuis le menu de votre navigateur.')} aria-label="Installer l’application">＋</button></header>
    <section className="hero-card"><div><span className="eyebrow">{match.course.name} · {match.players.length} JOUEURS</span><strong>Score courant</strong></div><div className="leaderboard">{sortedPlayers.map(({ player, index }, position) => <div key={player.name + index}><b>{position + 1}</b><span>{player.name}</span><strong>{totalPoints[index]} <small>pts · {formatToPar(grossScoresToPar[index])} vs par</small></strong></div>)}</div><p>Score Chouette relatif · trou {hole.number} · {match.scores.filter((_, index) => getHoleResult(match, index) === 'played').length} trou{match.scores.filter((_, index) => getHoleResult(match, index) === 'played').length > 1 ? 's' : ''} joué{match.scores.filter((_, index) => getHoleResult(match, index) === 'played').length > 1 ? 's' : ''}</p></section>
    <section className="players-card"><div className="section-heading"><h2>Joueurs</h2><div className="segmented"><button className={match.players.length === 3 ? 'selected' : ''} onClick={() => setPlayerCount(3)}>3</button><button className={match.players.length === 4 ? 'selected' : ''} onClick={() => setPlayerCount(4)}>4</button></div></div><label>Parcours<select value={match.course.id ?? 'golf-national-eagle'} onChange={(event) => updateMatch((current) => ({ ...current, course: getCourseById(event.target.value) }))}>{COURSE_CATALOG.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label><div className="player-grid">{match.players.map((player, index) => <div className="player-field" key={index}><label>Joueur {index + 1}<input value={player.name} onChange={(event) => updateMatch((current) => ({ ...current, players: current.players.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) }))} /></label><label>Handicap<input type="number" min="0" max="54" value={player.handicap} onChange={(event) => updateMatch((current) => ({ ...current, players: current.players.map((item, itemIndex) => itemIndex === index ? { ...item, handicap: Number(event.target.value) || 0 } : item) }))} /></label></div>)}</div></section>
    <section className="hole-card"><div className="hole-navigation"><button onClick={() => updateMatch((current) => ({ ...current, currentHole: Math.max(0, current.currentHole - 1) }))} disabled={holeIndex === 0}>←</button><div><span className="eyebrow">TROU {hole.number} / 18</span><h2>Par {hole.par}<small> · Index {hole.strokeIndex}</small></h2></div><button onClick={() => updateMatch((current) => ({ ...current, currentHole: Math.min(17, current.currentHole + 1) }))} disabled={holeIndex === 17}>→</button></div><div className="score-entry players-score">{match.players.map((player, index) => <ScoreInput key={index} label={player.name} value={holeScores[index]} strokes={strokesReceived[index]} points={holePoints[index]} netScore={netScores[index]} relativeScore={relativeNetScores[index]} onChange={(value) => setScore(index, value)} />)}</div><div className="hole-result">{getHoleResult(match, holeIndex) === 'played' ? `${Math.max(...holePoints)} points pour le meilleur score net` : 'Saisissez les scores des joueurs'}</div></section>
    <section className="summary-card"><div className="section-heading"><h2>Carte de score</h2><span>Brut · points</span></div><div className="score-table">{match.course.holes.map((currentHole, index) => { const points = getHolePoints(match, index); const rawScores = match.scores[index].strokes; return <button className={index === holeIndex ? 'active' : ''} key={currentHole.number} onClick={() => updateMatch((current) => ({ ...current, currentHole: index }))}><b>{currentHole.number}</b><span>Par {currentHole.par}</span><span>{rawScores.map((score) => score ?? '—').join(' · ')}</span><span>{points.map((point) => point % 1 ? point.toFixed(1) : point).join(' · ')}</span><em>{getHoleResult(match, index) === 'played' ? '✓' : '·'}</em></button> })}</div></section>
    <section className="actions"><button className="primary" onClick={save}>Sauvegarder</button><button onClick={() => downloadAppState(match)}>Exporter</button><button onClick={() => fileInput.current?.click()}>Importer</button><button className="danger" onClick={newGame}>Nouvelle partie</button><input ref={fileInput} type="file" accept="application/json,.json" onChange={importFile} hidden /></section><footer>{savedAt ? `Dernière sauvegarde : ${new Date(savedAt).toLocaleString('fr-FR')}` : 'Aucune sauvegarde enregistrée'}{notice && <span className="notice">{notice}</span>}</footer>
  </main>
}

function getInitialMatch(): Match {
  const savedMatch = restoreAppState()?.match
  if (!savedMatch) return createNewMatch()
  return { ...savedMatch, course: getCourseById(savedMatch.course.id ?? 'golf-national-eagle') }
}

function formatToPar(score: number): string { return score > 0 ? `+${score}` : `${score}` }

function ScoreInput({ label, value, strokes, points, netScore, relativeScore, onChange }: { label: string; value: number | null; strokes: number; points: number; netScore: number | null; relativeScore: number | null; onChange: (value: string) => void }) { return <label className="score-input"><span>{label}</span><input type="number" min="1" max="20" inputMode="numeric" placeholder="—" value={value ?? ''} onChange={(event) => onChange(event.target.value)} /><small>Brut {value ?? '—'} · Net {netScore ?? '—'} · Écart {relativeScore === null ? '—' : `+${relativeScore}`} · {points} pt{points > 1 ? 's' : ''}{strokes ? ` · +${strokes}` : ''}</small></label> }
