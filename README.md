# ChairTalk

A Duolingo-style learning app for dental professionals who want to talk to
patients in **Mandarin** and **Vietnamese** — front-desk greetings, describing
pain and symptoms, explaining procedures, aftercare instructions, payment and
scheduling, and handling emergencies.

## Features

- Two full courses (Mandarin & Vietnamese), each with 7 units / 20 lessons of
  real clinical dental-office phrases (hanzi + pinyin for Mandarin).
- Five interactive exercise types generated from the phrase bank: listening,
  multiple choice (recognition & production), sentence building, and
  match-the-pairs.
- Native browser text-to-speech for every phrase (Web Speech API).
- Interactive two-person conversation scenes at the end of key units, where
  you pick what you'd say next.
- Duolingo-style gamification: XP, streaks, hearts, lesson stars, and a
  skill-tree path with lock/unlock progression — all persisted locally.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. No backend or account required — progress
is saved in the browser's local storage.

## Tech stack

React + TypeScript + Vite, Tailwind CSS v4, React Router, Zustand
(persisted state).

## Project structure

- `src/data` — course/curriculum types and content (Mandarin & Vietnamese).
- `src/lib/exerciseGenerator.ts` — turns a lesson's phrase list into a full
  exercise sequence with plausible distractors.
- `src/lib/speech.ts` — text-to-speech / speech-recognition helpers.
- `src/store/useProgress.ts` — XP, streak, hearts, and lesson-completion
  state.
- `src/pages` — Home, skill-tree (Learn), Lesson player, Dialogue, Profile.
- `src/components/exercises` — the five exercise UI components.
