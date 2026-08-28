import { create } from 'zustand'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../lib/firebase'

interface AuthUser {
  uid: string
  email: string | null
  name: string | null
}

interface AuthState {
  user: AuthUser | null
  ready: boolean
  error: string | null
  signUp: (email: string, password: string, name: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOutUser: () => Promise<void>
  clearError: () => void
}

export const useAuth = create<AuthState>()((set) => ({
  user: null,
  ready: !isFirebaseConfigured,
  error: null,

  signUp: async (email, password, name) => {
    if (!auth) return
    set({ error: null })
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() })
      set({ user: { uid: cred.user.uid, email: cred.user.email, name: name.trim() || null } })
    } catch (e) {
      set({ error: friendlyAuthError(e) })
      throw e
    }
  },

  signIn: async (email, password) => {
    if (!auth) return
    set({ error: null })
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (e) {
      set({ error: friendlyAuthError(e) })
      throw e
    }
  },

  signOutUser: async () => {
    if (!auth) return
    await firebaseSignOut(auth)
  },

  clearError: () => set({ error: null }),
}))

function friendlyAuthError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? ''
  if (code.includes('email-already-in-use')) return 'That email already has an account -- try logging in instead.'
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found'))
    return 'Incorrect email or password.'
  if (code.includes('weak-password')) return 'Password should be at least 6 characters.'
  if (code.includes('invalid-email')) return 'That email address looks invalid.'
  return 'Something went wrong -- please try again.'
}

if (isFirebaseConfigured && auth) {
  onAuthStateChanged(auth, (fbUser) => {
    useAuth.setState({
      user: fbUser ? { uid: fbUser.uid, email: fbUser.email, name: fbUser.displayName } : null,
      ready: true,
    })
  })
}
