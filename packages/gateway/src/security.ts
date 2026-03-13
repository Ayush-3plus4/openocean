// ============================================
// OpenOcean Security Layer
// Three systems: Allowlist, SpendGuard, PermissionChecker
// ============================================


// --------------------------------------------
// 1. ALLOWLIST
// Only approved users can talk to the assistant.
// Everyone else gets rejected immediately.
// --------------------------------------------

interface AllowlistConfig {
  allowedUsers: string[]   // e.g. ['telegram:123456', 'discord:987654']
  allowUnknown: boolean    // false = strict mode (recommended)
}

export class Allowlist {
  private allowed: Set<string>
  private allowUnknown: boolean

  constructor(config: AllowlistConfig) {
    this.allowed = new Set(config.allowedUsers)
    this.allowUnknown = config.allowUnknown
  }

  // Check if a user is allowed to send messages
  isAllowed(userId: string): boolean {
    if (this.allowUnknown) return true
    return this.allowed.has(userId)
  }

  // Add a new approved user at runtime
  approve(userId: string): void {
    this.allowed.add(userId)
    console.log('[Security] Approved user: ' + userId)
  }

  // Remove a user
  revoke(userId: string): void {
    this.allowed.delete(userId)
    console.log('[Security] Revoked user: ' + userId)
  }

  // List all approved users
  list(): string[] {
    return Array.from(this.allowed)
  }
}


// --------------------------------------------
// 2. SPEND GUARD
// Tracks token usage per session and per day.
// Stops the assistant when limits are hit.
// OpenClaw has nothing like this built in.
// --------------------------------------------

interface SpendConfig {
  maxTokensPerSession: number   // e.g. 50000
  maxTokensPerDay: number       // e.g. 200000
  maxUsdPerDay: number          // e.g. 2.00 (dollars)
  costPer1kTokens: number       // e.g. 0.003 for claude-sonnet
}

interface SpendRecord {
  sessionTokens: number
  dailyTokens: number
  dailyUsd: number
  lastReset: string             // ISO date string (resets daily)
}

export class SpendGuard {
  private config: SpendConfig
  private records: Map<string, SpendRecord> = new Map()
  private dailyTotal = { tokens: 0, usd: 0, date: todayString() }

  constructor(config: SpendConfig) {
    this.config = config
  }

  // Call this before every LLM request
  // Returns { allowed: true } or { allowed: false, reason: '...' }
  check(sessionId: string): { allowed: boolean; reason?: string } {
    this.maybeResetDaily()

    const record = this.getOrCreate(sessionId)

    if (record.sessionTokens >= this.config.maxTokensPerSession) {
      return {
        allowed: false,
        reason: 'Session token limit reached (' + this.config.maxTokensPerSession + ' tokens). Start a new session.',
      }
    }

    if (this.dailyTotal.tokens >= this.config.maxTokensPerDay) {
      return {
        allowed: false,
        reason: 'Daily token limit reached (' + this.config.maxTokensPerDay + ' tokens). Resets tomorrow.',
      }
    }

    if (this.dailyTotal.usd >= this.config.maxUsdPerDay) {
      return {
        allowed: false,
        reason: 'Daily spend limit reached ($' + this.config.maxUsdPerDay + '). Resets tomorrow.',
      }
    }

    return { allowed: true }
  }

  // Call this after every LLM response to record usage
  record(sessionId: string, tokensUsed: number): void {
    this.maybeResetDaily()

    const record = this.getOrCreate(sessionId)
    record.sessionTokens += tokensUsed

    this.dailyTotal.tokens += tokensUsed
    this.dailyTotal.usd += (tokensUsed / 1000) * this.config.costPer1kTokens

    console.log(
      '[SpendGuard] Session ' + sessionId.slice(0, 8) + '...' +
      ' | session=' + record.sessionTokens + ' tokens' +
      ' | daily=' + this.dailyTotal.tokens + ' tokens' +
      ' | daily=$' + this.dailyTotal.usd.toFixed(4)
    )
  }

  // Get current spend summary
  summary(): { dailyTokens: number; dailyUsd: number; date: string } {
    return {
      dailyTokens: this.dailyTotal.tokens,
      dailyUsd: this.dailyTotal.usd,
      date: this.dailyTotal.date,
    }
  }

  private getOrCreate(sessionId: string): SpendRecord {
    if (!this.records.has(sessionId)) {
      this.records.set(sessionId, {
        sessionTokens: 0,
        dailyTokens: 0,
        dailyUsd: 0,
        lastReset: todayString(),
      })
    }
    return this.records.get(sessionId)!
  }

  private maybeResetDaily(): void {
    const today = todayString()
    if (this.dailyTotal.date !== today) {
      console.log('[SpendGuard] Daily reset. Previous total: ' + this.dailyTotal.tokens + ' tokens / $' + this.dailyTotal.usd.toFixed(4))
      this.dailyTotal = { tokens: 0, usd: 0, date: today }
      this.records.clear()
    }
  }
}


// --------------------------------------------
// 3. PERMISSION CHECKER
// Every action needs explicit permission.
// Nothing runs silently — unlike OpenClaw.
// --------------------------------------------

type Permission =
  | 'shell'        // Run terminal commands
  | 'filesystem'   // Read and write files
  | 'browser'      // Control a web browser
  | 'network'      // Make HTTP requests
  | 'email'        // Send emails
  | 'calendar'     // Access calendar

interface PermissionConfig {
  granted: Permission[]    // What is allowed by default
}

export class PermissionChecker {
  private granted: Set<Permission>

  constructor(config: PermissionConfig) {
    this.granted = new Set(config.granted)
  }

  // Check if a permission is granted
  can(permission: Permission): { allowed: boolean; reason?: string } {
    if (this.granted.has(permission)) {
      return { allowed: true }
    }
    return {
      allowed: false,
      reason:
        'Permission denied: "' + permission + '" is not enabled. ' +
        'Go to settings to enable it explicitly.',
    }
  }

  // Grant a permission at runtime
  grant(permission: Permission): void {
    this.granted.add(permission)
    console.log('[Permissions] Granted: ' + permission)
  }

  // Revoke a permission
  revoke(permission: Permission): void {
    this.granted.delete(permission)
    console.log('[Permissions] Revoked: ' + permission)
  }

  // List all currently granted permissions
  list(): Permission[] {
    return Array.from(this.granted)
  }
}


// --------------------------------------------
// HELPER
// --------------------------------------------

function todayString(): string {
  return new Date().toISOString().slice(0, 10)  // e.g. '2026-03-13'
}
