const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export function hasAnsweredSurveyRecently(surveyName: string): boolean {
  const ts = localStorage.getItem(`bsking-survey-answered-${surveyName}`)
  return !!ts && Date.now() - Number(ts) < THIRTY_DAYS_MS
}

export function markSurveyAnswered(surveyName: string): void {
  localStorage.setItem(`bsking-survey-answered-${surveyName}`, String(Date.now()))
}

export function isSurveyDismissedThisSession(surveyName: string): boolean {
  return !!sessionStorage.getItem(`bsking-survey-dismissed-${surveyName}`)
}

export function markSurveyDismissed(surveyName: string): void {
  sessionStorage.setItem(`bsking-survey-dismissed-${surveyName}`, '1')
}

// Picks a random round in the 50-70% window of totalRounds.
// Stored per room in sessionStorage so the target doesn't re-randomize on each render.
export function getMidGameTargetRound(roomCode: string, totalRounds: number): number {
  const key = `bsking-survey-round-${roomCode}`
  const stored = sessionStorage.getItem(key)
  if (stored) return Number(stored)
  const min = Math.ceil(totalRounds * 0.5)
  const max = Math.floor(totalRounds * 0.7)
  const target = min + Math.floor(Math.random() * (max - min + 1))
  sessionStorage.setItem(key, String(target))
  return target
}
