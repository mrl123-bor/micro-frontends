import { ref } from 'vue'

const STORAGE_KEY = 'admin-color-scheme'

const OVERLAY_BG = {
  dark: '#0a0e18',
  light: '#eef1f8',
} as const

export const themeAnimating = ref(false)

type ViewTransition = {
  ready: Promise<void>
  finished: Promise<void>
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function circleRadius(x: number, y: number): number {
  return Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  )
}

function animateViewTransitionReveal(x: number, y: number): void {
  const r = circleRadius(x, y)
  document.documentElement.animate(
    {
      clipPath: [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${r}px at ${x}px ${y}px)`,
      ],
    },
    {
      duration: 680,
      easing: 'cubic-bezier(0.19, 1, 0.22, 1)',
      pseudoElement: '::view-transition-new(root)',
    },
  )
}

function runFallbackCircleTransition(
  x: number,
  y: number,
  nextDark: boolean,
  apply: () => void,
): Promise<void> {
  return new Promise((resolve) => {
    const r = circleRadius(x, y)
    const el = document.createElement('div')
    el.className = 'theme-transition-overlay'
    el.setAttribute('aria-hidden', 'true')
    const bg = nextDark ? OVERLAY_BG.dark : OVERLAY_BG.light
    el.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:2147483646',
      'pointer-events:none',
      `clip-path:circle(0px at ${x}px ${y}px)`,
      `background:${bg}`,
      'will-change:clip-path',
    ].join(';')

    document.body.appendChild(el)
    void el.offsetWidth
    el.style.transition =
      'clip-path 0.68s cubic-bezier(0.19, 1, 0.22, 1)'
    requestAnimationFrame(() => {
      el.style.clipPath = `circle(${r}px at ${x}px ${y}px)`
    })

    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      apply()
      el.remove()
      resolve()
    }

    el.addEventListener('transitionend', finish, { once: true })
    window.setTimeout(finish, 950)
  })
}

function readStored(): 'dark' | 'light' | null {
  if (typeof localStorage === 'undefined') return null
  const v = localStorage.getItem(STORAGE_KEY)
  if (v === 'dark' || v === 'light') return v
  return null
}

function prefersDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function computeInitialDark(): boolean {
  const s = readStored()
  if (s === 'dark') return true
  if (s === 'light') return false
  return prefersDark()
}

export const isDark = ref(computeInitialDark())

if (typeof document !== 'undefined') {
  document.documentElement.classList.toggle('dark', isDark.value)
}

export function useTheme() {
  function setDark(value: boolean) {
    isDark.value = value
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, value ? 'dark' : 'light')
    }
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', value)
    }
  }

  async function toggleTheme(ev?: MouseEvent) {
    if (themeAnimating.value || typeof document === 'undefined') return

    const next = !isDark.value
    const x = ev?.clientX ?? window.innerWidth / 2
    const y = ev?.clientY ?? window.innerHeight / 2

    if (prefersReducedMotion()) {
      setDark(next)
      return
    }

    themeAnimating.value = true
    const app = document.getElementById('app')

    try {
      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => ViewTransition
      }

      if (typeof doc.startViewTransition === 'function') {
        const transition = doc.startViewTransition(() => {
          setDark(next)
        })
        transition.ready.then(() => {
          animateViewTransitionReveal(x, y)
        })
        await transition.finished
      } else {
        app?.classList.add('theme-flip-pulse')
        await runFallbackCircleTransition(x, y, next, () => setDark(next))
        app?.classList.remove('theme-flip-pulse')
      }
    } finally {
      themeAnimating.value = false
    }
  }

  return { isDark, setDark, toggleTheme, themeAnimating }
}
