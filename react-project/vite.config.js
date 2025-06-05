import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer';
import { loadEnv } from 'vite';
import * as process from "node:process";
// https://vitejs.dev/config/
export default defineConfig(({mode})=> {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [react(),
      visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true,
        filename: "stats.html"
      })
  ],
    server: {
      allowedHosts: [ 'rubilnik.ddns.net', 'localhost'],
      // using proxy to pass cookies from debug server port ("npm run dev / host")
      proxy:{
        '/api': {
          target: 'http://'+env.VITE_AUTH_SERVICE_CENTRAL_SERVER_URL_BASE,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/,''),
        }
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // 1. React DOM отдельно
              if (/[\\/]node_modules[\\/]react-dom[\\/]/.test(id)) {
                return 'vendor-react-dom';
              }

              // if (/[\\/]node_modules[\\/]@xyflow[\\/]/.test(id)) {
              //   return 'vendor-xyflow';
              // }

              // 2. Только ядро React без React DOM
              if (/[\\/]node_modules[\\/](react|scheduler)[\\/]/.test(id)) {
                return 'vendor-react-core';
              }

              // Выносим d3 в отдельный чанк
              if (/[\\/]node_modules[\\/](d3-|d3$)/.test(id)) {
                return 'vendor-d3';
              }

              // React Router
              if (/[\\/]node_modules[\\/](react-router|@remix-run)[\\/]/.test(id)) {
                return 'vendor-router';
              }

              // Lodash (все пакеты lodash)
              if (/[\\/]node_modules[\\/]lodash[\.\\/-]/.test(id)) {
                return 'vendor-lodash';
              }

              // Все остальные React-библиотеки
              if (
                /[\\/]node_modules[\\/]react-/.test(id) ||
                id.includes('reactjs') ||
                id.includes('react/')
              ) {
                return 'vendor-react-other';
              }

              return 'vendor-other';
            }

            if (id.includes('src/')) {
              if (id.includes('Play')) return 'play-chunk';
              if (id.includes('ReactFlowComponent')) return 'reactflow-chunk';
            }

          }
        }
      }
    }
  }
})