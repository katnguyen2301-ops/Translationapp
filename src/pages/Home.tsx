import { Link, useNavigate } from 'react-router-dom'
import { courseList, totalLessonCount } from '../data/courses'
import { useProgress } from '../store/useProgress'

export function Home() {
  const navigate = useNavigate()
  const setActiveLanguage = useProgress((s) => s.setActiveLanguage)
  const lessonResults = useProgress((s) => s.lessonResults)
  const streak = useProgress((s) => s.streak)
  const xp = useProgress((s) => s.xp)

  function pick(id: (typeof courseList)[number]['id']) {
    setActiveLanguage(id)
    navigate(`/learn/${id}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 text-xl font-extrabold text-slate-800">
          <span className="text-3xl">🦷</span> ChairTalk
        </div>
        <Link to="/profile" className="text-sm font-bold text-slate-500 hover:text-slate-700">
          Profile →
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-16 pt-6 text-center">
        <h1 className="text-3xl font-extrabold text-slate-800 sm:text-4xl">
          Talk to your patients with confidence
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-500">
          Bite-sized, interactive lessons built specifically for the dental chair — greetings, procedures,
          aftercare, payment, and real conversations in Mandarin and Vietnamese.
        </p>

        {(streak > 0 || xp > 0) && (
          <div className="mx-auto mt-6 flex w-fit gap-6 rounded-2xl border border-slate-100 bg-white px-6 py-3 shadow-sm">
            <span className="font-bold text-orange-500">🔥 {streak} day streak</span>
            <span className="font-bold text-sky-500">💎 {xp} XP</span>
          </div>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {courseList.map((course) => {
            const done = course.units
              .flatMap((u) => u.lessons)
              .filter((l) => !!lessonResults[l.id]).length
            const total = totalLessonCount(course)
            return (
              <button
                key={course.id}
                onClick={() => pick(course.id)}
                className="group flex flex-col items-center gap-3 rounded-3xl border-2 border-slate-100 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="text-6xl">{course.flag}</span>
                <span className="text-2xl font-extrabold text-slate-800">{course.englishName}</span>
                <span className="text-slate-400">{course.name} for the dental office</span>
                <span
                  className="mt-2 w-full rounded-xl py-2 font-bold text-white transition group-hover:opacity-90"
                  style={{ backgroundColor: course.colorHex }}
                >
                  {done > 0 ? `Continue · ${done}/${total} lessons` : 'Start learning'}
                </span>
              </button>
            )
          })}
        </div>

        <section className="mt-16 grid gap-6 text-left sm:grid-cols-3">
          <Feature icon="🗣️" title="Real clinical phrases" text="Greetings, pain assessment, procedures, aftercare, payment — the exact things you say all day." />
          <Feature icon="🎧" title="Listen & speak" text="Native audio for every phrase, plus interactive conversations that feel like a real patient visit." />
          <Feature icon="🔥" title="Duolingo-style practice" text="XP, streaks, hearts, and a skill tree keep you coming back until it's second nature." />
        </section>
      </main>
    </div>
  )
}

function Feature({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="text-2xl">{icon}</div>
      <h3 className="mt-2 font-extrabold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  )
}
