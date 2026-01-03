import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src/main')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        output: {
          format: 'cjs',
          entryFileNames: 'index.js'
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src/preload')
      }
    }
  },
  renderer: {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 5173
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src/renderer/src')
      }
    }
  }
})

