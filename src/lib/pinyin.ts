import type { LanguageId } from '../data/types'
import { glossaries } from '../data/glossary'

const PUNCTUATION = /[，。？！、,.?!]/

/** Character-by-character pinyin for a chunk of Mandarin text, via the course glossary. Empty for Vietnamese. */
export function pinyinFor(text: string, lang: LanguageId): string {
  if (lang !== 'mandarin') return ''
  const glossary = glossaries.mandarin
  return Array.from(text)
    .filter((ch) => !PUNCTUATION.test(ch) && ch.trim().length > 0)
    .map((ch) => glossary[ch]?.translit)
    .filter((t): t is string => !!t)
    .join(' ')
}
