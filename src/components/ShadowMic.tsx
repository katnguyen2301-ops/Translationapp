import { useState } from 'react'
import { fuzzyMatch, listenOnce, recognitionSupported } from '../lib/speech'

type Status = 'idle' | 'listening' | 'correct' | 'retry' | 'unavailable'

/** "Now you say it" mic button for shadowing/repeat-after-me practice. Never blocks progress. */
export function ShadowMic({ text, lang }: { text: string; lang: string }) {
  const [status, setStatus] = useState<Status>('idle')

  if (!recognitionSupported()) return null

  function start() {
    setStatus('listening')
    listenOnce(
      lang,
      (transcript) => {
        setStatus(fuzzyMatch(transcript, text) ? 'correct' : 'retry')
        setTimeout(() => setStatus('idle'), 1800)
      },
      (err) => {
        setStatus(err === 'unsupported' ? 'unavailable' : 'retry')
        setTimeout(() => setStatus('idle'), 1800)
      },
    )
  }

  if (status === 'unavailable') return null

  return (
    <button
      onClick={start}
      disabled={status === 'listening'}
      className={[
        'mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition',
        status === 'idle' && 'bg-white/20 hover:bg-white/30',
        status === 'listening' && 'animate-pulse bg-white/30',
        status === 'correct' && 'bg-green-400 text-green-900',
        status === 'retry' && 'bg-amber-300 text-amber-900',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {status === 'idle' && '🎤 Say it out loud'}
      {status === 'listening' && '🎙️ Listening…'}
      {status === 'correct' && '✅ Nice pronunciation!'}
      {status === 'retry' && '🔁 Close — try again next time'}
    </button>
  )
}
