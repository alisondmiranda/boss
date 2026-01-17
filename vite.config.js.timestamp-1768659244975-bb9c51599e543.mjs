// vite.config.js
import { defineConfig } from "file:///C:/Users/Alison/Documents/Boss/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Alison/Documents/Boss/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///C:/Users/Alison/Documents/Boss/node_modules/vite-plugin-pwa/dist/index.js";
import viteCompression from "file:///C:/Users/Alison/Documents/Boss/node_modules/vite-plugin-compression/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    viteCompression({ algorithm: "gzip" }),
    viteCompression({ algorithm: "brotliCompress", ext: ".br" }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "Boss Intelligent Assistant",
        short_name: "Boss",
        description: "Seu assistente pessoal inteligente para organizar a vida",
        theme_color: "#000000",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ],
  server: {
    port: 3e3
  },
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      },
      mangle: true
    },
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-ui": ["framer-motion"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-utils": ["date-fns", "zustand"]
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxBbGlzb25cXFxcRG9jdW1lbnRzXFxcXEJvc3NcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEFsaXNvblxcXFxEb2N1bWVudHNcXFxcQm9zc1xcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvQWxpc29uL0RvY3VtZW50cy9Cb3NzL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSc7XG5pbXBvcnQgdml0ZUNvbXByZXNzaW9uIGZyb20gJ3ZpdGUtcGx1Z2luLWNvbXByZXNzaW9uJztcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICAgIHBsdWdpbnM6IFtcbiAgICAgICAgcmVhY3QoKSxcbiAgICAgICAgdml0ZUNvbXByZXNzaW9uKHsgYWxnb3JpdGhtOiAnZ3ppcCcgfSksXG4gICAgICAgIHZpdGVDb21wcmVzc2lvbih7IGFsZ29yaXRobTogJ2Jyb3RsaUNvbXByZXNzJywgZXh0OiAnLmJyJyB9KSxcbiAgICAgICAgVml0ZVBXQSh7XG4gICAgICAgICAgICByZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJyxcbiAgICAgICAgICAgIGluY2x1ZGVBc3NldHM6IFsnZmF2aWNvbi5pY28nLCAnYXBwbGUtdG91Y2gtaWNvbi5wbmcnLCAnbWFzay1pY29uLnN2ZyddLFxuICAgICAgICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnQm9zcyBJbnRlbGxpZ2VudCBBc3Npc3RhbnQnLFxuICAgICAgICAgICAgICAgIHNob3J0X25hbWU6ICdCb3NzJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NldSBhc3Npc3RlbnRlIHBlc3NvYWwgaW50ZWxpZ2VudGUgcGFyYSBvcmdhbml6YXIgYSB2aWRhJyxcbiAgICAgICAgICAgICAgICB0aGVtZV9jb2xvcjogJyMwMDAwMDAnLFxuICAgICAgICAgICAgICAgIGljb25zOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogJ3B3YS0xOTJ4MTkyLnBuZycsXG4gICAgICAgICAgICAgICAgICAgICAgICBzaXplczogJzE5MngxOTInLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZydcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3JjOiAncHdhLTUxMng1MTIucG5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIF0sXG4gICAgc2VydmVyOiB7XG4gICAgICAgIHBvcnQ6IDMwMDAsXG4gICAgfSxcbiAgICBidWlsZDoge1xuICAgICAgICBtaW5pZnk6ICd0ZXJzZXInLFxuICAgICAgICB0ZXJzZXJPcHRpb25zOiB7XG4gICAgICAgICAgICBjb21wcmVzczoge1xuICAgICAgICAgICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkcm9wX2RlYnVnZ2VyOiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWFuZ2xlOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgICAgIG91dHB1dDoge1xuICAgICAgICAgICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgICAgICAgICAgICAndmVuZG9yLXJlYWN0JzogWydyZWFjdCcsICdyZWFjdC1kb20nXSxcbiAgICAgICAgICAgICAgICAgICAgJ3ZlbmRvci11aSc6IFsnZnJhbWVyLW1vdGlvbiddLFxuICAgICAgICAgICAgICAgICAgICAndmVuZG9yLXN1cGFiYXNlJzogWydAc3VwYWJhc2Uvc3VwYWJhc2UtanMnXSxcbiAgICAgICAgICAgICAgICAgICAgJ3ZlbmRvci11dGlscyc6IFsnZGF0ZS1mbnMnLCAnenVzdGFuZCddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXNSLFNBQVMsb0JBQW9CO0FBQ25ULE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFDeEIsT0FBTyxxQkFBcUI7QUFFNUIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDeEIsU0FBUztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sZ0JBQWdCLEVBQUUsV0FBVyxPQUFPLENBQUM7QUFBQSxJQUNyQyxnQkFBZ0IsRUFBRSxXQUFXLGtCQUFrQixLQUFLLE1BQU0sQ0FBQztBQUFBLElBQzNELFFBQVE7QUFBQSxNQUNKLGNBQWM7QUFBQSxNQUNkLGVBQWUsQ0FBQyxlQUFlLHdCQUF3QixlQUFlO0FBQUEsTUFDdEUsVUFBVTtBQUFBLFFBQ04sTUFBTTtBQUFBLFFBQ04sWUFBWTtBQUFBLFFBQ1osYUFBYTtBQUFBLFFBQ2IsYUFBYTtBQUFBLFFBQ2IsT0FBTztBQUFBLFVBQ0g7QUFBQSxZQUNJLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxVQUNWO0FBQUEsVUFDQTtBQUFBLFlBQ0ksS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFVBQ1Y7QUFBQSxRQUNKO0FBQUEsTUFDSjtBQUFBLElBQ0osQ0FBQztBQUFBLEVBQ0w7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNKLE1BQU07QUFBQSxFQUNWO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDSCxRQUFRO0FBQUEsSUFDUixlQUFlO0FBQUEsTUFDWCxVQUFVO0FBQUEsUUFDTixjQUFjO0FBQUEsUUFDZCxlQUFlO0FBQUEsTUFDbkI7QUFBQSxNQUNBLFFBQVE7QUFBQSxJQUNaO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFDWCxRQUFRO0FBQUEsUUFDSixjQUFjO0FBQUEsVUFDVixnQkFBZ0IsQ0FBQyxTQUFTLFdBQVc7QUFBQSxVQUNyQyxhQUFhLENBQUMsZUFBZTtBQUFBLFVBQzdCLG1CQUFtQixDQUFDLHVCQUF1QjtBQUFBLFVBQzNDLGdCQUFnQixDQUFDLFlBQVksU0FBUztBQUFBLFFBQzFDO0FBQUEsTUFDSjtBQUFBLElBQ0o7QUFBQSxFQUNKO0FBQ0osQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
