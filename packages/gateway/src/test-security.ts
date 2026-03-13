import { Allowlist, SpendGuard, PermissionChecker } from './security.ts'

console.log('--- Allowlist ---')
const allowlist = new Allowlist({ allowedUsers: ['telegram:123'], allowUnknown: false })
console.log('Known user:', allowlist.isAllowed('telegram:123'))
console.log('Unknown user:', allowlist.isAllowed('telegram:999'))
allowlist.approve('telegram:999')
console.log('After approval:', allowlist.isAllowed('telegram:999'))

console.log('')
console.log('--- SpendGuard ---')
const spend = new SpendGuard({
  maxTokensPerSession: 1000,
  maxTokensPerDay: 5000,
  maxUsdPerDay: 1.00,
  costPer1kTokens: 0.003,
})
console.log('Before any usage:', spend.check('session-1'))
spend.record('session-1', 500)
console.log('After 500 tokens:', spend.check('session-1'))
spend.record('session-1', 600)
console.log('After 1100 tokens (over limit):', spend.check('session-1'))

console.log('')
console.log('--- Permissions ---')
const perms = new PermissionChecker({ granted: ['filesystem', 'network'] })
console.log('filesystem:', perms.can('filesystem'))
console.log('shell (not granted):', perms.can('shell'))
perms.grant('shell')
console.log('shell after grant:', perms.can('shell'))
