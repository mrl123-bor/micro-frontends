import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv, type UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import postcssPresetEnv from 'postcss-preset-env'
import qiankun from 'vite-plugin-qiankun'
// @ts-expect-error — 复用主应用 PostCSS 插件
import postcssColorMixFallback from '../../admin/postcss-color-mix-fallback.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const adminRoot = path.resolve(__dirname, '../../admin')
const microSrc = path.resolve(__dirname, 'src')

function normalizePublicPath(v: string | undefined): string {
  if (v == null || v === '' || v === '/') return '/'
  const withSlash = v.startsWith('/') ? v : `/${v}`
  return withSlash.endsWith('/') ? withSlash : `${withSlash}/`
}

export default defineConfig(({ mode }): UserConfig => {
  const env = loadEnv(mode, __dirname, '')
  const isProduction = mode === 'production'

  return {
    base: normalizePublicPath(env.VITE_PUBLIC_PATH),
    plugins: [vue(), qiankun('content-micro', { useDevMode: !isProduction })],
    server: {
      host: true,
      port: 5175,
      strictPort: true,
      origin: 'http://127.0.0.1:5175',
      cors: true,
      headers: { 'Access-Control-Allow-Origin': '*' },
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3000/api',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
        },
      },
    },
    preview: {
      host: true,
      port: 4175,
    },
    resolve: {
      dedupe: ['vue', 'vue-router', 'vue-i18n'],
      alias: {
        '@micro': microSrc,
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
    css: {
      postcss: {
        plugins: [
          postcssColorMixFallback(),
          postcssPresetEnv({ stage: 2 }),
          {
            postcssPlugin: 'internal:charset-removal',
            AtRule: {
              charset(atRule: { name: string; remove: () => void }) {
                if (atRule.name === 'charset') atRule.remove()
              },
            },
          },
        ],
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'static',
    },
  }
})
