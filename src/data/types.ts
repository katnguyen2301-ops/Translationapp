export type LanguageId = 'mandarin' | 'vietnamese'

export interface Phrase {
  id: string
  /** English gloss / prompt shown to the learner */
  en: string
  /** Target-language text (hanzi, or Vietnamese with diacritics) */
  target: string
  /** Pronunciation aid: pinyin for Mandarin. Vietnamese omits this (script is already phonetic). */
  translit?: string
  /** Word-level chunks used for the sentence-builder exercise. Falls back to auto-split. */
  chunks?: string[]
  /** Optional short usage/cultural note */
  note?: string
  /** Who says this in a clinical context, for flavor in dialogue-style rendering */
  speaker?: 'you' | 'patient'
}

export interface DialogueLine {
  speaker: 'you' | 'patient'
  en: string
  target: string
  translit?: string
}

export interface Dialogue {
  id: string
  title: string
  scenario: string
  lines: DialogueLine[]
}

export interface Lesson {
  id: string
  title: string
  icon: string
  phrases: Phrase[]
}

export interface Unit {
  id: string
  title: string
  description: string
  icon: string
  lessons: Lesson[]
  dialogue?: Dialogue
  /** Free-speaking roleplay for this unit: listen to a pretend patient, speak your own lines. */
  roleplay?: Dialogue
}

export interface LanguageCourse {
  id: LanguageId
  name: string
  englishName: string
  /** BCP-47 tag for speechSynthesis / speechRecognition */
  speechLang: string
  flag: string
  colorClass: string
  colorHex: string
  units: Unit[]
}

/** Word-level gloss for the phrase breakdown shown after repeated mistakes. */
export interface GlossEntry {
  /** Pronunciation aid (pinyin for Mandarin). Omitted for Vietnamese -- script is already phonetic. */
  translit?: string
  en: string
}

export type Glossary = Record<string, GlossEntry>

// ---- Exercises ----

export type ExerciseKind =
  | 'mcqTarget' // shown English, pick correct target phrase
  | 'mcqEnglish' // shown target phrase, pick correct English meaning
  | 'listening' // hear audio, pick correct English meaning
  | 'build' // tap word chips to build the target phrase from an English prompt
  | 'match' // match pairs of English <-> target across several phrases

export interface McqExercise {
  kind: 'mcqTarget' | 'mcqEnglish' | 'listening'
  id: string
  phrase: Phrase
  options: Phrase[]
  correctIndex: number
}

export interface BuildExercise {
  kind: 'build'
  id: string
  phrase: Phrase
  chips: string[]
  correctOrder: string[]
}

export interface MatchExercise {
  kind: 'match'
  id: string
  phrases: Phrase[]
}

export type Exercise = McqExercise | BuildExercise | MatchExercise
