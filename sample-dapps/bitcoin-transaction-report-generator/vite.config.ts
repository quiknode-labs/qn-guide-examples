import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createBlockbookHandler } from './api/blockbook'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'QUICKNODE_')
  const blockbook = createBlockbookHandler(env.QUICKNODE_ENDPOINT_URL, env.QUICKNODE_ENDPOINT_TOKEN)

  return {
    plugins: [
      react(),
      {
        name: 'blockbook-api',
        configureServer(server) {
          server.middlewares.use('/api/blockbook', blockbook)
        },
        configurePreviewServer(server) {
          server.middlewares.use('/api/blockbook', blockbook)
        },
      },
    ],
  }
})
