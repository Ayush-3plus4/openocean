import { MODELS, getModel, getModelsByProvider } from './models.ts'

console.log('--- All supported models ---')
for (const [key, model] of Object.entries(MODELS)) {
  console.log(key + ' -> ' + model.label + ' (' + model.provider + ')')
}

console.log('')
console.log('--- Claude models only ---')
const claudeModels = getModelsByProvider('anthropic')
claudeModels.forEach(m => console.log(m.label))

console.log('')
console.log('--- Invalid model error ---')
try {
  getModel('fake-model-9000')
} catch (err) {
  console.log('Caught expected error:', err.message)
}
