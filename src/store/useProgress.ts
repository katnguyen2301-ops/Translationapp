import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LanguageId } from '../data/types'

const MAX_HEARTS = 5
const HEART_REGEN_MS = 4 * 60 * 60 * 1000 // 4 hours per heart
const DAILY_GOAL_XP = 20

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`)
  const db = new Date(`${b}T00:00:00`)
  return Math.round((db.getTime() - da.getTime()) / 86_400_000)
}

interface LessonResult {
  stars: number // 0-3
  bestAccuracy: number // 0-1
  completedAt: string
  timesCompleted: number
}

interface ProgressState {
  activeLanguage: LanguageId | null
  xp: number
  xpToday: number
  xpTodayDate: string
  streak: number
  lastActiveDate: string | null
  heartsCount: number
  heartsLastLostAt: number | null
  lessonResults: Record<string, LessonResult>
  dialogueCompleted: Record<string, boolean>

  setActiveLanguage: (id: LanguageId) => void
  getEffectiveHearts: () => number
  loseHeart: () => void
  refillHearts: () => void
  completeLesson: (lessonId: string, accuracy: number, xpEarned: number) => void
  completeDialogue: (dialogueId: string) => void
  dailyGoalXp: number
  dailyGoalProgress: () => number
}

const SYNCED_KEYS = [
  'activeLanguage',
  'xp',
  'xpToday',
  'xpTodayDate',
  'streak',
  'lastActiveDate',
  'heartsCount',
  'heartsLastLostAt',
  'lessonResults',
  'dialogueCompleted',
] as const

export type SyncableProgress = Pick<ProgressState, (typeof SYNCED_KEYS)[number]>

/** Snapshot of the fields that get synced to the cloud when a user is logged in. */
export function getSyncableProgress(): SyncableProgress {
  const s = useProgress.getState()
  const out = {} as SyncableProgress
  for (const key of SYNCED_KEYS) (out as Record<string, unknown>)[key] = s[key]
  return out
}

/** Applies a partial remote snapshot (e.g. from Firestore) back into local state. */
export function applyRemoteProgress(patch: Partial<SyncableProgress>) {
  const next: Partial<SyncableProgress> = {}
  for (const key of SYNCED_KEYS) {
    const value = patch[key]
    if (value !== undefined) (next as Record<string, unknown>)[key] = value
  }
  useProgress.setState(next)
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      activeLanguage: null,
      xp: 0,
      xpToday: 0,
      xpTodayDate: todayKey(),
      streak: 0,
      lastActiveDate: null,
      heartsCount: MAX_HEARTS,
      heartsLastLostAt: null,
      lessonResults: {},
      dialogueCompleted: {},
      dailyGoalXp: DAILY_GOAL_XP,

      setActiveLanguage: (id) => set({ activeLanguage: id }),

      getEffectiveHearts: () => {
        const { heartsCount, heartsLastLostAt } = get()
        if (heartsCount >= MAX_HEARTS || !heartsLastLostAt) return Math.min(heartsCount, MAX_HEARTS)
        const elapsed = Date.now() - heartsLastLostAt
        const regained = Math.floor(elapsed / HEART_REGEN_MS)
        return Math.min(MAX_HEARTS, heartsCount + regained)
      },

      loseHeart: () => {
        const current = get().getEffectiveHearts()
        if (current <= 0) return
        set({
          heartsCount: current - 1,
          heartsLastLostAt: Date.now(),
        })
      },

      refillHearts: () => set({ heartsCount: MAX_HEARTS, heartsLastLostAt: null }),

      completeLesson: (lessonId, accuracy, xpEarned) => {
        const state = get()
        const today = todayKey()
        const stars = accuracy >= 0.95 ? 3 : accuracy >= 0.8 ? 2 : accuracy >= 0.5 ? 1 : 0

        const prev = state.lessonResults[lessonId]
        const nextResult: LessonResult = {
          stars: Math.max(stars, prev?.stars ?? 0),
          bestAccuracy: Math.max(accuracy, prev?.bestAccuracy ?? 0),
          completedAt: new Date().toISOString(),
          timesCompleted: (prev?.timesCompleted ?? 0) + 1,
        }

        let { streak, lastActiveDate } = state
        if (lastActiveDate !== today) {
          const gap = lastActiveDate ? daysBetween(lastActiveDate, today) : null
          streak = gap === 1 ? streak + 1 : 1
          lastActiveDate = today
        }

        const xpToday = state.xpTodayDate === today ? state.xpToday + xpEarned : xpEarned

        set({
          xp: state.xp + xpEarned,
          xpToday,
          xpTodayDate: today,
          streak,
          lastActiveDate,
          lessonResults: { ...state.lessonResults, [lessonId]: nextResult },
        })
      },

      completeDialogue: (dialogueId) =>
        set((state) => ({ dialogueCompleted: { ...state.dialogueCompleted, [dialogueId]: true } })),

      dailyGoalProgress: () => {
        const state = get()
        const today = todayKey()
        const xpToday = state.xpTodayDate === today ? state.xpToday : 0
        return Math.min(1, xpToday / state.dailyGoalXp)
      },
    }),
    { name: 'chairtalk-progress' },
  ),
)

export { MAX_HEARTS }
