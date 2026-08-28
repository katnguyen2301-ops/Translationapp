import type { LanguageCourse, LanguageId, Phrase } from './types'
import { mandarinCourse } from './curriculum/mandarin'
import { vietnameseCourse } from './curriculum/vietnamese'

export const courses: Record<LanguageId, LanguageCourse> = {
  mandarin: mandarinCourse,
  vietnamese: vietnameseCourse,
}

export const courseList = Object.values(courses)

export function getCourse(id: LanguageId): LanguageCourse {
  return courses[id]
}

export function coursePhrasePool(course: LanguageCourse): Phrase[] {
  return course.units.flatMap((u) => u.lessons.flatMap((l) => l.phrases))
}

export function totalLessonCount(course: LanguageCourse): number {
  return course.units.reduce((sum, u) => sum + u.lessons.length, 0)
}
