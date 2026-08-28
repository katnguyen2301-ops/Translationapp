import { useEffect, useMemo, useState } from 'react'
import type { MatchExercise } from '../../data/types'
import { speak } from '../../lib/speech'

interface Card {
  key: string
  phraseId: string
  side: 'en' | 'target'
  text: string
  translit?: string
}

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function MatchQuestion({
  exercise,
  speechLang,
  onAnswered,
}: {
  exercise: MatchExercise
  speechLang: string
  onAnswered: (correct: boolean) => void
}) {
  const leftCards = useMemo(
    () => shuffleArr(exercise.phrases.map((p): Card => ({ key: `en-${p.id}`, phraseId: p.id, side: 'en', text: p.en }))),
    [exercise],
  )
  const rightCards = useMemo(
    () =>
      shuffleArr(
        exercise.phrases.map((p): Card => ({
          key: `tg-${p.id}`,
          phraseId: p.id,
          side: 'target',
          text: p.target,
          translit: p.translit,
        })),
      ),
    [exercise],
  )

  const [solved, setSolved] = useState<Set<string>>(new Set())
  const [selectedLeft, setSelectedLeft] = useState<Card | null>(null)
  const [selectedRight, setSelectedRight] = useState<Card | null>(null)
  const [wrongPair, setWrongPair] = useState<string | null>(null)
  const [mismatches, setMismatches] = useState(0)
  const finished = solved.size === exercise.phrases.length

  useEffect(() => {
    setSolved(new Set())
    setSelectedLeft(null)
    setSelectedRight(null)
    setMismatches(0)
  }, [exercise])

  useEffect(() => {
    if (finished) onAnswered(mismatches === 0)
  }, [finished]) // eslint-disable-line react-hooks/exhaustive-deps

  function pick(card: Card) {
    if (solved.has(card.phraseId)) return
    if (card.side === 'en') {
      setSelectedLeft(card)
      if (selectedRight) evaluate(card, selectedRight)
    } else {
      speak(card.text, speechLang, 1)
      setSelectedRight(card)
      if (selectedLeft) evaluate(selectedLeft, card)
    }
  }

  function evaluate(left: Card, right: Card) {
    if (left.phraseId === right.phraseId) {
      setSolved((s) => new Set([...s, left.phraseId]))
      setSelectedLeft(null)
      setSelectedRight(null)
    } else {
      setMismatches((m) => m + 1)
      setWrongPair(`${left.key}|${right.key}`)
      setTimeout(() => {
        setWrongPair(null)
        setSelectedLeft(null)
        setSelectedRight(null)
      }, 500)
    }
  }

  function cardClass(card: Card) {
    const isSolved = solved.has(card.phraseId)
    const isSelected = selectedLeft?.key === card.key || selectedRight?.key === card.key
    const isWrong = wrongPair?.includes(card.key)
    return [
      'rounded-xl border-2 px-3 py-3 text-left font-semibold transition',
      isSolved && 'invisible',
      !isSolved && isWrong && 'border-rose-400 bg-rose-50 text-rose-600 animate-shake',
      !isSolved && !isWrong && isSelected && 'border-vietnamese bg-sky-50 text-sky-700',
      !isSolved && !isWrong && !isSelected && 'border-slate-200 bg-white hover:bg-slate-50',
    ]
      .filter(Boolean)
      .join(' ')
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <p className="text-center text-lg font-bold text-slate-500">Match the pairs</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {leftCards.map((c) => (
            <button key={c.key} onClick={() => pick(c)} disabled={solved.has(c.phraseId)} className={cardClass(c)}>
              {c.text}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {rightCards.map((c) => (
            <button key={c.key} onClick={() => pick(c)} disabled={solved.has(c.phraseId)} className={cardClass(c)}>
              {c.text}
              {c.translit && <div className="text-xs font-normal opacity-60">{c.translit}</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
