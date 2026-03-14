import express from 'express'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { getDashboardHTML } from './dashboard.ts'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const app = express()
const PORT = 3000
const SPEND_FILE = resolve(__dirname, '../../../.openocean/spend.json')

function loadEntries() {
  try {
    if (!existsSync(SPEND_FILE)) return []
    return JSON.parse(readFileSync(SPEND_FILE, 'utf-8'))
  } catch {
    return []
  }
}

app.get('/api/spend', (_req, res) => {
  const entries = loadEntries()
  const today = new Date().toISOString().slice(0, 10)
  const todayEntries = entries.filter((e: any) => e.timestamp.startsWith(today))

  const byChannel: Record<string, { tokens: number; messages: number }> = {}
  const byModel: Record<string, { tokens: number; messages: number }> = {}
  let totalTokens = 0
  let totalCost = 0

  for (const e of todayEntries) {
    totalTokens += e.totalTokens
    totalCost += e.costUsd
    if (!byChannel[e.channel]) byChannel[e.channel] = { tokens: 0, messages: 0 }
    byChannel[e.channel].tokens += e.totalTokens
    byChannel[e.channel].messages += 1
    if (!byModel[e.model]) byModel[e.model] = { tokens: 0, messages: 0 }
    byModel[e.model].tokens += e.totalTokens
    byModel[e.model].messages += 1
  }

  res.json({
    date: today,
    totalTokens,
    totalCost,
    totalMessages: todayEntries.length,
    byChannel,
    byModel,
    recent: todayEntries.slice(-10).reverse(),
  })
})

app.get('/api/week', (_req, res) => {
  const entries = loadEntries()
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().slice(0, 10)
    const dayEntries = entries.filter((e: any) => e.timestamp.startsWith(dateStr))
    days.push({
      date: dateStr,
      tokens: dayEntries.reduce((s: number, e: any) => s + e.totalTokens, 0),
      cost: dayEntries.reduce((s: number, e: any) => s + e.costUsd, 0),
      messages: dayEntries.length,
    })
  }
  res.json(days)
})

app.get('/', (_req, res) => {
  res.send(getDashboardHTML())
})

app.listen(PORT, '127.0.0.1', () => {
  console.log('[Dashboard] Running at http://127.0.0.1:' + PORT)
})