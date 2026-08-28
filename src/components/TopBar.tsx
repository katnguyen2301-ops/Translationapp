import { Link, useNavigate } from 'react-router-dom'
import { useProgress, MAX_HEARTS } from '../store/useProgress'
import type { LanguageCourse } from '../data/types'

export function TopBar({ course, showBack }: { course?: LanguageCourse; showBack?: boolean }) {
  const navigate = useNavigate()
  const xp = useProgress((s) => s.xp)
  const streak = useProgress((s) => s.streak)
  const hearts = useProgress((s) => s.getEffectiveHearts())

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        ) : (
          <Link to="/" className="flex items-center gap-2 font-extrabold text-slate-800">
            <span className="text-2xl">🦷</span>
            <span className="hidden sm:inline">ChairTalk</span>
          </Link>
        )}
        {course && (
          <span
            className="rounded-full px-3 py-1 text-sm font-bold text-white"
            style={{ backgroundColor: course.colorHex }}
          >
            {course.flag} {course.englishName}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4 text-sm font-bold">
        <span className="flex items-center gap-1 text-orange-500" title="Day streak">
          🔥 {streak}
        </span>
        <span className="flex items-center gap-1 text-sky-500" title="Total XP">
          💎 {xp}
        </span>
        <span className="flex items-center gap-1 text-rose-500" title="Hearts">
          ❤️ {hearts}/{MAX_HEARTS}
        </span>
      </div>
    </header>
  )
}
