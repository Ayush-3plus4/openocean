import { createGateway } from './gateway.js'

const gateway = createGateway({
  port: 18790,
  host: '127.0.0.1', // OpenOcean ALWAYS binds locally — never 0.0.0.0
})

gateway.start()
