import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'
import { isFirebaseConfigured } from '../lib/firebase'

export function Login() {
  const navigate = useNavigate()
  const { signUp, signIn, error, clearError } = useAuth()
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  if (!isFirebaseConfigured) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <p className="text-4xl">🔧</p>
        <h1 className="mt-4 text-xl font-extrabold text-slate-800">Cloud sync isn't set up yet</h1>
        <p className="mt-2 text-slate-500">
          This app still works fully without an account — your progress saves on this device. Ask whoever
          manages the app to connect a Firebase project to turn on cross-device login.
        </p>
        <Link to="/" className="mt-6 inline-block font-bold text-brand underline">
          Back to home
        </Link>
      </div>
    )
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      if (mode === 'signUp') await signUp(email, password, name)
      else await signIn(email, password)
      navigate('/profile')
    } catch {
      // error already set on the store
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-center text-2xl font-extrabold text-slate-800">
        {mode === 'signUp' ? 'Create your account' : 'Log in'}
      </h1>
      <p className="mt-2 text-center text-sm text-slate-500">
        Log in with the same account on any device to keep your XP, streak, and lesson progress in sync.
      </p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        {mode === 'signUp' && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="rounded-xl border-2 border-slate-200 px-4 py-3 focus:border-brand focus:outline-none"
          />
        )}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded-xl border-2 border-slate-200 px-4 py-3 focus:border-brand focus:outline-none"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="rounded-xl border-2 border-slate-200 px-4 py-3 focus:border-brand focus:outline-none"
        />

        {error && <p className="text-center text-sm font-semibold text-rose-500">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 rounded-2xl bg-brand py-3 font-extrabold text-white disabled:opacity-50"
        >
          {busy ? 'One sec…' : mode === 'signUp' ? 'Create account' : 'Log in'}
        </button>
      </form>

      <button
        onClick={() => {
          clearError()
          setMode(mode === 'signUp' ? 'signIn' : 'signUp')
        }}
        className="mt-4 w-full text-center text-sm font-bold text-slate-500 hover:text-slate-700"
      >
        {mode === 'signUp' ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
      </button>

      <Link to="/" className="mt-6 block text-center text-sm text-slate-400 hover:text-slate-600">
        Continue without an account
      </Link>
    </div>
  )
}
