import { useMemo, useState, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCourse, coursePhrasePool } from '../data/courses'
import type { Exercise, LanguageId } from '../data/types'
import { generateExercises } from '../lib/exerciseGenerator'
import { useProgress } from '../store/useProgress'
import { TopBar } from '../components/TopBar'
import { ExerciseProgress } from '../components/ExerciseProgress'
import { McqQuestion } from '../components/exercises/McqQuestion'
import { BuildQuestion } from '../components/exercises/BuildQuestion'
import { MatchQuestion } from '../components/exercises/MatchQuestion'
import { LessonComplete } from '../components/LessonComplete'

type Phase = 'main' | 'reviewIntro' | 'review'

export function Lesson() {
  const { lang, lessonId } = useParams<{ lang: LanguageId; lessonId: string }>()
  const navigate = useNavigate()
  const course = lang ? getCourse(lang) : undefined
  const lesson = course?.units.flatMap((u) => u.lessons).find((l) => l.id === lessonId)

  const loseHeart = useProgress((s) => s.loseHeart)
  const heartsNow = useProgress((s) => s.getEffectiveHearts())
  const completeLesson = useProgress((s) => s.completeLesson)

  const initialExercises = useMemo(() => {
    if (!course || !lesson) return []
    return generateExercises(lesson, coursePhrasePool(course), course.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id])

  const [mainQueue, setMainQueue] = useState<Exercise[]>(initialExercises)
  const [reviewQueue, setReviewQueue] = useState<Exercise[]>([])
  const [phase, setPhase] = useState<Phase>('main')
  const [answeredState, setAnsweredState] = useState<null | boolean>(null)
  const [resolvedCount, setResolvedCount] = useState(0)
  const [mistakeIds, setMistakeIds] = useState<Set<string>>(new Set())
  const [attempt, setAttempt] = useState(0)
  const [done, setDone] = useState(false)

  if (!course || !lesson) {
    return (
      <div className="p-8 text-center">
        <p>Lesson not found.</p>
      </div>
    )
  }

  const total = initialExercises.length
  const current = phase === 'review' ? reviewQueue[0] : mainQueue[0]

  function handleAnswered(correct: boolean) {
    setAnsweredState(correct)
    if (correct) {
      setResolvedCount((c) => c + 1)
    } else {
      loseHeart()
      setMistakeIds((s) => new Set([...s, current.id]))
    }
  }

  function next() {
    const wasCorrect = answeredState
    setAnsweredState(null)
    setAttempt((a) => a + 1)

    if (phase === 'review') {
      const [justAnswered, ...rest] = reviewQueue
      const nextQueue = wasCorrect ? rest : [...rest, justAnswered]
      setReviewQueue(nextQueue)
      if (nextQueue.length === 0) finish()
      return
    }

    // phase === 'main'
    const [justAnswered, ...restMain] = mainQueue
    const newReviewQueue = wasCorrect ? reviewQueue : [...reviewQueue, justAnswered]
    setMainQueue(restMain)
    setReviewQueue(newReviewQueue)

    if (restMain.length > 0) return

    if (newReviewQueue.length > 0) {
      setPhase('reviewIntro')
    } else {
      finish()
    }
  }

  function startReview() {
    setPhase('review')
  }

  function finish() {
    const accuracy = total === 0 ? 1 : (total - mistakeIds.size) / total
    const xpEarned = 10 + (total - mistakeIds.size)
    completeLesson(lesson!.id, accuracy, xpEarned)
    setDone(true)
  }

  if (done) {
    const accuracy = total === 0 ? 1 : (total - mistakeIds.size) / total
    return (
      <LessonComplete
        course={course}
        accuracy={accuracy}
        xpEarned={10 + (total - mistakeIds.size)}
        correctCount={total - mistakeIds.size}
        wrongCount={mistakeIds.size}
        onContinue={() => navigate(`/learn/${course.id}`)}
      />
    )
  }

  if (phase === 'reviewIntro') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-4 text-center">
        <div className="animate-float text-6xl">🔁</div>
        <h1 className="text-2xl font-extrabold text-slate-800">Let's review what you missed</h1>
        <p className="max-w-sm text-slate-500">
          You'll get another shot at the {reviewQueue.length} question{reviewQueue.length === 1 ? '' : 's'} you
          missed before finishing the lesson.
        </p>
        <button
          onClick={startReview}
          className="rounded-2xl px-8 py-3 font-extrabold text-white btn-3d"
          style={{ backgroundColor: course.colorHex }}
        >
          Continue
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopBar course={course} showBack />
      <div className="mx-auto w-full max-w-2xl px-4 pt-4">
        <ExerciseProgress current={resolvedCount} total={total} />
        {phase === 'review' && (
          <p className="mt-2 text-center text-sm font-bold text-amber-600">🔁 Reviewing mistakes</p>
        )}
      </div>

      {heartsNow <= 0 && (
        <div className="mx-auto mt-3 w-full max-w-2xl px-4">
          <div className="rounded-xl bg-amber-50 px-4 py-2 text-center text-sm font-semibold text-amber-700">
            You're out of hearts — hearts refill over time, but keep practicing anytime. 💪
          </div>
        </div>
      )}

      <main className="flex flex-1 flex-col justify-center px-4 py-8">
        {current.kind === 'build' ? (
          <BuildQuestion key={attempt} exercise={current} speechLang={course.speechLang} onAnswered={handleAnswered} />
        ) : current.kind === 'match' ? (
          <MatchQuestion key={attempt} exercise={current} speechLang={course.speechLang} onAnswered={handleAnswered} />
        ) : (
          <McqQuestion key={attempt} exercise={current} speechLang={course.speechLang} onAnswered={handleAnswered} />
        )}
      </main>

      {answeredState !== null && (
        <div
          className={[
            'sticky bottom-0 flex items-center justify-between border-t-2 px-4 py-4 sm:px-8',
            answeredState ? 'border-green-200 bg-green-50' : 'border-rose-200 bg-rose-50',
          ].join(' ')}
        >
          <div className="flex items-center gap-2 font-extrabold">
            <span className="text-2xl">{answeredState ? '✅' : '❌'}</span>
            <span className={answeredState ? 'text-green-700' : 'text-rose-600'}>
              {answeredState ? 'Nice!' : "Not quite — you'll see this again"}
            </span>
          </div>
          <button
            onClick={next}
            className={[
              'rounded-2xl px-8 py-3 font-extrabold text-white btn-3d',
              answeredState ? 'bg-brand' : 'bg-rose-500',
            ].join(' ')}
            style={{ '--btn-shadow': answeredState ? '#46a302' : '#c2410c' } as CSSProperties}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  )
}
