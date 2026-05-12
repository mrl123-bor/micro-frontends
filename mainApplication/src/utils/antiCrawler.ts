type AntiCrawlerOptions = {
  router?: {
    currentRoute: { value: { fullPath: string; path: string; query?: Record<string, unknown> } }
    replace: (to: any) => Promise<unknown>
  }
  abnormalPath?: string
  /** 禁用右键菜单 */
  disableContextMenu?: boolean
  /** 禁用复制/剪切/粘贴（只拦截快捷键与事件，输入框不拦） */
  disableCopyCutPaste?: boolean
  /** 发现自动化/无头特征时直接遮罩页面 */
  blockOnAutomation?: boolean
  /** 简单的 DevTools 打开检测（可误判，默认不开） */
  devtoolsGuard?: boolean
}

function isEditableTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null
  if (!el) return false
  const tag = (el.tagName || '').toLowerCase()
  if (tag === 'input' || tag === 'textarea') return true
  if ((el as HTMLElement).isContentEditable) return true
  return false
}

function detectAutomation(): boolean {
  try {
    const nav = navigator as any
    if (nav?.webdriver) return true
    // 常见无头 UA（不绝对）
    const ua = String(navigator.userAgent || '')
    if (/HeadlessChrome/i.test(ua) || /PhantomJS/i.test(ua) || /Playwright/i.test(ua)) return true
  } catch {
    /* ignore */
  }
  return false
}

function ensureOverlay() {
  const id = '__antiCrawlerOverlay'
  if (document.getElementById(id)) return
  const el = document.createElement('div')
  el.id = id
  el.setAttribute('role', 'alert')
  el.innerHTML = `
    <div class="ac-card">
      <div class="ac-title">Access limited</div>
      <div class="ac-sub">Abnormal environment detected.</div>
    </div>
  `
  document.body.appendChild(el)
}

function showOverlay() {
  ensureOverlay()
  document.documentElement.classList.add('ac-blocked')
}

function injectStylesOnce() {
  const id = '__antiCrawlerStyle'
  if (document.getElementById(id)) return
  const style = document.createElement('style')
  style.id = id
  style.textContent = `
  .ac-blocked body { overflow: hidden !important; }
  #__antiCrawlerOverlay{
    position: fixed; inset: 0; z-index: 99999;
    display: none;
    background:
      radial-gradient(600px 260px at 18% 12%, rgba(64,158,255,.22), transparent 60%),
      radial-gradient(680px 300px at 82% 10%, rgba(91,92,240,.18), transparent 62%),
      rgba(10,10,18,.55);
    backdrop-filter: blur(10px);
  }
  .ac-blocked #__antiCrawlerOverlay{ display:flex; align-items:center; justify-content:center; padding:24px; }
  #__antiCrawlerOverlay .ac-card{
    width: min(520px, 92vw);
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,.18);
    background: rgba(255,255,255,.10);
    box-shadow: 0 30px 80px rgba(0,0,0,.35);
    padding: 18px 18px 16px;
    color: #fff;
  }
  #__antiCrawlerOverlay .ac-title{ font-size: 16px; font-weight: 700; letter-spacing: .2px; }
  #__antiCrawlerOverlay .ac-sub{ margin-top: 8px; font-size: 13px; opacity: .85; line-height: 1.5; }
  `
  document.head.appendChild(style)
}

export function initAntiCrawler(opts: AntiCrawlerOptions = {}) {
  injectStylesOnce()

  const options: Required<AntiCrawlerOptions> = {
    router: (opts.router ?? undefined) as any,
    abnormalPath: opts.abnormalPath ?? '/abnormal',
    disableContextMenu: opts.disableContextMenu ?? true,
    disableCopyCutPaste: opts.disableCopyCutPaste ?? true,
    blockOnAutomation: opts.blockOnAutomation ?? true,
    devtoolsGuard: opts.devtoolsGuard ?? false,
  }

  const off: Array<() => void> = []

  if (options.blockOnAutomation && detectAutomation()) {
    showOverlay()
  }

  if (options.disableContextMenu) {
    const onCtx = (e: MouseEvent) => {
      if (isEditableTarget(e.target)) return
      e.preventDefault()
    }
    window.addEventListener('contextmenu', onCtx, { capture: true })
    off.push(() => window.removeEventListener('contextmenu', onCtx, { capture: true } as any))
  }

  if (options.disableCopyCutPaste) {
    const onKey = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return
      const k = String(e.key || '').toLowerCase()
      if (!e.ctrlKey && !e.metaKey) return
      if (k === 'c' || k === 'x' || k === 'v' || k === 'a' || k === 's') {
        e.preventDefault()
      }
    }
    const onCopyLike = (e: ClipboardEvent) => {
      if (isEditableTarget(e.target)) return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey, { capture: true })
    window.addEventListener('copy', onCopyLike, { capture: true })
    window.addEventListener('cut', onCopyLike, { capture: true })
    window.addEventListener('paste', onCopyLike, { capture: true })
    off.push(() => window.removeEventListener('keydown', onKey, { capture: true } as any))
    off.push(() => window.removeEventListener('copy', onCopyLike, { capture: true } as any))
    off.push(() => window.removeEventListener('cut', onCopyLike, { capture: true } as any))
    off.push(() => window.removeEventListener('paste', onCopyLike, { capture: true } as any))
  }

  // 非强依赖：简单 DevTools 检测（可误判，所以默认不开）
  if (options.devtoolsGuard) {
    const SESSION_FROM_KEY = 'ac:from'
    const SESSION_OPEN_KEY = 'ac:devtools_open'
    let open = false
    let last = 0
    let lastOpenAt = 0
    let closeStableCount = 0

    const redirectToAbnormal = async () => {
      const r = options.router
      if (!r) return
      const cur = r.currentRoute.value
      if (cur.path === options.abnormalPath) return
      try {
        sessionStorage.setItem(SESSION_FROM_KEY, cur.fullPath)
        sessionStorage.setItem(SESSION_OPEN_KEY, '1')
      } catch {
        /* ignore */
      }
      await r.replace({ path: options.abnormalPath, query: { from: cur.fullPath } })
    }

    const restoreFromAbnormal = async () => {
      const r = options.router
      if (!r) return
      const cur = r.currentRoute.value
      if (cur.path !== options.abnormalPath) return
      let from = ''
      try {
        from = sessionStorage.getItem(SESSION_FROM_KEY) || ''
      } catch {
        /* ignore */
      }
      if (from) {
        try {
          sessionStorage.removeItem(SESSION_FROM_KEY)
          sessionStorage.removeItem(SESSION_OPEN_KEY)
        } catch {
          /* ignore */
        }
        await r.replace(from)
      }
    }

    // 更可靠的探针：DevTools 打开时 `debugger` 会暂停，计时会明显变大
    // 注意：这是“反调试”行为，开启后 DevTools 打开会有轻微停顿（符合需求）
    const probeDevtoolsOpen = () => {
      try {
        const start = performance.now()
        // eslint-disable-next-line no-debugger
        debugger
        const cost = performance.now() - start
        return cost > 120
      } catch {
        return false
      }
    }

    // 直接拦截常用打开方式：F12 / Ctrl+Shift+I/J（比尺寸差更可靠）
    const onDevtoolsHotkey = (e: KeyboardEvent) => {
      const k = String(e.key || '').toLowerCase()
      const isF12 = k === 'f12'
      const isCombo =
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (k === 'i' || k === 'j' || k === 'c')
      if (!isF12 && !isCombo) return

      open = true
      lastOpenAt = Date.now()
      closeStableCount = 0
      void redirectToAbnormal()
    }
    window.addEventListener('keydown', onDevtoolsHotkey, { capture: true })
    off.push(() => window.removeEventListener('keydown', onDevtoolsHotkey, { capture: true } as any))

    const tick = () => {
      const now = Date.now()
      if (now - last < 120) return
      last = now

      // 仅以探针为准，避免尺寸差误判导致“瞬间返回”
      const curOpen = probeDevtoolsOpen()
      if (curOpen && !open) {
        open = true
        lastOpenAt = now
        closeStableCount = 0
        void redirectToAbnormal()
      } else if (!curOpen && open) {
        // 关闭检测做稳定：短时间内不允许误判关闭，且需连续多次探针为 false
        if (now - lastOpenAt < 900) return
        closeStableCount += 1
        if (closeStableCount >= 3) {
          open = false
          closeStableCount = 0
          void restoreFromAbnormal()
        }
      } else if (curOpen && open) {
        lastOpenAt = now
        closeStableCount = 0
        // 用户试图从异常页跳走时，持续拉回
        void redirectToAbnormal()
      }
    }

    // 刷新/首屏：如果上次已判定为 open，直接先跳异常页（避免“开着 F12 刷新没跳”）
    try {
      if (sessionStorage.getItem(SESSION_OPEN_KEY) === '1') {
        open = true
        lastOpenAt = Date.now()
        closeStableCount = 0
        void redirectToAbnormal()
      }
    } catch {
      /* ignore */
    }

    const timer = window.setInterval(tick, 180)
    off.push(() => window.clearInterval(timer))

    // 初始化/刷新时立刻跑一次，避免“开着 F12 刷新不跳转”
    tick()
    // resize/切回窗口时也立即检测，加速返回
    const onResize = () => tick()
    const onFocus = () => tick()
    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    off.push(() => window.removeEventListener('resize', onResize as any))
    off.push(() => window.removeEventListener('focus', onFocus as any))
    off.push(() => document.removeEventListener('visibilitychange', onFocus as any))
  }

  return {
    destroy() {
      off.forEach((fn) => fn())
    },
  }
}

