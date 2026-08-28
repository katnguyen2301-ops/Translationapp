import { useMemo, useState, type CSSProperties } from 'react'
import { useParams } from 'react-router-dom'
import { getCourse } from '../data/courses'
import type { LanguageId, Phrase, Unit } from '../data/types'
import { TopBar } from '../components/TopBar'
import { ToothDiagram, iconForPhrase } from '../components/ToothDiagram'
import { fuzzyMatch, listenOnce, recognitionSupported, speak } from '../lib/speech'

type MicState = 'idle' | 'listening' | 'correct' | 'retry'

function PhraseCard({ phrase, unit, speechLang }: { phrase: Phrase; unit: Unit; speechLang: string }) {
  const [micState, setMicState] = useState<MicState>('idle')
  const icon = iconForPhrase(phrase.en, unit.icon)

  function tryIt() {
    setMicState('listening')
    listenOnce(
      speechLang,
      (transcript) => {
        setMicState(fuzzyMatch(transcript, phrase.target) ? 'correct' : 'retry')
        setTimeout(() => setMicState('idle'), 1600)
      },
      () => setTimeout(() => setMicState('idle'), 200),
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-slate-100 bg-white p-3 shadow-sm">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-50 text-2xl">
        {icon.kind === 'tooth' ? <ToothDiagram variant={icon.variant} className="h-9 w-9" /> : icon.value}
      </div>

      <button onClick={() => speak(phrase.target, speechLang)} className="flex-1 text-left">
        <p className="text-lg font-extrabold text-slate-800">{phrase.target}</p>
        {phrase.translit && <p className="text-sm text-slate-400">{phrase.translit}</p>}
        <p className="text-sm text-slate-500">{phrase.en}</p>
      </button>

      <div className="flex shrink-0 flex-col items-center gap-1">
        <button
          onClick={() => speak(phrase.target, speechLang)}
          className="grid h-11 w-11 place-items-center rounded-full bg-brand text-xl text-white btn-3d"
          style={{ '--btn-shadow': '#46a302' } as CSSProperties}
          aria-label="Speak this phrase"
        >
          🔊
        </button>
        {recognitionSupported() && (
          <button
            onClick={tryIt}
            disabled={micState === 'listening'}
            className={[
              'rounded-full px-2 py-1 text-xs font-bold',
              micState === 'correct'
                ? 'bg-green-100 text-green-700'
                : micState === 'retry'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-500',
            ].join(' ')}
          >
            {micState === 'listening' ? '🎙️…' : micState === 'correct' ? '✅' : micState === 'retry' ? '🔁' : '🎤 Try it'}
          </button>
        )}
      </div>
    </div>
  )
}

export function QuickPhrases() {
  const { lang } = useParams<{ lang: LanguageId }>()
  const course = lang ? getCourse(lang) : undefined
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    if (!course) return []
    const q = query.trim().toLowerCase()
    return course.units
      .map((unit) => ({
        unit,
        phrases: unit.lessons
          .flatMap((l) => l.phrases)
          .filter(
            (p) =>
              !q ||
              p.en.toLowerCase().includes(q) ||
              p.target.toLowerCase().includes(q) ||
              (p.translit ?? '').toLowerCase().includes(q),
          ),
      }))
      .filter((g) => g.phrases.length > 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, query])

  if (!course) {
    return (
      <div className="p-8 text-center">
        <p>Course not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-16">
      <TopBar course={course} showBack />
      <div className="mx-auto max-w-xl px-4 py-6">
        <h1 className="text-2xl font-extrabold text-slate-800">💬 Quick Phrases</h1>
        <p className="mb-4 text-slate-500">
          Find a phrase, tap 🔊 to have your phone say it — hold it up for the patient, or read along yourself.
        </p>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search e.g. "how are you", "root canal"…'
          className="mb-6 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-brand"
        />

        {groups.length === 0 && <p className="text-center text-slate-400">No phrases match "{query}".</p>}

        <div className="flex flex-col gap-6">
          {groups.map(({ unit, phrases }) => (
            <section key={unit.id}>
              <h2 className="mb-2 flex items-center gap-2 font-extrabold text-slate-700">
                <span>{unit.icon}</span> {unit.title}
              </h2>
              <div className="flex flex-col gap-2">
                {phrases.map((phrase) => (
                  <PhraseCard key={phrase.id} phrase={phrase} unit={unit} speechLang={course.speechLang} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
