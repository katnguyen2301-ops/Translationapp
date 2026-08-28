/**
 * Firebase project config. This app ships with cloud sync OFF by default
 * (all values below are placeholders) so it keeps working exactly as before
 * -- fully local, no login required -- until a real Firebase project is
 * wired in here.
 *
 * To turn on "log in and sync progress across devices":
 * 1. Go to https://console.firebase.google.com and create a free project.
 * 2. Build > Authentication > Get started > enable the "Email/Password" sign-in method.
 * 3. Build > Firestore Database > Create database (start in production mode).
 *    Then in the Rules tab, paste:
 *      rules_version = '2';
 *      service cloud.firestore {
 *        match /databases/{database}/documents {
 *          match /progress/{uid} {
 *            allow read, write: if request.auth != null && request.auth.uid == uid;
 *          }
 *        }
 *      }
 * 4. Project settings (gear icon) > General > "Your apps" > add a Web app.
 *    Copy the firebaseConfig object it gives you and paste its values below.
 * 5. Rebuild and redeploy -- the "Log in" option appears automatically once
 *    apiKey below is filled in.
 */
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
