import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig(({ command, mode }) => {
  const envVars = loadEnv(mode, process.cwd(), '')
  const sfTarget = envVars.VITE_SF_INSTANCE_URL || 'https://login.salesforce.com'

  return {
    plugins: [react()],
    base: command === 'build' ? '/headless-360-demo/' : '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/sf-api': {
          target: sfTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/sf-api/, ''),
        },
        '/agent-api-prod': {
          target: 'https://api.salesforce.com',
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/agent-api-prod/, ''),
        },
        '/agent-api-test': {
          target: 'https://test.api.salesforce.com',
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/agent-api-test/, ''),
        },
        '/agent-api-dev': {
          target: 'https://dev.api.salesforce.com',
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/agent-api-dev/, ''),
        },
      },
    },
  }
})
