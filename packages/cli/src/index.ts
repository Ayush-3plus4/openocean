import { runOnboard } from './onboard.ts'

const command = process.argv[2]

if (command === 'onboard') {
  runOnboard().catch(console.error)
} else {
  console.log('')
  console.log('OpenOcean CLI')
  console.log('')
  console.log('Commands:')
  console.log('  onboard   Set up OpenOcean for the first time')
  console.log('')
  console.log('Example:')
  console.log('  node --experimental-strip-types src/index.ts onboard')
  console.log('')
}
