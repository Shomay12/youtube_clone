import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5172,
    allowedHosts: [
      'studio.youtube./asdfsqww/efwer1qwrwe/rrwqe/rweqcvrewwqr/eecrretetqlocal',
      'localhost'
    ],
    allowedHosts: ['studio.youtube./asdfsqww/efwer1qwrwe/rrwqe/rweqcvrewwqr/eecrretetqlocal', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
})

