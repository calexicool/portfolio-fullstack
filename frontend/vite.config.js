// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BASE = process.env.BUILD_TARGET === 'pages'
  ? '/portfolio-fullstack/'   // имя репозитория для GH Pages
  : '/';                      // Render/локально

export default defineConfig({
  base: BASE,
  plugins: [react()],
})
