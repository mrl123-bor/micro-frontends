<script setup lang="ts">
type DocSection = {
  title: string
  summary: string
  points: string[]
  refs: string[]
  code: string
}

const docSections: DocSection[] = [
  {
    title: '1) 整体搭建与分层',
    summary: '先理解项目骨架，再进入业务模块，避免“会改页面但不懂系统边界”。',
    points: [
      '壳层：`layouts` 负责框架结构（侧栏、头部、内容区）。',
      '业务层：`views` 放页面，`components` 放可复用视图组件。',
      '基础设施层：`router` / `stores` / `api` / `utils`。',
    ],
    refs: ['src/layouts/AdminLayout.vue', 'src/router/index.ts', 'src/stores/auth.ts'],
    code: [
      "const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes: [...] })",
      '',
      'export async function prepareRouterBeforeMount() {',
      '  // 启动前同步登录态与动态路由，避免刷新丢页',
      '}',
    ].join('\n'),
  },
  {
    title: '2) 菜单、内容区、TagsView',
    summary: '菜单决定“看见什么”，路由守卫决定“能不能进”；两者不要混为一谈。',
    points: [
      '菜单来源支持静态路由 + 后端动态菜单。',
      '内容区是 `router-view`，跟随路由变化挂载页面。',
      'TagsView 根据访问记录维护标签栏与关闭策略。',
    ],
    refs: ['src/router/routes.ts', 'src/layouts/AdminSidebarMenu.vue', 'src/layouts/TagsView.vue'],
    code: [
      'const base = permissionStore.source === "api"',
      '  ? [...coreLayoutChildren, ...(dynamicLoaded.value ? layoutAddons.value : [])]',
      '  : layoutChildren',
      '',
      'watch(() => route.fullPath, addCurrentTag)',
    ].join('\n'),
  },
  {
    title: '3) 路由前后端处理链路',
    summary: '把路由链路串起来，排障速度会快很多（尤其是“为什么进不去”）。',
    points: [
      '前端守卫顺序：public -> token -> 动态路由加载 -> 权限校验。',
      '后端菜单通过 `getRouters` 下发后转换并 `addRoute`。',
      '最终访问判断统一在 `canAccessRoute`。',
    ],
    refs: ['src/router/index.ts', 'src/stores/dynamic-routes.ts'],
    code: [
      'if (to.meta.public) return true',
      'if (!auth.token) return { name: ROUTE_NAMES.login, query: { redirect: to.fullPath } }',
      "if (perm.source === 'api') await useDynamicRoutesStore().loadFromApi(router)",
      'if (!perm.canAccessRoute(to)) return { name: "Forbidden" }',
    ].join('\n'),
  },
  {
    title: '4) 状态机、拦截器、Token 无感刷新',
    summary: '这是后台体验与安全的核心：过期时尽量无感，失败时统一收口。',
    points: [
      '状态机视角：guest -> authenticated -> refreshing -> expired。',
      '401 并发请求通过 refresh 队列串行化，避免雪崩。',
      'refresh 失败后清理会话并跳转登录。',
    ],
    refs: ['src/stores/auth.ts', 'src/utils/request.ts', 'src/router/navigation-bridge.ts'],
    code: [
      'if (refreshing) {',
      '  return new Promise((resolve) => {',
      '    queue.push((token) => {',
      '      original.headers.Authorization = `Bearer ${token}`',
      '      resolve(service(original))',
      '    })',
      '  })',
      '}',
      'useAuthStore().clearSession()',
      'await redirectToLoginWhenSessionExpired()',
    ].join('\n'),
  },
]

const stackMatrix = [
  { title: 'Vue', items: ['Composition API', '组件通信', '渲染控制', '组件职责边界'] },
  { title: 'Vite', items: ['HMR', 'import.meta.env', '懒加载', '分包与部署'] },
  { title: 'TypeScript', items: ['类型系统', '泛型', '类型守卫', '工程类型约束'] },
]
</script>

<template>
  <div class="guide-page">
    <section class="hero">
      <div class="badge">TECH DOC STYLE</div>
      <h1>后台前端技术文档学习页</h1>
      <p>
        按文档风格组织为
        <span class="hl">章节说明 + 要点 + 参考路径 + 代码示例</span>，
        可直接对照项目源码学习。
      </p>
    </section>

    <section class="sections">
      <article v-for="section in docSections" :key="section.title" class="section-card">
        <h2>{{ section.title }}</h2>
        <p class="summary">{{ section.summary }}</p>
        <ul class="points">
          <li v-for="point in section.points" :key="point">{{ point }}</li>
        </ul>
        <div class="refs">
          <span v-for="rf in section.refs" :key="rf" class="ref-tag">{{ rf }}</span>
        </div>
        <div class="code-wrap">
          <div class="code-bar">
            <span class="dot red" />
            <span class="dot yellow" />
            <span class="dot green" />
            <span class="code-title">Code Reference</span>
          </div>
          <pre><code>{{ section.code }}</code></pre>
        </div>
      </article>
    </section>

    <section class="matrix-grid">
      <article v-for="item in stackMatrix" :key="item.title" class="matrix-card">
        <h3>{{ item.title }} 对应知识点</h3>
        <div class="chips">
          <span v-for="it in item.items" :key="it" class="chip">{{ it }}</span>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped lang="scss">
.guide-page {
  min-height: 100vh;
  padding: 28px;
  background:
    radial-gradient(
      90% 72% at 0% 0%,
      color-mix(in srgb, var(--el-color-primary) 16%, transparent),
      transparent 64%
    ),
    var(--admin-page-bg);
}

.hero {
  max-width: 1020px;
  margin: 0 auto 14px;
  padding: 18px 20px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--admin-border-strong) 70%, transparent);
  background: color-mix(in srgb, var(--admin-surface) 90%, transparent);
}

.badge {
  display: inline-block;
  margin-bottom: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #fff;
  background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
}

.hero h1 {
  margin: 0 0 8px;
}

.hero p {
  margin: 0;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}

.hl {
  padding: 2px 8px;
  border-radius: 8px;
  color: #fff;
  background: linear-gradient(135deg, var(--el-color-danger-light-3), var(--el-color-danger));
}

.sections {
  max-width: 1020px;
  margin: 0 auto;
  display: grid;
  gap: 12px;
}

.section-card {
  border-radius: 12px;
  padding: 14px;
  border: 1px solid color-mix(in srgb, var(--admin-border) 80%, transparent);
  background: color-mix(in srgb, var(--admin-surface) 92%, transparent);
}

.section-card h2 {
  margin: 0 0 6px;
  font-size: 18px;
}

.summary {
  margin: 0 0 8px;
  color: var(--el-text-color-secondary);
}

.points {
  margin: 0;
  padding-left: 18px;
  line-height: 1.7;
}

.refs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 10px 0;
}

.ref-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  color: var(--el-color-primary);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 26%, transparent);
  background: color-mix(in srgb, var(--el-color-primary-light-9) 80%, #fff);
}

.code-wrap {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, #334155 44%, transparent);
  background: #0f172a;
}

.code-bar {
  height: 30px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: color-mix(in srgb, #1e293b 82%, #111827);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot.red {
  background: #fb7185;
}
.dot.yellow {
  background: #f59e0b;
}
.dot.green {
  background: #34d399;
}

.code-title {
  margin-left: 4px;
  color: #93c5fd;
  font-size: 12px;
}

.code-wrap pre {
  margin: 0;
  padding: 12px 14px;
  overflow-x: auto;
}

.code-wrap code {
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.7;
  color: #e2e8f0;
}

.matrix-grid {
  max-width: 1020px;
  margin: 12px auto 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.matrix-card {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--admin-border) 80%, transparent);
  background: color-mix(in srgb, var(--admin-surface) 92%, transparent);
}

.matrix-card h3 {
  margin: 0 0 8px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: color-mix(in srgb, var(--el-color-primary) 85%, #0f172a);
  background: color-mix(in srgb, var(--el-color-primary-light-9) 78%, #fff);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 24%, transparent);
}
</style>
