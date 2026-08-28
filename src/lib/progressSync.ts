import { doc, onSnapshot, setDoc, serverTimestamp, type Unsubscribe } from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase'
import { useAuth } from '../store/useAuth'
import { useProgress, getSyncableProgress, applyRemoteProgress, type SyncableProgress } from '../store/useProgress'

let unsubSnapshot: Unsubscribe | null = null
let unsubLocal: (() => void) | null = null
let applyingRemote = false
let pushTimer: ReturnType<typeof setTimeout> | null = null
let started = false

function pushLocalToCloud(uid: string) {
  if (!db) return
  setDoc(doc(db, 'progress', uid), { ...getSyncableProgress(), updatedAt: serverTimestamp() }, { merge: true }).catch(
    () => {},
  )
}

function attachForUser(uid: string) {
  if (!db) return
  const ref = doc(db, 'progress', uid)

  unsubSnapshot = onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        pushLocalToCloud(uid) // first login on this account: seed the cloud from whatever's local
        return
      }
      applyingRemote = true
      applyRemoteProgress(snap.data() as Partial<SyncableProgress>)
      applyingRemote = false
    },
    () => {},
  )

  unsubLocal = useProgress.subscribe(() => {
    if (applyingRemote) return
    if (pushTimer) clearTimeout(pushTimer)
    pushTimer = setTimeout(() => pushLocalToCloud(uid), 1200)
  })
}

function detach() {
  unsubSnapshot?.()
  unsubLocal?.()
  unsubSnapshot = null
  unsubLocal = null
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = null
}

/** Wires progress sync to auth state. Call once at app startup; safe to call repeatedly. */
export function startProgressSync() {
  if (started || !isFirebaseConfigured) return
  started = true

  let lastUid: string | null = useAuth.getState().user?.uid ?? null
  if (lastUid) attachForUser(lastUid)

  useAuth.subscribe((state) => {
    const uid = state.user?.uid ?? null
    if (uid === lastUid) return
    lastUid = uid
    detach()
    if (uid) attachForUser(uid)
  })
}
