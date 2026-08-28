import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCourse } from '../data/courses'
import type { LanguageId } from '../data/types'
import { useProgress } from '../store/useProgress'
import { TopBar } from '../components/TopBar'
import { ShadowMic } from '../components/ShadowMic'
import { speak } from '../lib/speech'

export function DialoguePage() {
  const { lang, dialogueId } = useParams<{ lang: LanguageId; dialogueId: string }>()
  const navigate = useNavigate()
  const course = lang ? getCourse(lang) : undefined
  const dialogue = course?.units.map((u) => u.dialogue).find((d) => d?.id === dialogueId)
  const completeDialogue = useProgress((s) => s.completeDialogue)

  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  const allRevealed = !!dialogue && revealed.size === dialogue.lines.length

  useEffect(() => {
    if (allRevealed && dialogue) completeDialogue(dialogue.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRevealed])

  // Patient lines have no "what do you say?" choice, so nothing else ever
  // marks them revealed — auto-reveal each one as soon as it becomes visible
  // so the conversation keeps flowing past them.
  useEffect(() => {
    if (!dialogue) return
    for (let i = 0; i < dialogue.lines.length; i++) {
      const canShow = i === 0 || revealed.has(i - 1)
      if (canShow && !revealed.has(i) && dialogue.lines[i].speaker !== 'you') {
        setRevealed((s) => new Set([...s, i]))
        break
      }
    }
  }, [revealed, dialogue])

  if (!course || !dialogue) {
    return (
      <div className="p-8 text-center">
        <p>Dialogue not found.</p>
      </div>
    )
  }

  function reveal(i: number) {
    setRevealed((s) => new Set([...s, i]))
    speak(dialogue!.lines[i].target, course!.speechLang)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <TopBar course={course} showBack />
      <div className="mx-auto max-w-xl px-4 py-6">
        <h1 className="text-2xl font-extrabold text-slate-800">{dialogue.title}</h1>
        <p className="mb-6 text-slate-500">{dialogue.scenario}</p>

        <div className="flex flex-col gap-4">
          {dialogue.lines.map((line, i) => {
            const canShow = i === 0 || revealed.has(i - 1)
            const isRevealed = revealed.has(i)
            const isYou = line.speaker === 'you'

            if (!canShow) return null

            if (isYou && !isRevealed) {
              const decoys = dialogue.lines
                .filter((_, j) => j !== i && dialogue.lines[j].speaker === 'you')
                .slice(0, 2)
              const options = shuffleOnce([line, ...decoys], i)
              return (
                <div key={i} className="flex justify-end">
                  <div className="flex max-w-[85%] flex-col gap-2 rounded-2xl rounded-tr-sm bg-white p-3 shadow-sm">
                    <p className="text-xs font-bold text-slate-400">What do you say?</p>
                    {options.map((opt, oi) => (
                      <button
                        key={oi}
                        onClick={() => reveal(i)}
                        className="rounded-xl border-2 border-slate-200 px-3 py-2 text-left text-sm font-semibold hover:border-brand hover:bg-green-50"
                      >
                        {opt.en}
                      </button>
                    ))}
                  </div>
                </div>
              )
            }

            return (
              <div key={i} className={`flex ${isYou ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={[
                    'animate-pop max-w-[85%] rounded-2xl px-4 py-3 text-left shadow-sm',
                    isYou ? 'rounded-tr-sm bg-brand text-white' : 'rounded-tl-sm bg-white text-slate-800',
                  ].join(' ')}
                >
                  <button onClick={() => speak(line.target, course.speechLang)} className="block w-full text-left">
                    <p className="text-xs font-bold uppercase opacity-70">{isYou ? 'You' : 'Patient'} 🔊</p>
                    <p className="text-lg font-bold">{line.target}</p>
                    {line.translit && <p className="text-sm opacity-80">{line.translit}</p>}
                    <p className="mt-1 text-sm opacity-80">{line.en}</p>
                  </button>
                  {isYou && <ShadowMic text={line.target} lang={course.speechLang} />}
                </div>
              </div>
            )
          })}
        </div>

        {allRevealed && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <p className="text-xl font-extrabold text-slate-800">Conversation complete! 💬</p>
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

function shuffleOnce<T>(arr: T[], seed: number): T[] {
  const a = [...arr]
  let s = seed + 1
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
