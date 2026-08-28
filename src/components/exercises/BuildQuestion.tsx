import { useEffect, useState, type CSSProperties } from 'react'
import type { BuildExercise, LanguageId } from '../../data/types'
import { speak } from '../../lib/speech'
import { pinyinFor } from '../../lib/pinyin'

interface Chip {
  key: string
  text: string
}

export function BuildQuestion({
  exercise,
  speechLang,
  lang,
  onAnswered,
}: {
  exercise: BuildExercise
  speechLang: string
  lang: LanguageId
  onAnswered: (correct: boolean) => void
}) {
  const [bank, setBank] = useState<Chip[]>([])
  const [answer, setAnswer] = useState<Chip[]>([])
  const [checked, setChecked] = useState<null | boolean>(null)

  useEffect(() => {
    setBank(exercise.chips.map((text, i) => ({ key: `${i}-${text}`, text })))
    setAnswer([])
    setChecked(null)
  }, [exercise])

  function addChip(chip: Chip) {
    if (checked !== null) return
    setBank((b) => b.filter((c) => c.key !== chip.key))
    setAnswer((a) => [...a, chip])
  }

  function removeChip(chip: Chip) {
    if (checked !== null) return
    setAnswer((a) => a.filter((c) => c.key !== chip.key))
    setBank((b) => [...b, chip])
  }

  function check() {
    const built = answer.map((c) => c.text)
    const correct =
      built.length === exercise.correctOrder.length &&
      built.every((t, i) => t === exercise.correctOrder[i])
    setChecked(correct)
    onAnswered(correct)
  }

  const joiner = /[一-鿿]/.test(exercise.correctOrder[0] ?? '') ? '' : ' '

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => speak(exercise.phrase.target, speechLang)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-lg hover:bg-slate-200"
          aria-label="Play audio"
        >
          🔊
        </button>
        <div>
          <p className="text-sm font-bold text-slate-400">Build this phrase</p>
          <p className="text-xl font-extrabold text-slate-800">{exercise.phrase.en}</p>
        </div>
      </div>

      <div className="min-h-16 rounded-2xl border-2 border-dashed border-slate-200 p-3">
        <div className="flex flex-wrap gap-2">
          {answer.map((chip) => (
            <button
              key={chip.key}
              onClick={() => removeChip(chip)}
              disabled={checked !== null}
              className={[
                'animate-pop flex flex-col items-center rounded-xl border-2 px-3 py-2 text-lg font-semibold',
                checked === null && 'border-slate-300 bg-white hover:bg-slate-50',
                checked === true && 'border-brand bg-green-50 text-green-700',
                checked === false && 'border-rose-400 bg-rose-50 text-rose-600',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {chip.text}
              {lang === 'mandarin' && <span className="text-xs font-normal opacity-70">{pinyinFor(chip.text, lang)}</span>}
            </button>
          ))}
          {answer.length === 0 && <span className="text-slate-300">Tap words below</span>}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {bank.map((chip) => (
          <button
            key={chip.key}
            onClick={() => addChip(chip)}
            className="flex flex-col items-center rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-lg font-semibold hover:bg-slate-50 btn-3d"
            style={{ '--btn-shadow': '#e2e8f0' } as CSSProperties}
          >
            {chip.text}
            {lang === 'mandarin' && <span className="text-xs font-normal text-slate-400">{pinyinFor(chip.text, lang)}</span>}
          </button>
        ))}
      </div>

      {checked === false && (
        <p className="text-center font-semibold text-rose-500">
          Correct answer: {exercise.correctOrder.join(joiner)}
          {lang === 'mandarin' && (
            <span className="mt-1 block text-sm font-normal text-rose-400">
              {pinyinFor(exercise.correctOrder.join(''), lang)}
            </span>
          )}
        </p>
      )}

      {checked === null && (
        <button
          onClick={check}
          disabled={answer.length === 0}
          className="mx-auto rounded-2xl bg-brand px-8 py-3 font-extrabold text-white btn-3d disabled:bg-slate-200 disabled:text-slate-400"
          style={{ '--btn-shadow': '#46a302' } as CSSProperties}
        >
          Check
        </button>
      )}
    </div>
  )
}
