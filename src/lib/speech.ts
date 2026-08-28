let voicesCache: SpeechSynthesisVoice[] = []

function loadVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  voicesCache = window.speechSynthesis.getVoices()
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices()
  window.speechSynthesis.onvoiceschanged = loadVoices
}

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && !!window.speechSynthesis
}

/**
 * Picks the most natural-sounding available voice for a language. Browsers
 * often ship both a robotic on-device voice and a much better cloud/neural
 * voice (e.g. Chrome's "Google 普通话（中国大陆）") for the same language —
 * prefer those over local ones, since they sound far less robotic.
 */
function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const prefix = lang.split('-')[0]
  const candidates = voicesCache.filter((v) => v.lang === lang || v.lang.startsWith(prefix))
  if (candidates.length === 0) return undefined

  function score(v: SpeechSynthesisVoice): number {
    let s = 0
    if (v.lang === lang) s += 10
    if (!v.localService) s += 5 // cloud/neural voices tend to sound more natural
    if (/google|natural|neural|premium|enhanced/i.test(v.name)) s += 3
    return s
  }

  return [...candidates].sort((a, b) => score(b) - score(a))[0]
}

/** Speak the given text using the browser's TTS voice for the given BCP-47 lang. */
export function speak(text: string, lang: string, rate = 0.9) {
  if (!speechSupported()) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = lang
  utter.rate = rate
  const voice = pickVoice(lang)
  if (voice) utter.voice = voice
  window.speechSynthesis.speak(utter)
}

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel()
}

// ---- Speech recognition (optional "speak it back" practice) ----

type SpeechRecognitionCtor = new () => SpeechRecognition

function getRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export function recognitionSupported(): boolean {
  return !!getRecognitionCtor()
}

export function listenOnce(
  lang: string,
  onResult: (transcript: string) => void,
  onError: (err: string) => void,
): (() => void) | undefined {
  const Ctor = getRecognitionCtor()
  if (!Ctor) {
    onError('unsupported')
    return undefined
  }
  const recognition = new Ctor()
  recognition.lang = lang
  recognition.maxAlternatives = 3
  recognition.interimResults = false

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const transcript = event.results[0]?.[0]?.transcript ?? ''
    onResult(transcript)
  }
  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    onError(event.error || 'error')
  }
  try {
    recognition.start()
  } catch {
    onError('start-failed')
  }
  return () => {
    try {
      recognition.stop()
    } catch {
      // ignore
    }
  }
}

/** Very lenient similarity check: strip punctuation/spaces/tone-agnostic and compare overlap. */
export function fuzzyMatch(a: string, b: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, '')
  const na = norm(a)
  const nb = norm(b)
  if (!na || !nb) return false
  if (na === nb) return true
  return na.includes(nb) || nb.includes(na)
}
