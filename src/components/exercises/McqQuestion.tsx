import { useEffect, useState, type CSSProperties } from 'react'
import type { McqExercise } from '../../data/types'
import { speak } from '../../lib/speech'

export function McqQuestion({
  exercise,
  speechLang,
  onAnswered,
}: {
  exercise: McqExercise
  speechLang: string
  onAnswered: (correct: boolean) => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const answered = selected !== null

  useEffect(() => {
    setSelected(null)
    if (exercise.kind === 'listening') {
      const t = setTimeout(() => speak(exercise.phrase.target, speechLang), 300)
      return () => clearTimeout(t)
    }
  }, [exercise, speechLang])

  function choose(i: number) {
    if (answered) return
    setSelected(i)
    onAnswered(i === exercise.correctIndex)
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <Prompt exercise={exercise} speechLang={speechLang} />
      <div className="grid gap-3 sm:grid-cols-2">
        {exercise.options.map((opt, i) => {
          const isCorrect = i === exercise.correctIndex
          const isSelected = i === selected
          const showState = answered && (isSelected || isCorrect)
          const label = exercise.kind === 'mcqTarget' ? opt.target : opt.en
          const sub = exercise.kind === 'mcqTarget' ? opt.translit : undefined
          return (
            <button
              key={opt.id}
              disabled={answered}
              onClick={() => choose(i)}
              className={[
                'rounded-2xl border-2 px-4 py-4 text-left text-lg font-semibold transition',
                !answered && 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                showState && isCorrect && 'border-brand bg-green-50 text-green-700',
                showState && isSelected && !isCorrect && 'border-rose-400 bg-rose-50 text-rose-600 animate-shake',
                answered && !isSelected && !isCorrect && 'border-slate-100 text-slate-400',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {label}
              {sub && <div className="text-sm font-normal text-slate-400">{sub}</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Prompt({ exercise, speechLang }: { exercise: McqExercise; speechLang: string }) {
  if (exercise.kind === 'listening') {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <p className="text-center text-lg font-bold text-slate-500">Tap to listen, then choose the meaning</p>
        <button
          onClick={() => speak(exercise.phrase.target, speechLang)}
          className="grid h-20 w-20 place-items-center rounded-full bg-vietnamese text-3xl text-white shadow-lg btn-3d"
          style={{ '--btn-shadow': '#0d8bcc' } as CSSProperties}
          aria-label="Play audio"
        >
          🔊
        </button>
      </div>
    )
  }
  if (exercise.kind === 'mcqEnglish') {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-lg font-bold text-slate-500">What does this mean?</p>
        <div className="flex items-center gap-3">
          <p className="text-3xl font-extrabold text-slate-800">{exercise.phrase.target}</p>
          <button
            onClick={() => speak(exercise.phrase.target, speechLang)}
            className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-lg hover:bg-slate-200"
            aria-label="Play audio"
          >
            🔊
          </button>
        </div>
        {exercise.phrase.translit && <p className="text-slate-400">{exercise.phrase.translit}</p>}
      </div>
    )
  }
  // mcqTarget
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <p className="text-lg font-bold text-slate-500">How do you say this?</p>
      <p className="text-2xl font-extrabold text-slate-800">{exercise.phrase.en}</p>
    </div>
  )
}
