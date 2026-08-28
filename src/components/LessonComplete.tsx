import type { CSSProperties } from 'react'
import type { LanguageCourse } from '../data/types'

export function LessonComplete({
  course,
  accuracy,
  xpEarned,
  correctCount,
  wrongCount,
  onContinue,
}: {
  course: LanguageCourse
  accuracy: number
  xpEarned: number
  correctCount: number
  wrongCount: number
  onContinue: () => void
}) {
  const stars = accuracy >= 0.95 ? 3 : accuracy >= 0.8 ? 2 : accuracy >= 0.5 ? 1 : 0

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-4 text-center">
      <div className="animate-float text-7xl">{stars >= 2 ? '🎉' : '🙂'}</div>
      <h1 className="text-3xl font-extrabold text-slate-800">Lesson Complete!</h1>
      <div className="flex gap-2 text-4xl">
        {[0, 1, 2].map((i) => (
          <span key={i} className={i < stars ? 'text-gold' : 'text-slate-200'}>
            ★
          </span>
        ))}
      </div>

      <div className="grid w-full max-w-sm grid-cols-3 gap-3">
        <Stat label="XP" value={`+${xpEarned}`} color="text-sky-500" />
        <Stat label="Correct" value={String(correctCount)} color="text-green-500" />
        <Stat label="Missed" value={String(wrongCount)} color="text-rose-500" />
      </div>

      <button
        onClick={onContinue}
        className="mt-4 w-full max-w-sm rounded-2xl px-8 py-4 text-lg font-extrabold text-white btn-3d"
        style={{ backgroundColor: course.colorHex, '--btn-shadow': '#00000033' } as CSSProperties}
      >
        Continue
      </button>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl border-2 border-slate-100 px-3 py-4">
      <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
      <div className="text-xs font-bold uppercase text-slate-400">{label}</div>
    </div>
  )
}
