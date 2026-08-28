import { useState } from 'react'

const ROWS: Array<{ patient: string; you: string; them: string }> = [
  { patient: 'Elderly (grandparent age)', you: 'Con (or Cháu)', them: 'Ông (male) / Bà (female)' },
  { patient: 'Middle-aged (parent age)', you: 'Con (or Cháu)', them: 'Chú (male) / Cô (female)' },
  { patient: 'Slightly older (sibling age)', you: 'Em', them: 'Anh (male) / Chị (female)' },
  { patient: 'Your exact age (peer)', you: 'Em (polite deference)', them: 'Anh / Chị (safer to default older)' },
]

/** Quick-reference for how to address Vietnamese patients based on their age relative to you. */
export function PronounCheatSheet() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mx-auto mb-6 w-full max-w-xl">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-2xl border-2 border-vietnamese/30 bg-sky-50 px-4 py-3 text-left"
      >
        <span className="font-bold text-slate-700">🗣️ Pronoun Cheat-Sheet</span>
        <span className="text-slate-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-2 overflow-x-auto rounded-2xl border-2 border-vietnamese/30 bg-white p-4">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="text-xs font-bold uppercase text-slate-400">
                <th className="pb-2 pr-2">If the patient is…</th>
                <th className="pb-2 pr-2">You call yourself…</th>
                <th className="pb-2">You call the patient…</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.patient} className="border-t border-slate-100">
                  <td className="py-2 pr-2 font-semibold text-slate-700">{row.patient}</td>
                  <td className="py-2 pr-2 font-bold text-vietnamese-dark">{row.you}</td>
                  <td className="py-2 font-bold text-slate-800">{row.them}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-400">
            Each dialogue and roleplay scene tells you who you're talking to, so you can practice switching
            pronouns for real.
          </p>
        </div>
      )}
    </div>
  )
}
