import { useMemo, useState, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCourse, coursePhrasePool } from '../data/courses'
import type { LanguageId } from '../data/types'
import { generateExercises } from '../lib/exerciseGenerator'
import { useProgress } from '../store/useProgress'
import { TopBar } from '../components/TopBar'
import { ExerciseProgress } from '../components/ExerciseProgress'
import { McqQuestion } from '../components/exercises/McqQuestion'
import { BuildQuestion } from '../components/exercises/BuildQuestion'
import { MatchQuestion } from '../components/exercises/MatchQuestion'
import { LessonComplete } from '../components/LessonComplete'

export function Lesson() {
  const { lang, lessonId } = useParams<{ lang: LanguageId; lessonId: string }>()
  const navigate = useNavigate()
  const course = lang ? getCourse(lang) : undefined
  const lesson = course?.units.flatMap((u) => u.lessons).find((l) => l.id === lessonId)

  const loseHeart = useProgress((s) => s.loseHeart)
  const heartsNow = useProgress((s) => s.getEffectiveHearts())
  const completeLesson = useProgress((s) => s.completeLesson)

  const exercises = useMemo(() => {
    if (!course || !lesson) return []
    return generateExercises(lesson, coursePhrasePool(course), course.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id])

  const [index, setIndex] = useState(0)
  const [answeredState, setAnsweredState] = useState<null | boolean>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [done, setDone] = useState(false)

  if (!course || !lesson) {
    return (
      <div className="p-8 text-center">
        <p>Lesson not found.</p>
      </div>
    )
  }

  const current = exercises[index]

  function handleAnswered(correct: boolean) {
    setAnsweredState(correct)
    if (correct) {
      setCorrectCount((c) => c + 1)
    } else {
      setWrongCount((c) => c + 1)
      loseHeart()
    }
  }

  function next() {
    if (index + 1 >= exercises.length) {
      const total = correctCount + wrongCount
      const accuracy = total === 0 ? 1 : correctCount / total
      const xpEarned = 10 + correctCount
      completeLesson(lesson!.id, accuracy, xpEarned)
      setDone(true)
      return
    }
    setIndex((i) => i + 1)
    setAnsweredState(null)
  }

  if (done) {
    const total = correctCount + wrongCount
    const accuracy = total === 0 ? 1 : correctCount / total
    return (
      <LessonComplete
        course={course}
        accuracy={accuracy}
        xpEarned={10 + correctCount}
        correctCount={correctCount}
        wrongCount={wrongCount}
        onContinue={() => navigate(`/learn/${course.id}`)}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopBar course={course} showBack />
      <div className="mx-auto w-full max-w-2xl px-4 pt-4">
        <ExerciseProgress current={index} total={exercises.length} />
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
          <BuildQuestion exercise={current} speechLang={course.speechLang} onAnswered={handleAnswered} />
        ) : current.kind === 'match' ? (
          <MatchQuestion exercise={current} speechLang={course.speechLang} onAnswered={handleAnswered} />
        ) : (
          <McqQuestion exercise={current} speechLang={course.speechLang} onAnswered={handleAnswered} />
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
              {answeredState ? 'Nice!' : 'Not quite'}
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
