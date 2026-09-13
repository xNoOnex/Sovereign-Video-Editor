import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // This explicitly tells the compiler to use relative paths 
  // so it works in the Capacitor Android wrapper AND the GitHub Pages subfolder
  base: './', 
})
