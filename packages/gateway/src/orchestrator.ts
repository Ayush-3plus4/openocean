// ============================================
// OpenOcean Orchestrator
// Now with full spend tracking per session
// ============================================

import { Allowlist, SpendGuard, PermissionChecker } from './security.ts'
import { Agent } from '../../agent/src/agent.ts'
import { SpendTracker } from '../../storage/src/spend.ts'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export interface OrchestratorConfig {
  allowedUsers: string[]
  maxTokensPerSession: number
  maxTokensPerDay: number
  maxUsdPerDay: number
  model: string
  apiKey: string
  systemPrompt?: string
}

export interface IncomingMessage {
  userId: string
  sessionId: string
  text: string
  channel: string
}

export interface OutgoingMessage {
  sessionId: string
  text: string
  tokensUsed?: number
  costUsd?: number
  blocked?: boolean
  blockReason?: string
}

export class Orchestrator {
  private allowlist: Allowlist
  private spendGuard: SpendGuard
  private permissions: PermissionChecker
  private agents: Map<string, Agent> = new Map()
  private spendTracker: SpendTracker
  private config: OrchestratorConfig

  constructor(config: OrchestratorConfig) {
    this.config = config

    this.allowlist = new Allowlist({
      allowedUsers: config.allowedUsers,
      allowUnknown: false,
    })

    this.spendGuard = new SpendGuard({
      maxTokensPerSession: config.maxTokensPerSession,
      maxTokensPerDay: config.maxTokensPerDay,
      maxUsdPerDay: config.maxUsdPerDay,
      costPer1kTokens: 0.003,
    })

    this.permissions = new PermissionChecker({
      granted: ['filesystem', 'network'],
    })

    this.spendTracker = new SpendTracker({
      dataDir: resolve(__dirname, '../../../.openocean'),
    })

    console.log('[Orchestrator] Ready')
    console.log('[Orchestrator] Allowed users: ' + config.allowedUsers.length)
    console.log('[Orchestrator] Model: ' + config.model)
  }

  async handle(msg: IncomingMessage): Promise<OutgoingMessage> {
    console.log('[Orchestrator] Message from ' + msg.userId + ' via ' + msg.channel)

    if (!this.allowlist.isAllowed(msg.userId)) {
      return {
        sessionId: msg.sessionId,
        text: 'You are not authorized. Contact the owner to get access.',
        blocked: true,
        blockReason: 'not_in_allowlist',
      }
    }

    const spendCheck = this.spendGuard.check(msg.sessionId)
    if (!spendCheck.allowed) {
      return {
        sessionId: msg.sessionId,
        text: 'Spend limit reached: ' + spendCheck.reason,
        blocked: true,
        blockReason: 'spend_limit',
      }
    }

    const agent = this.getOrCreateAgent(msg.sessionId)

    try {
      const response = await agent.chat(msg.text)

      this.spendGuard.record(msg.sessionId, response.tokensUsed)

      // Record in spend tracker
      this.spendTracker.record({
        sessionId: msg.sessionId,
        channel: msg.channel,
        userId: msg.userId,
        model: response.model,
        provider: response.provider,
        inputTokens: Math.floor(response.tokensUsed * 0.6),
        outputTokens: Math.floor(response.tokensUsed * 0.4),
        totalTokens: response.tokensUsed,
        costUsd: response.costUsd,
      })

      return {
        sessionId: msg.sessionId,
        text: response.content,
        tokensUsed: response.tokensUsed,
        costUsd: response.costUsd,
      }
    } catch (err) {
      const error = err as Error
      return {
        sessionId: msg.sessionId,
        text: 'Something went wrong: ' + error.message,
        blocked: true,
        blockReason: 'agent_error',
      }
    }
  }

  approveUser(userId: string): void {
    this.allowlist.approve(userId)
  }

  spendSummary() {
    return this.spendGuard.summary()
  }

  // Full detailed spend report
  spendReport(): string {
    const summary = this.spendTracker.todaySummary()
    return this.spendTracker.formatSummary(summary)
  }

  // Last 7 days
  weeklyReport(): string {
    const days = this.spendTracker.lastNDays(7)
    let text = 'Weekly spend report\n'
    text += '================================\n'
    for (const day of days) {
      if (day.totalMessages === 0) continue
      text += day.date + ': ' + day.totalMessages + ' messages, ' +
        day.totalTokens + ' tokens, $' + day.totalCostUsd.toFixed(6) + '\n'
    }
    return text
  }

  switchModel(sessionId: string, modelKey: string): void {
    const agent = this.agents.get(sessionId)
    if (agent) agent.switchModel(modelKey)
  }

  resetSession(sessionId: string): void {
    const agent = this.agents.get(sessionId)
    if (agent) agent.reset()
  }

  private getOrCreateAgent(sessionId: string): Agent {
    if (!this.agents.has(sessionId)) {
      this.agents.set(sessionId, new Agent({
        model: this.config.model,
        apiKey: this.config.apiKey,
        systemPrompt: this.config.systemPrompt,
      }))
    }
    return this.agents.get(sessionId)!
  }
}