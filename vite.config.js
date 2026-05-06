import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react-dom') || id.includes('react-router-dom') || (id.includes('node_modules/react/') )) {
            return 'vendor-react'
          }
          if (id.includes('@tanstack/react-query')) return 'vendor-query'
          if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('react-hot-toast')) return 'vendor-ui'
          if (id.includes('xlsx') || id.includes('axios')) return 'vendor-utils'
        },
      },
    },
    // Avertit si un chunk dépasse 500kb
    chunkSizeWarningLimit: 500,
  },
})
