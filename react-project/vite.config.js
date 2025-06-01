import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
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
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Только ядро React (точные совпадения)
            if (
              /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)
            ) {
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
})