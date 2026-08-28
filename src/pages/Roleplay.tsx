import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCourse } from '../data/courses'
import type { LanguageId } from '../data/types'
import { useProgress } from '../store/useProgress'
import { TopBar } from '../components/TopBar'
import { fuzzyMatch, listenOnce, recognitionSupported, speak } from '../lib/speech'

type MicStatus = 'idle' | 'listening' | 'wrong' | 'unsupported'

export function Roleplay() {
  const { lang } = useParams<{ lang: LanguageId }>()
  const navigate = useNavigate()
  const course = lang ? getCourse(lang) : undefined
  const roleplay = course?.roleplay
  const completeDialogue = useProgress((s) => s.completeDialogue)

  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [micStatus, setMicStatus] = useState<MicStatus>(recognitionSupported() ? 'idle' : 'unsupported')
  const [heardText, setHeardText] = useState<string | null>(null)

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
    setMicStatus(recognitionSupported() ? 'idle' : 'unsupported')
    setHeardText(null)
  }, [revealed])

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
    setMicStatus('listening')
    setHeardText(null)
    listenOnce(
      course!.speechLang,
      (transcript) => {
        setHeardText(transcript)
        if (fuzzyMatch(transcript, line.target)) {
          setRevealed((s) => new Set([...s, i]))
          speak(line.target, course!.speechLang)
        } else {
          setMicStatus('wrong')
        }
      },
      () => setMicStatus('wrong'),
    )
  }

  function revealAnswer(i: number) {
    setRevealed((s) => new Set([...s, i]))
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <TopBar course={course} showBack />
      <div className="mx-auto max-w-xl px-4 py-6">
        <h1 className="text-2xl font-extrabold text-slate-800">🎭 {roleplay.title}</h1>
        <p className="mb-6 text-slate-500">{roleplay.scenario}</p>

        <div className="flex flex-col gap-4">
          {roleplay.lines.map((line, i) => {
            const canShow = i === 0 || revealed.has(i - 1)
            const isRevealed = revealed.has(i)
            const isYou = line.speaker === 'you'
            if (!canShow) return null

            if (isYou && !isRevealed) {
              const isActive = i === activeIndex
              return (
                <div key={i} className="flex justify-end">
                  <div className="flex max-w-[85%] flex-col gap-3 rounded-2xl rounded-tr-sm border-2 border-dashed border-brand/40 bg-green-50 p-4">
                    <p className="text-xs font-bold uppercase text-slate-400">You need to say</p>
                    <p className="text-lg font-bold text-slate-800">{line.en}</p>

                    {micStatus === 'unsupported' ? (
                      <p className="text-sm text-slate-500">
                        Your browser doesn't support speech recognition here.
                      </p>
                    ) : isActive ? (
                      <>
                        {heardText && micStatus === 'wrong' && (
                          <p className="text-sm text-slate-500">
                            I heard: <span className="italic">"{heardText}"</span>
                          </p>
                        )}
                        <button
                          onClick={() => attemptSpeak(i)}
                          disabled={micStatus === 'listening'}
                          className={[
                            'rounded-2xl px-4 py-3 font-extrabold text-white btn-3d',
                            micStatus === 'wrong' ? 'bg-amber-500' : 'bg-brand',
                          ].join(' ')}
                        >
                          {micStatus === 'listening'
                            ? '🎙️ Listening…'
                            : micStatus === 'wrong'
                              ? '🔁 Try again'
                              : `🎤 Speak in ${course.englishName}`}
                        </button>
                      </>
                    ) : null}

                    <button
                      onClick={() => revealAnswer(i)}
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
          <div className="mt-8 flex flex-col items-center gap-4">
            <p className="text-xl font-extrabold text-slate-800">Visit complete! 🎉</p>
            <button
              onClick={() => navigate(`/learn/${course.id}`)}
              className="rounded-2xl px-8 py-3 font-extrabold text-white btn-3d"
              style={{ backgroundColor: course.colorHex }}
            >
              Back to path
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
