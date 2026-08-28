import type {
  BuildExercise,
  Exercise,
  LanguageId,
  Lesson,
  MatchExercise,
  McqExercise,
  Phrase,
} from '../data/types'

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr]
  // simple deterministic-ish shuffle (mulberry32) seeded per-lesson so
  // exercise order stays stable within a session but varies between lessons
  let s = seed
  const rand = () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function sample<T>(pool: T[], n: number, exclude: T, seed: number): T[] {
  const filtered = pool.filter((p) => p !== exclude)
  return shuffle(filtered, seed).slice(0, n)
}

export function chunksFor(phrase: Phrase, lang: LanguageId): string[] {
  if (phrase.chunks && phrase.chunks.length) return phrase.chunks
  if (lang === 'vietnamese') return phrase.target.split(' ').filter(Boolean)
  // Mandarin fallback: split by character, keep punctuation as its own chip
  return Array.from(phrase.target).filter((c) => c.trim().length > 0)
}

function buildMcq(
  kind: McqExercise['kind'],
  phrase: Phrase,
  pool: Phrase[],
  seed: number,
): McqExercise {
  const distractors = sample(pool, 3, phrase, seed)
  const options = shuffle([phrase, ...distractors], seed + 17)
  return {
    kind,
    id: `${kind}-${phrase.id}-${seed}`,
    phrase,
    options,
    correctIndex: options.findIndex((o) => o.id === phrase.id),
  }
}

function buildBuild(phrase: Phrase, pool: Phrase[], lang: LanguageId, seed: number): BuildExercise {
  const correctOrder = chunksFor(phrase, lang)
  const decoyPhrases = sample(pool, 2, phrase, seed + 3)
  const decoyChips = decoyPhrases
    .flatMap((p) => chunksFor(p, lang))
    .filter((c) => !correctOrder.includes(c))
  const decoys = shuffle(decoyChips, seed + 5).slice(0, Math.max(2, Math.min(4, correctOrder.length)))
  const chips = shuffle([...correctOrder, ...decoys], seed + 7)
  return {
    kind: 'build',
    id: `build-${phrase.id}-${seed}`,
    phrase,
    chips,
    correctOrder,
  }
}

function buildMatch(phrases: Phrase[], seed: number): MatchExercise {
  return {
    kind: 'match',
    id: `match-${phrases.map((p) => p.id).join('_')}-${seed}`,
    phrases,
  }
}

/**
 * Turns a lesson's teaching phrases into a full exercise sequence, drawing
 * distractors from a wider course-level pool so options stay plausible even
 * for short lessons. Pass a fresh `seedOverride` (e.g. a random number
 * chosen once per lesson attempt) so replaying the same lesson for extra
 * practice gets a different distractor mix and order each time, instead of
 * the exact same run every time.
 */
export function generateExercises(
  lesson: Lesson,
  coursePool: Phrase[],
  lang: LanguageId,
  seedOverride?: number,
): Exercise[] {
  const pool = coursePool.length >= 6 ? coursePool : lesson.phrases
  const exercises: Exercise[] = []
  let seed = seedOverride ?? lesson.phrases.length * 1000 + lesson.id.length

  lesson.phrases.forEach((phrase, i) => {
    seed += i * 31 + 1
    // First pass: introduce via listening + recognition
    exercises.push(buildMcq('mcqEnglish', phrase, pool, seed))
    exercises.push(buildMcq('listening', phrase, pool, seed + 1))
  })

  // Match round(s): group phrases into chunks of up to 4
  for (let i = 0; i < lesson.phrases.length; i += 4) {
    const group = lesson.phrases.slice(i, i + 4)
    if (group.length >= 2) exercises.push(buildMatch(group, seed + i + 200))
  }

  lesson.phrases.forEach((phrase, i) => {
    seed += i * 13 + 3
    // Second pass: production practice
    exercises.push(buildBuild(phrase, pool, lang, seed))
    exercises.push(buildMcq('mcqTarget', phrase, pool, seed + 2))
  })

  return shuffleWithinWindow(exercises, seed)
}

/**
 * Light reshuffle that keeps things unpredictable without ever putting two
 * exercises for the exact same phrase back-to-back.
 */
function shuffleWithinWindow(exercises: Exercise[], seed: number): Exercise[] {
  const shuffled = shuffle(exercises, seed + 999)
  const result: Exercise[] = []
  const remaining = [...shuffled]
  while (remaining.length) {
    const lastPhraseId = result.length ? phraseIdOf(result[result.length - 1]) : null
    let idx = remaining.findIndex((e) => phraseIdOf(e) !== lastPhraseId)
    if (idx === -1) idx = 0
    result.push(remaining[idx])
    remaining.splice(idx, 1)
  }
  return result
}

function phraseIdOf(e: Exercise): string {
  return e.kind === 'match' ? e.phrases.map((p) => p.id).join('_') : e.phrase.id
}
