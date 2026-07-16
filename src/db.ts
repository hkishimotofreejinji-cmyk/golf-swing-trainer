import Dexie, { type Table } from 'dexie'
import type { SwingSession, RoundScore, KnowledgeEntry } from './types'

class GolfDB extends Dexie {
  swingSessions!: Table<SwingSession, number>
  roundScores!: Table<RoundScore, number>
  knowledgeEntries!: Table<KnowledgeEntry, number>

  constructor() {
    super('golf-swing-trainer')
    this.version(1).stores({
      swingSessions: '++id, date, overallScore',
      roundScores: '++id, date, score, source',
    })
    this.version(2).stores({
      swingSessions: '++id, date, overallScore',
      roundScores: '++id, date, score, source',
      knowledgeEntries: '++id, createdAt, *tags',
    })
  }
}

export const db = new GolfDB()

export const SETTINGS_KEYS = {
  youtubeApiKey: 'golf-trainer:youtube-api-key',
  geminiApiKey: 'golf-trainer:gemini-api-key',
} as const

export function getYoutubeApiKey(): string {
  return localStorage.getItem(SETTINGS_KEYS.youtubeApiKey) ?? ''
}

export function setYoutubeApiKey(key: string) {
  localStorage.setItem(SETTINGS_KEYS.youtubeApiKey, key)
}

export function getGeminiApiKey(): string {
  return localStorage.getItem(SETTINGS_KEYS.geminiApiKey) ?? ''
}

export function setGeminiApiKey(key: string) {
  localStorage.setItem(SETTINGS_KEYS.geminiApiKey, key)
}
