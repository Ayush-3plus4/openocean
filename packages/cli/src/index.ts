#!/usr/bin/env node
import { runOnboard } from './onboard.ts'

const command = process.argv[2]

if (!command || command === 'help') {
  console.log('')
  console.log('OpenOcean — Your personal AI assistant')
  console.log('')
  console.log('Commands:')
  console.log('  openocean onboard   Set up OpenOcean for the first time')
  console.log('  openocean help      Show this message')
  console.log('')
  console.log('Docs: https://github.com/Ayush-3plus4/openocean')
  console.log('')
} else if (command === 'onboard') {
  runOnboard().catch(console.error)
} else {
  console.log('')
  console.log('Unknown command: ' + command)
  console.log('Run "openocean help" to see available commands.')
  console.log('')
}