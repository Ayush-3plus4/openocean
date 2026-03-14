import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname } from 'path'

export interface SpendEntry {
  id: string
  timestamp: string
  sessionId: string
  channel: string
  userId: string
  model: string
  provider: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costUsd: number
}

export interface DailySummary {
  date: string
  totalTokens: number
  totalCostUsd: number
  totalMessages: number
  byChannel: Record<string, { tokens: number; costUsd: number; messages: number }>
  byModel: Record<string, { tokens: number; costUsd: number; messages: number }>
  topSessions: { sessionId: string; tokens: number; costUsd: number }[]
}

export interface SpendTrackerConfig {
  dataDir: string
}

export class SpendTracker {
  private entries: SpendEntry[] = []
  private dataFile: string

  constructor(config: SpendTrackerConfig) {
    this.dataFile = config.dataDir + '/spend.json'
    this.load()
    console.log('[SpendTracker] Ready - ' + this.entries.length + ' historical entries loaded')
  }

  record(entry: Omit<SpendEntry, 'id' | 'timestamp'>): void {
    const full: SpendEntry = {
      ...entry,
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
    }
    this.entries.push(full)
    this.save()
    console.log(
      '[SpendTracker] ' + entry.channel + ' | ' +
      entry.model + ' | ' +
      entry.totalTokens + ' tokens | $' +
      entry.costUsd.toFixed(6)
    )
  }

  todaySummary(): DailySummary {
    return this.summaryForDate(this.todayString())
  }

  summaryForDate(date: string): DailySummary {
    const dayEntries = this.entries.filter(e => e.timestamp.startsWith(date))
    const byChannel: DailySummary['byChannel'] = {}
    const byModel: DailySummary['byModel'] = {}
    const bySessions: Record<string, { tokens: number; costUsd: number }> = {}
    let totalTokens = 0
    let totalCostUsd = 0

    for (const e of dayEntries) {
      totalTokens += e.totalTokens
      totalCostUsd += e.costUsd

      if (!byChannel[e.channel]) byChannel[e.channel] = { tokens: 0, costUsd: 0, messages: 0 }
      byChannel[e.channel].tokens += e.totalTokens
      byChannel[e.channel].costUsd += e.costUsd
      byChannel[e.channel].messages += 1

      if (!byModel[e.model]) byModel[e.model] = { tokens: 0, costUsd: 0, messages: 0 }
      byModel[e.model].tokens += e.totalTokens
      byModel[e.model].costUsd += e.costUsd
      byModel[e.model].messages += 1

      if (!bySessions[e.sessionId]) bySessions[e.sessionId] = { tokens: 0, costUsd: 0 }
      bySessions[e.sessionId].tokens += e.totalTokens
      bySessions[e.sessionId].costUsd += e.costUsd
    }

    const topSessions = Object.entries(bySessions)
      .map(([sessionId, data]) => ({ sessionId, ...data }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 5)

    return { date, totalTokens, totalCostUsd, totalMessages: dayEntries.length, byChannel, byModel, topSessions }
  }

  lastNDays(n: number): DailySummary[] {
    const summaries: DailySummary[] = []
    for (let i = 0; i < n; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      summaries.push(this.summaryForDate(date.toISOString().slice(0, 10)))
    }
    return summaries
  }

  formatSummary(summary: DailySummary): string {
    let text = 'Spend report for ' + summary.date + '\n'
    text += '================================\n'
    text += 'Total tokens:   ' + summary.totalTokens + '\n'
    text += 'Total cost:     $' + summary.totalCostUsd.toFixed(6) + '\n'
    text += 'Total messages: ' + summary.totalMessages + '\n'

    if (Object.keys(summary.byChannel).length > 0) {
      text += '\nBy channel:\n'
      for (const [channel, data] of Object.entries(summary.byChannel)) {
        text += '  ' + channel + ': ' + data.messages + ' msgs, ' +
          data.tokens + ' tokens, $' + data.costUsd.toFixed(6) + '\n'
      }
    }

    if (Object.keys(summary.byModel).length > 0) {
      text += '\nBy model:\n'
      for (const [model, data] of Object.entries(summary.byModel)) {
        text += '  ' + model + ': ' + data.messages + ' msgs, ' +
          data.tokens + ' tokens, $' + data.costUsd.toFixed(6) + '\n'
      }
    }

    if (summary.topSessions.length > 0) {
      text += '\nTop sessions:\n'
      for (const s of summary.topSessions) {
        text += '  ' + s.sessionId.slice(0, 16) + '... ' +
          s.tokens + ' tokens, $' + s.costUsd.toFixed(6) + '\n'
      }
    }

    return text
  }

  private load(): void {
    try {
      if (existsSync(this.dataFile)) {
        const raw = readFileSync(this.dataFile, 'utf-8')
        this.entries = JSON.parse(raw)
      }
    } catch {
      this.entries = []
    }
  }

  private save(): void {
    try {
      mkdirSync(dirname(this.dataFile), { recursive: true })
      writeFileSync(this.dataFile, JSON.stringify(this.entries, null, 2))
    } catch (err) {
      console.error('[SpendTracker] Failed to save:', err)
    }
  }

  private todayString(): string {
    return new Date().toISOString().slice(0, 10)
  }
}