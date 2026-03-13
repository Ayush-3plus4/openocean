import { createGateway } from './gateway.ts'

const gateway = createGateway({
  port: 18790,
  host: '127.0.0.1',
})

gateway.start()
