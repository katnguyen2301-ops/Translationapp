import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCourse } from '../data/courses'
import type { DialogueLine, LanguageId } from '../data/types'
import { useProgress } from '../store/useProgress'
import { TopBar } from '../components/TopBar'
import { listenOnce, recognitionSupported, speak, wordMatchReport, type WordMatch } from '../lib/speech'

type Mode = 'speak' | 'choose'
type SpeakStatus = 'idle' | 'listening' | 'result' | 'unsupported'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function Roleplay() {
  const { lang, roleplayId } = useParams<{ lang: LanguageId; roleplayId: string }>()
  const navigate = useNavigate()
  const course = lang ? getCourse(lang) : undefined
  const roleplay = course?.units.map((u) => u.roleplay).find((r) => r?.id === roleplayId)
  const completeDialogue = useProgress((s) => s.completeDialogue)

  const [mode, setMode] = useState<Mode>(recognitionSupported() ? 'speak' : 'choose')
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [speakStatus, setSpeakStatus] = useState<SpeakStatus>(recognitionSupported() ? 'idle' : 'unsupported')
  const [report, setReport] = useState<WordMatch[] | null>(null)
  const [wrongChoice, setWrongChoice] = useState<number | null>(null)

  const allRevealed = !!roleplay && revealed.size === roleplay.lines.length

  useEffect(() => {
    if (allRevealed && roleplay) completeDialogue(roleplay.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRevealed])

  // Patient lines auto-reveal (with audio) as soon as they become visible.
  useEffect(() => {
    if (!roleplay) return
    for (let i = 0; i < roleplay.lines.length; i++) {
      const canShow = i === 0 || revealed.has(i - 1)
      if (canShow && !revealed.has(i) && roleplay.lines[i].speaker !== 'you') {
        setRevealed((s) => new Set([...s, i]))
        speak(roleplay.lines[i].target, course!.speechLang)
        break
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, roleplay])

  useEffect(() => {
    setSpeakStatus(recognitionSupported() ? 'idle' : 'unsupported')
    setReport(null)
    setWrongChoice(null)
  }, [revealed, mode])

  if (!course || !roleplay) {
    return (
      <div className="p-8 text-center">
        <p>Roleplay not found.</p>
      </div>
    )
  }

  const activeIndex = roleplay.lines.findIndex((_, i) => !revealed.has(i))

  function attemptSpeak(i: number) {
    const line = roleplay!.lines[i]
    setSpeakStatus('listening')
    setReport(null)
    listenOnce(
      course!.speechLang,
      (transcript) => {
        setReport(wordMatchReport(transcript, line.target))
        setSpeakStatus('result')
      },
      () => setSpeakStatus('idle'),
    )
  }

  function revealAndAdvance(i: number) {
    setRevealed((s) => new Set([...s, i]))
    speak(roleplay!.lines[i].target, course!.speechLang)
  }

  function chooseOption(i: number, optionLine: DialogueLine, optionIndex: number) {
    if (optionLine.target === roleplay!.lines[i].target) {
      revealAndAdvance(i)
    } else {
      setWrongChoice(optionIndex)
      setTimeout(() => setWrongChoice(null), 500)
    }
  }

  return (
    <div className="min-h-screen pb-16">
      <TopBar course={course} showBack />
      <div className="mx-auto max-w-xl px-4 py-6">
        <h1 className="text-2xl font-extrabold text-slate-800">🎭 {roleplay.title}</h1>
        <p className="mb-4 text-slate-500">{roleplay.scenario}</p>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setMode('speak')}
            disabled={speakStatus === 'unsupported'}
            className={[
              'flex-1 rounded-xl px-3 py-2 text-sm font-bold',
              mode === 'speak' ? 'bg-brand text-white' : 'bg-white text-slate-500',
              speakStatus === 'unsupported' && 'opacity-40',
            ].join(' ')}
          >
            🎤 Speak it
          </button>
          <button
            onClick={() => setMode('choose')}
            className={['flex-1 rounded-xl px-3 py-2 text-sm font-bold', mode === 'choose' ? 'bg-brand text-white' : 'bg-white text-slate-500'].join(
              ' ',
            )}
          >
            🔤 Choose it in {course.englishName}
          </button>
        </div>
        {mode === 'speak' && speakStatus === 'unsupported' && (
          <p className="-mt-4 mb-6 text-xs text-slate-400">
            Your browser doesn't support speech recognition, so "Choose it" is used instead.
          </p>
        )}

        <div className="flex flex-col gap-4">
          {roleplay.lines.map((line, i) => {
            const canShow = i === 0 || revealed.has(i - 1)
            const isRevealed = revealed.has(i)
            const isYou = line.speaker === 'you'
            if (!canShow) return null

            if (isYou && !isRevealed) {
              const isActive = i === activeIndex
              const effectiveMode = speakStatus === 'unsupported' ? 'choose' : mode

              const decoys = shuffle(
                roleplay.lines.filter((l, j) => j !== i && l.speaker === 'you' && l.target !== line.target),
              ).slice(0, 3)
              const options = isActive ? shuffle([line, ...decoys]) : []

              return (
                <div key={i} className="flex justify-end">
                  <div className="flex max-w-[85%] flex-col gap-3 rounded-2xl rounded-tr-sm border-2 border-dashed border-brand/40 bg-green-50 p-4">
                    <p className="text-xs font-bold uppercase text-slate-400">You need to say</p>
                    <p className="text-lg font-bold text-slate-800">{line.en}</p>

                    {isActive && effectiveMode === 'choose' && (
                      <div className="flex flex-col gap-2">
                        {options.map((opt, oi) => (
                          <button
                            key={oi}
                            onClick={() => chooseOption(i, opt, oi)}
                            className={[
                              'rounded-xl border-2 px-3 py-2 text-left text-base font-semibold',
                              wrongChoice === oi
                                ? 'animate-shake border-rose-400 bg-rose-50 text-rose-600'
                                : 'border-slate-200 bg-white hover:border-brand hover:bg-green-50',
                            ].join(' ')}
                          >
                            {opt.target}
                            {opt.translit && <div className="text-sm font-normal opacity-70">{opt.translit}</div>}
                          </button>
                        ))}
                      </div>
                    )}

                    {isActive && effectiveMode === 'speak' && (
                      <>
                        {report && (
                          <div className="rounded-xl bg-white p-3">
                            <p className="mb-1 text-xs font-bold uppercase text-slate-400">Here's what you said:</p>
                            <p className="text-lg font-bold">
                              {report.map((w, wi) => (
                                <span key={wi} className={w.matched ? 'text-green-600' : 'text-rose-500 underline decoration-wavy'}>
                                  {w.word}
                                  {wi < report.length - 1 ? ' ' : ''}
                                </span>
                              ))}
                            </p>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => attemptSpeak(i)}
                            disabled={speakStatus === 'listening'}
                            className={[
                              'rounded-2xl px-4 py-3 font-extrabold text-white btn-3d',
                              speakStatus === 'result' ? 'bg-amber-500' : 'bg-brand',
                            ].join(' ')}
                          >
                            {speakStatus === 'listening'
                              ? '🎙️ Listening…'
                              : speakStatus === 'result'
                                ? '🔁 Try again'
                                : `🎤 Speak in ${course.englishName}`}
                          </button>
                          {report && (
                            <button
                              onClick={() => revealAndAdvance(i)}
                              className="rounded-2xl bg-slate-700 px-4 py-3 font-extrabold text-white btn-3d"
                            >
                              Continue
                            </button>
                          )}
                        </div>
                      </>
                    )}

                    <button
                      onClick={() => revealAndAdvance(i)}
                      className="text-left text-xs font-bold text-slate-400 underline hover:text-slate-600"
                    >
                      Show me the answer
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div key={i} className={`flex ${isYou ? 'justify-end' : 'justify-start'}`}>
                <button
                  onClick={() => speak(line.target, course.speechLang)}
                  className={[
                    'animate-pop max-w-[85%] rounded-2xl px-4 py-3 text-left shadow-sm',
                    isYou ? 'rounded-tr-sm bg-brand text-white' : 'rounded-tl-sm bg-white text-slate-800',
                  ].join(' ')}
                >
                  <p className="text-xs font-bold uppercase opacity-70">{isYou ? 'You' : 'Patient'} 🔊</p>
                  <p className="text-lg font-bold">{line.target}</p>
                  {line.translit && <p className="text-sm opacity-80">{line.translit}</p>}
                  <p className="mt-1 text-sm opacity-80">{line.en}</p>
                </button>
              </div>
            )
          })}
        </div>

        {allRevealed && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="text-xl font-extrabold text-slate-800">Visit complete! 🎉</p>
            <button
              onClick={() => navigate(`/learn/${course.id}`)}
              className="w-full max-w-xs rounded-2xl px-8 py-3 font-extrabold text-white btn-3d"
              style={{ backgroundColor: course.colorHex }}
            >
              Back to path
            </button>
            <button
              onClick={() => setRevealed(new Set())}
              className="w-full max-w-xs rounded-2xl border-2 border-slate-200 bg-white px-8 py-3 font-bold text-slate-600 hover:bg-slate-50"
            >
              🔁 Practice this conversation again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
