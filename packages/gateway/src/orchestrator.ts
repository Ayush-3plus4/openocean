// ============================================
// OpenOcean Orchestrator
// Connects Gateway + Security + Agent together.
// This is the main flow for every message.
// ============================================

import { Allowlist, SpendGuard, PermissionChecker } from './security.ts'
import { Agent } from '../../agent/src/agent.ts'

export interface OrchestratorConfig {
  // Security
  allowedUsers: string[]
  maxTokensPerSession: number
  maxTokensPerDay: number
  maxUsdPerDay: number

  // Agent
  model: string
  apiKey: string
  systemPrompt?: string
}

export interface IncomingMessage {
  userId: string        // e.g. 'telegram:123456'
  sessionId: string
  text: string
  channel: string       // e.g. 'telegram', 'discord'
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

    console.log('[Orchestrator] Ready')
    console.log('[Orchestrator] Allowed users: ' + config.allowedUsers.length)
    console.log('[Orchestrator] Model: ' + config.model)
  }

  async handle(msg: IncomingMessage): Promise<OutgoingMessage> {
    console.log('[Orchestrator] Message from ' + msg.userId + ' via ' + msg.channel)

    // --- Step 1: Allowlist check ---
    if (!this.allowlist.isAllowed(msg.userId)) {
      console.log('[Orchestrator] Blocked unknown user: ' + msg.userId)
      return {
        sessionId: msg.sessionId,
        text: 'You are not authorized to use this assistant. Contact the owner to get access.',
        blocked: true,
        blockReason: 'not_in_allowlist',
      }
    }

    // --- Step 2: Spend guard check ---
    const spendCheck = this.spendGuard.check(msg.sessionId)
    if (!spendCheck.allowed) {
      console.log('[Orchestrator] Spend limit hit for session: ' + msg.sessionId)
      return {
        sessionId: msg.sessionId,
        text: 'Spend limit reached: ' + spendCheck.reason,
        blocked: true,
        blockReason: 'spend_limit',
      }
    }

    // --- Step 3: Get or create agent for this session ---
    const agent = this.getOrCreateAgent(msg.sessionId)

    // --- Step 4: Call the AI ---
    try {
      const response = await agent.chat(msg.text)

      // Record token usage in spend guard
      this.spendGuard.record(msg.sessionId, response.tokensUsed)

      return {
        sessionId: msg.sessionId,
        text: response.content,
        tokensUsed: response.tokensUsed,
        costUsd: response.costUsd,
      }
    } catch (err) {
      const error = err as Error
      console.log('[Orchestrator] Agent error: ' + error.message)
      return {
        sessionId: msg.sessionId,
        text: 'Something went wrong calling the AI: ' + error.message,
        blocked: true,
        blockReason: 'agent_error',
      }
    }
  }

  // Approve a new user at runtime
  approveUser(userId: string): void {
    this.allowlist.approve(userId)
  }

  // Get spend summary
  spendSummary() {
    return this.spendGuard.summary()
  }

  // Switch model for a session
  switchModel(sessionId: string, modelKey: string): void {
    const agent = this.agents.get(sessionId)
    if (agent) agent.switchModel(modelKey)
  }

  // Reset a session conversation
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
