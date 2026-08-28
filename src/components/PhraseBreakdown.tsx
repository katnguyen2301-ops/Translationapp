import type { LanguageId, Phrase } from '../data/types'
import { glossaries } from '../data/glossary'
import { chunksFor } from '../lib/exerciseGenerator'
import { speak } from '../lib/speech'

const PUNCTUATION = /^[，。？！、,.?!]+$/

/**
 * Word-by-word (Mandarin: character-by-character) breakdown of a phrase,
 * shown after a learner has missed it a couple of times. Tapping any piece
 * plays its pronunciation on its own.
 */
export function PhraseBreakdown({ phrase, lang, speechLang }: { phrase: Phrase; lang: LanguageId; speechLang: string }) {
  const glossary = glossaries[lang]
  const chunks = chunksFor(phrase, lang).filter((c) => !PUNCTUATION.test(c))

  return (
    <div className="mx-auto mt-4 w-full max-w-xl rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
      <p className="mb-3 text-sm font-bold text-amber-700">🔍 Missed this a couple times — here's the breakdown</p>
      <div className="flex flex-wrap gap-2">
        {lang === 'mandarin'
          ? chunks.flatMap((chunk) =>
              Array.from(chunk)
                .filter((ch) => !PUNCTUATION.test(ch))
                .map((ch, i) => {
                  const entry = glossary[ch]
                  return (
                    <button
                      key={`${chunk}-${i}`}
                      onClick={() => speak(ch, speechLang, 0.7)}
                      className="flex min-w-16 flex-col items-center rounded-xl border border-amber-200 bg-white px-3 py-2 text-center hover:bg-amber-100"
                    >
                      <span className="text-xl font-bold text-slate-800">{ch}</span>
                      {entry?.translit && <span className="text-xs text-slate-500">{entry.translit}</span>}
                      <span className="text-xs text-amber-700">{entry?.en ?? '…'}</span>
                    </button>
                  )
                }),
            )
          : chunks.map((word, i) => {
              const entry = glossary[word.toLowerCase()]
              return (
                <button
                  key={`${word}-${i}`}
                  onClick={() => speak(word, speechLang, 0.7)}
                  className="flex min-w-16 flex-col items-center rounded-xl border border-amber-200 bg-white px-3 py-2 text-center hover:bg-amber-100"
                >
                  <span className="text-lg font-bold text-slate-800">{word}</span>
                  <span className="text-xs text-amber-700">{entry?.en ?? '…'}</span>
                </button>
              )
            })}
      </div>
    </div>
  )
}
