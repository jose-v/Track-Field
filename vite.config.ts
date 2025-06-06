import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode in the current directory
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    root: '.',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      },
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || 'https://vdfqhhfirorqdjldmyzc.supabase.co'),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZnFoaGZpcm9ycWRqbGRteXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzM1MjksImV4cCI6MjA2MjMwOTUyOX0.g3ZUC7KtCnN5B8G1qyjiatS9Achy8utlwansrlDyfjM'),
    },
    esbuild: {
      // Skip type checking for build
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
    },
    optimizeDeps: {
      esbuildOptions: {
        tsconfig: './tsconfig.app.json'
      }
    },
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        overlay: false
      },
      fs: {
        strict: false,
        allow: ['.']
      },
      // Add historyApiFallback for SPA routing
      historyApiFallback: true,
      proxy: {
        '/api': {
          target: env.VITE_SUPABASE_URL + '/rest/v1',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, ''),
        },
      },
    },
    // Ensure proper SPA fallback for build/preview
    preview: {
      port: 4173,
      historyApiFallback: true,
    },
    build: {
      // Enable SPA fallback for builds
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  }
})
