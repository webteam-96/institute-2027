import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5200,
    strictPort: true,
    // The registration backend (registration-api) runs on 5400 in development: its API, and the
    // admin pages it serves, come through here so the site and admin share one address and sign-in.
    proxy: Object.fromEntries(['/api', '/registration-personal-link', '/website-app'].map((p) => [p, 'http://localhost:5400'])),
  },
})
