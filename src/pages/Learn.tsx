import type { CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getCourse } from '../data/courses'
import type { LanguageId } from '../data/types'
import { useProgress } from '../store/useProgress'
import { TopBar } from '../components/TopBar'

export function Learn() {
  const { lang } = useParams<{ lang: LanguageId }>()
  const navigate = useNavigate()
  const course = lang ? getCourse(lang) : undefined
  const lessonResults = useProgress((s) => s.lessonResults)
  const dialogueCompleted = useProgress((s) => s.dialogueCompleted)
  const setActiveLanguage = useProgress((s) => s.setActiveLanguage)

  if (!course) {
    return (
      <div className="p-8 text-center">
        <p>Course not found.</p>
        <Link to="/" className="text-brand underline">
          Go home
        </Link>
      </div>
    )
  }

  const allLessons = course.units.flatMap((u) => u.lessons)
  const allLessonsDone = allLessons.every((l) => !!lessonResults[l.id])
  const roleplayDone = !!dialogueCompleted[course.roleplay.id]
  let previousDone = true // first lesson always unlocked

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopBar course={course} />
      <div className="mx-auto max-w-xl px-4">
        {course.units.map((unit) => {
          const unitLessonsDone = unit.lessons.every((l) => !!lessonResults[l.id])
          return (
            <section key={unit.id} className="mt-8">
              <div
                className="rounded-2xl px-5 py-4 text-white shadow-md"
                style={{ backgroundColor: course.colorHex }}
              >
                <p className="text-xs font-bold uppercase tracking-wide opacity-80">Unit</p>
                <h2 className="text-xl font-extrabold">
                  {unit.icon} {unit.title}
                </h2>
                <p className="text-sm opacity-90">{unit.description}</p>
              </div>

              <div className="mt-6 flex flex-col items-center gap-6">
                {unit.lessons.map((lesson, i) => {
                  const result = lessonResults[lesson.id]
                  const unlocked = previousDone
                  previousDone = !!result
                  const offset = i % 2 === 0 ? '-translate-x-10' : 'translate-x-10'
                  return (
                    <button
                      key={lesson.id}
                      disabled={!unlocked}
                      onClick={() => {
                        setActiveLanguage(course.id)
                        navigate(`/learn/${course.id}/lesson/${lesson.id}`)
                      }}
                      className={`relative ${offset} flex flex-col items-center gap-1`}
                    >
                      <div
                        className={[
                          'grid h-16 w-16 place-items-center rounded-full text-2xl shadow-md btn-3d',
                          unlocked ? 'text-white' : 'bg-slate-200 text-slate-400',
                        ].join(' ')}
                        style={
                          unlocked
                            ? ({
                                backgroundColor: course.colorHex,
                                '--btn-shadow': shade(course.colorHex),
                              } as CSSProperties)
                            : undefined
                        }
                      >
                        {unlocked ? lesson.icon : '🔒'}
                      </div>
                      <span className="max-w-24 text-center text-xs font-bold text-slate-500">{lesson.title}</span>
                      {result && (
                        <span className="text-sm">
                          {'★'.repeat(result.stars)}
                          <span className="text-slate-200">{'★'.repeat(3 - result.stars)}</span>
                        </span>
                      )}
                    </button>
                  )
                })}

                {unit.dialogue && (
                  <button
                    disabled={!unitLessonsDone}
                    onClick={() => navigate(`/learn/${course.id}/dialogue/${unit.dialogue!.id}`)}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className={[
                        'grid h-16 w-16 place-items-center rounded-full text-2xl shadow-md btn-3d',
                        unitLessonsDone ? 'bg-gold text-white' : 'bg-slate-200 text-slate-400',
                      ].join(' ')}
                      style={unitLessonsDone ? ({ '--btn-shadow': '#c99a00' } as CSSProperties) : undefined}
                    >
                      {unitLessonsDone ? '💬' : '🔒'}
                    </div>
                    <span className="max-w-24 text-center text-xs font-bold text-slate-500">
                      {unit.dialogue.title}
                    </span>
                    {dialogueCompleted[unit.dialogue.id] && <span className="text-sm">✅</span>}
                  </button>
                )}
              </div>
            </section>
          )
        })}
        <section className="mt-10">
          <button
            disabled={!allLessonsDone}
            onClick={() => navigate(`/learn/${course.id}/roleplay`)}
            className={[
              'flex w-full items-center gap-4 rounded-2xl p-5 text-left shadow-md btn-3d',
              allLessonsDone ? 'text-white' : 'bg-slate-200 text-slate-400',
            ].join(' ')}
            style={allLessonsDone ? ({ backgroundColor: course.colorHex, '--btn-shadow': shade(course.colorHex) } as CSSProperties) : undefined}
          >
            <span className="text-4xl">{allLessonsDone ? '🎭' : '🔒'}</span>
            <span className="flex-1">
              <span className="block text-xs font-bold uppercase tracking-wide opacity-80">Capstone roleplay</span>
              <span className="block text-lg font-extrabold">{course.roleplay.title}</span>
              <span className="block text-sm opacity-90">
                {allLessonsDone
                  ? 'Speak your own lines with a pretend patient — no multiple choice.'
                  : 'Finish every lesson to unlock this conversation.'}
              </span>
            </span>
            {roleplayDone && <span className="text-2xl">✅</span>}
          </button>
        </section>

        <p className="mt-10 text-center text-sm text-slate-400">
          {allLessons.length} lessons · Keep the path going!
        </p>
      </div>
    </div>
  )
}

function shade(hex: string): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (num >> 16) - 40)
  const g = Math.max(0, ((num >> 8) & 0xff) - 40)
  const b = Math.max(0, (num & 0xff) - 40)
  return `rgb(${r}, ${g}, ${b})`
}
