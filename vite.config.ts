import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Repo: WillieAnthony/ASISTENCIA-2026B → URL /ASISTENCIA-2026B/
export default defineConfig({
  plugins: [react()],
  base: '/ASISTENCIA-2026B/',
})
