import { Link } from 'react-router-dom'
import { courseList } from '../data/courses'
import { useProgress, MAX_HEARTS } from '../store/useProgress'
import { useAuth } from '../store/useAuth'
import { isFirebaseConfigured } from '../lib/firebase'
import { TopBar } from '../components/TopBar'

export function Profile() {
  const xp = useProgress((s) => s.xp)
  const streak = useProgress((s) => s.streak)
  const hearts = useProgress((s) => s.getEffectiveHearts())
  const lessonResults = useProgress((s) => s.lessonResults)
  const dailyGoalProgress = useProgress((s) => s.dailyGoalProgress())
  const user = useAuth((s) => s.user)
  const signOutUser = useAuth((s) => s.signOutUser)

  return (
    <div className="min-h-screen pb-16">
      <TopBar showBack />
      <div className="mx-auto max-w-xl px-4 py-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Your progress</h1>

        {isFirebaseConfigured && (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4">
            {user ? (
              <>
                <div>
                  <p className="text-sm font-bold text-slate-400">Logged in as</p>
                  <p className="font-bold text-slate-800">{user.name || user.email}</p>
                  <p className="text-xs text-slate-400">Progress syncs automatically across your devices.</p>
                </div>
                <button
                  onClick={() => signOutUser()}
                  className="rounded-xl border-2 border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <div>
                  <p className="font-bold text-slate-800">Not logged in</p>
                  <p className="text-xs text-slate-400">Log in to save your progress across devices.</p>
                </div>
                <Link
                  to="/login"
                  className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-3">
          <StatCard icon="🔥" value={streak} label="Day streak" />
          <StatCard icon="💎" value={xp} label="Total XP" />
          <StatCard icon="❤️" value={`${hearts}/${MAX_HEARTS}`} label="Hearts" />
        </div>

        <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-4">
          <div className="mb-2 flex justify-between text-sm font-bold text-slate-500">
            <span>Today's goal</span>
            <span>{Math.round(dailyGoalProgress * 100)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand" style={{ width: `${dailyGoalProgress * 100}%` }} />
          </div>
        </div>

        {courseList.map((course) => {
          const lessons = course.units.flatMap((u) => u.lessons)
          const done = lessons.filter((l) => !!lessonResults[l.id])
          const totalStars = done.reduce((sum, l) => sum + (lessonResults[l.id]?.stars ?? 0), 0)
          return (
            <div key={course.id} className="mt-6">
              <h2 className="flex items-center gap-2 font-extrabold text-slate-800">
                <span>{course.flag}</span> {course.englishName}
              </h2>
              <div className="mt-2 flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4">
                <span className="text-slate-500">
                  {done.length}/{lessons.length} lessons completed
                </span>
                <span className="font-bold text-gold">★ {totalStars}</span>
              </div>
            </div>
          )
        })}

        <Link
          to="/"
          className="mt-8 block rounded-2xl border-2 border-slate-200 py-3 text-center font-bold text-slate-600 hover:bg-slate-100"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center">
      <div className="text-2xl">{icon}</div>
      <div className="text-xl font-extrabold text-slate-800">{value}</div>
      <div className="text-xs font-bold uppercase text-slate-400">{label}</div>
    </div>
  )
}
