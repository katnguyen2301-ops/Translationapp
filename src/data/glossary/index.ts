import type { Glossary, LanguageId } from '../types'
import { mandarinGlossary } from './mandarin'
import { vietnameseGlossary } from './vietnamese'

export const glossaries: Record<LanguageId, Glossary> = {
  mandarin: mandarinGlossary,
  vietnamese: vietnameseGlossary,
}
