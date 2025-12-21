import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      // 코드 스플리팅 최적화
      rollupOptions: {
        output: {
          manualChunks: {
            // React 관련 라이브러리 분리
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // Supabase 분리 (무거움)
            'supabase': ['@supabase/supabase-js'],
            // UI 라이브러리 분리
            'ui-vendor': ['lucide-react', 'react-helmet-async'],
          }
        }
      },
      // 청크 크기 경고 한도 증가
      chunkSizeWarningLimit: 500,
      // CSS 코드 스플리팅 활성화
      cssCodeSplit: true,
      // 소스맵 비활성화 (프로덕션)
      sourcemap: false,
      // 미니파이 최적화
      minify: 'esbuild',
      target: 'esnext',
    }
  };
});
