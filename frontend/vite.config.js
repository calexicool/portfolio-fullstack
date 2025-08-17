import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // если это Project Pages (обычный репозиторий):
  base: '/',          // <-- имя репозитория
  plugins: [react()],
})

