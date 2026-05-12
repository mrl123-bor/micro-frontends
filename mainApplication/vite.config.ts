import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv, type UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'
import viteCompression from 'vite-plugin-compression'
import postcssPresetEnv from 'postcss-preset-env'
// @ts-expect-error — 本地 PostCSS 插件，无单独类型包
import postcssColorMixFallback from './postcss-color-mix-fallback.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** 子路径部署时设为 `/admin/` 等形式；根路径部署留空或 `/` */
function normalizePublicPath(v: string | undefined): string {
  if (v == null || v === '' || v === '/') return '/'
  const withSlash = v.startsWith('/') ? v : `/${v}`
  return withSlash.endsWith('/') ? withSlash : `${withSlash}/`
}

// https://vite.dev/config/
export default defineConfig(({ mode }): UserConfig => {
  const isStaging = mode === 'staging'
  const isProduction = mode === 'production'
  const env = loadEnv(mode, __dirname, '')

  const plugins: UserConfig['plugins'] = [
    vue(),
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    }),
  ]

  if (isProduction) {
    plugins.splice(1, 0, legacy({
      targets: ['chrome >= 87', 'firefox >= 78', 'safari >= 14', 'edge >= 87'],
      modernTargets: ['chrome >= 87', 'firefox >= 78', 'safari >= 14', 'edge >= 87'],
      polyfills: true,
      renderLegacyChunks: false,
    }))
  }

  return {
    /** 与 nest-admin 一致：可通过 VITE_PUBLIC_PATH 配置子路径 */
    base: normalizePublicPath(env.VITE_PUBLIC_PATH),
    plugins,
    server: {
      host: true,
      port: 5173,
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
      port: 4173,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '~': __dirname,
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
    css: {
      postcss: {
        plugins: [
          /** 含 var() 的 color-mix 无法被 preset-env 解析：先插入 rgba 降级声明 */
          postcssColorMixFallback(),
          /** 纯静态 color-mix 等按 browserslist 转换 */
          postcssPresetEnv({
            stage: 2,
          }),
          {
            postcssPlugin: 'internal:charset-removal',
            AtRule: {
              charset(atRule) {
                if (atRule.name === 'charset') atRule.remove()
              },
            },
          },
        ],
      },
      devSourcemap: true,
    },
    build: {
      target: isProduction ? undefined : 'esnext',
      outDir: 'dist',
      assetsDir: 'static',
      sourcemap: isStaging,
      minify: 'terser',
      reportCompressedSize: false,
      chunkSizeWarningLimit: 5000,
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
      rollupOptions: {
        output: {
          chunkFileNames: 'static/js/[name]-[hash].js',
          entryFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: 'static/[ext]/[name]-[hash][extname]',
        },
      },
      /** Rolldown 原生代码分割配置（Vite 8 推荐方式） */
      rolldownOptions: {
        output: {
          /** 确保跨 chunk 的模块按导入顺序执行，防止 element-plus 等引用 Vue 时出现 "is not a function" */
          strictExecutionOrder: true,
          codeSplitting: {
            maxSize: 1000000,
            groups: [
              /**
               * Rolldown：priority 数值越大越先匹配，并会递归收编依赖。
               * Vue 必须高于 monaco，否则 vue 会随 @guolao/vue-monaco-editor 被打进 monaco chunk，
               * element-plus 等会从 monaco 引用 Vue，易出现运行时报错（如 xxx is not a function）。
               */
              { name: 'vue-core',      test: /node_modules[\\/](@vue[\\/]|vue[\\/])/, priority: 100 },
              { name: 'vue-i18n',      test: /vue-i18n/,                 priority: 45 },
              { name: 'vue-router',    test: /vue-router/,               priority: 45 },
              { name: 'pinia',         test: /pinia/,                    priority: 45 },
              { name: 'monaco',        test: /monaco-editor|@guolao\/vue-monaco-editor/, priority: 30 },
              { name: 'ep-icons',      test: /@element-plus\/icons-vue/, priority: 75 },
              { name: 'element-plus',  test: /element-plus/,              priority: 80, maxSize: 800000 },
              { name: 'highlight',     test: /highlight\.js/,            priority: 20 },
              { name: 'vue-cropper',   test: /vue-advanced-cropper/,     priority: 20 },
              { name: 'jsbarcode',     test: /jsbarcode/,                priority: 20 },
              { name: 'qrcode',        test: /qrcode/,                   priority: 20 },
              { name: 'media-preview', test: /@lgh_\/media-preview-npm/, priority: 20 },
              { name: 'axios',         test: /axios/,                    priority: 10 },
              { name: 'vendor',        test: /node_modules/,             priority: 0 },
            ],
          },
        },
      },
    },
  }
})
