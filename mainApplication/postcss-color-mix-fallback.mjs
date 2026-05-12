/**
 * 旧内核无法解析含 var() 的 color-mix()，整条声明会被丢弃。
 * 在声明前插入一条 sRGB 近似值（按选择器是否处于 html.dark 分支区分主色色值）。
 */

const PL = { p: '99, 102, 241', p3: '129, 140, 248', p5: '165, 180, 252', p9: '238, 242, 255' }
const PD = { p: '129, 140, 248', p3: '165, 180, 252', p5: '196, 181, 253', p9: '237, 233, 254' }

function ruleIsDark(rule) {
  let r = rule
  while (r && r.type !== 'root') {
    const s = r.selector || ''
    if (/html\.dark\b/.test(s) || /\.dark\b/.test(s)) return true
    r = r.parent
  }
  return false
}

function rgba(rgb, pct) {
  const a = Math.min(100, Math.max(0, Number(pct))) / 100
  return `rgba(${rgb}, ${a.toFixed(3)})`
}

function approxOnce(value, dark) {
  const c = dark ? PD : PL
  const tx = dark ? '226, 232, 240' : '15, 23, 42'
  const sf = dark ? '15, 23, 42' : '255, 255, 255'
  const sfm = dark ? '30, 41, 59' : '248, 250, 252'
  const br = dark ? '148, 163, 184' : '51, 65, 85'

  return value
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba(c.p, n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary-light-3\)\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba(c.p3, n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary-light-5\)\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba(c.p5, n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary-light-9\)\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba(c.p9, n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--admin-text\)\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba(tx, n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*#ffffff\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba('255, 255, 255', n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*#fff\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba('255, 255, 255', n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*#000000\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba('0, 0, 0', n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*#0f172a\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba('15, 23, 42', n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*#020617\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba('2, 6, 23', n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--admin-surface\)\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba(sf, n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--admin-surface-muted\)\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba(sfm, n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-bg-color\)\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba(sf, n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-fill-color-light\)\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba(dark ? '51, 65, 85' : '243, 244, 246', n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-fill-color-lighter\)\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba(dark ? '30, 41, 59' : '249, 250, 251', n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-fill-color-blank\)\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba(sf, n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-danger\)\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba('239, 68, 68', n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-info\)\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba('59, 130, 246', n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*#22c55e\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba('34, 197, 94', n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*#ef4444\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba('239, 68, 68', n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--gd-accent\)\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba(c.p, n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-bg-color-overlay,\s*#fff\)\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba('255, 255, 255', n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--admin-border-strong\)\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba(br, Math.min(100, Number(n) * (dark ? 0.2 : 0.14))),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--admin-border\)\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba(br, Math.min(100, Number(n) * (dark ? 0.14 : 0.09))),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--admin-border,\s*var\(--el-border-color\)\)\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba(br, Math.min(30, Number(n) * 0.12)),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*,\s*var\(--admin-border\)\s*\)/gi,
      () => (dark ? 'rgba(129, 140, 248, 0.26)' : 'rgba(99, 102, 241, 0.2)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*,\s*var\(--admin-border-strong\)\s*\)/gi,
      () => (dark ? 'rgba(129, 140, 248, 0.3)' : 'rgba(99, 102, 241, 0.24)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--admin-border-strong\)\s+(\d+)\s*%\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*\)/gi,
      () => (dark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(99, 102, 241, 0.16)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--admin-border\)\s+(\d+)\s*%\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*\)/gi,
      () => (dark ? 'rgba(129, 140, 248, 0.22)' : 'rgba(99, 102, 241, 0.18)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--admin-border\)\s+(\d+)\s*%\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*\)\s*!important/gi,
      () => (dark ? 'rgba(129, 140, 248, 0.22) !important' : 'rgba(99, 102, 241, 0.18) !important'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--admin-border-strong\)\s+(\d+)\s*%\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*\)/gi,
      () => (dark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(99, 102, 241, 0.16)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--admin-border-strong\)\s+(\d+)\s*%\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*\)\s*!important/gi,
      () => (dark ? 'rgba(148, 163, 184, 0.22) !important' : 'rgba(99, 102, 241, 0.16) !important'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--admin-border\)\s+(\d+)\s*%\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*\)\s*!important/gi,
      () => (dark ? 'rgba(129, 140, 248, 0.22) !important' : 'rgba(99, 102, 241, 0.18) !important'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary-light-3\)\s+(\d+)\s*%\s*,\s*var\(--admin-border\)\s*\)/gi,
      () => (dark ? 'rgba(165, 180, 252, 0.3)' : 'rgba(129, 140, 248, 0.24)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary-light-3\)\s+(\d+)\s*%\s*,\s*var\(--admin-border\)\s*\)\s*!important/gi,
      () => (dark ? 'rgba(165, 180, 252, 0.32) !important' : 'rgba(129, 140, 248, 0.26) !important'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*,\s*var\(--el-border-color\)\s*\)/gi,
      () => (dark ? 'rgba(129, 140, 248, 0.26)' : 'rgba(99, 102, 241, 0.22)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*,\s*var\(--el-border-color\)\s*\)\s*!important/gi,
      () => (dark ? 'rgba(129, 140, 248, 0.3) !important' : 'rgba(99, 102, 241, 0.24) !important'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*,\s*var\(--el-border-color-lighter\)\s*\)/gi,
      () => (dark ? 'rgba(129, 140, 248, 0.2)' : 'rgba(99, 102, 241, 0.16)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*,\s*var\(--el-fill-color-blank\)\s*\)/gi,
      () => (dark ? 'rgba(129, 140, 248, 0.1)' : 'rgba(99, 102, 241, 0.08)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*,\s*var\(--el-fill-color-blank\)\s*\)\s*!important/gi,
      () => (dark ? 'rgba(129, 140, 248, 0.12) !important' : 'rgba(99, 102, 241, 0.1) !important'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*,\s*var\(--el-fill-color-light\)\s*\)/gi,
      () => (dark ? 'rgba(129, 140, 248, 0.12)' : 'rgba(99, 102, 241, 0.1)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*,\s*var\(--el-color-primary-light-9\)\s*\)/gi,
      (_, n) => rgba(c.p9, n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--admin-surface\)\s+(\d+)\s*%\s*,\s*var\(--el-color-primary-light-9\)\s+(\d+)\s*%\s*\)/gi,
      () => (dark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.94)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--admin-surface,\s*var\(--el-bg-color\)\)\s+(\d+)\s*%\s*,\s*var\(--el-color-primary-light-9\)\s+(\d+)\s*%\s*\)/gi,
      () => (dark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.97)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*,\s*rgba\([^)]+\)\s*\)/gi,
      (_, n) => rgba(c.p, n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--btn-color\)\s+(\d+)\s*%\s*,\s*#818cf8\s*\)/gi,
      (_, n) => rgba(c.p3, n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--btn-color\)\s+(\d+)\s*%\s*,\s*#4f46e5\s*\)/gi,
      (_, n) => rgba('79, 70, 229', n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*,\s*#000\s*\)/gi,
      (_, n) => rgba(c.p, Math.min(100, Number(n) + 12)),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*,\s*#818cf8\s*\)/gi,
      (_, n) => rgba(c.p, Math.min(100, Number(n) + 5)),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*,\s*#4f46e5\s*\)/gi,
      (_, n) => rgba(c.p, Math.min(100, Number(n) + 8)),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*#000000\s+(\d+)\s*%\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*\)/gi,
      () => (dark ? 'rgba(0, 0, 0, 0.55)' : 'rgba(15, 23, 42, 0.12)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*,\s*#0f172a8c\s*\)/gi,
      () => (dark ? 'rgba(129, 140, 248, 0.22)' : 'rgba(99, 102, 241, 0.2)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*,\s*#000000b8\s*\)/gi,
      () => (dark ? 'rgba(129, 140, 248, 0.18)' : 'rgba(99, 102, 241, 0.16)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*,\s*var\(--el-text-color-regular\)\s*\)/gi,
      (_, n) => rgba(c.p, n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*#7c3aed\s+(\d+)\s*%\s*,\s*var\(--el-text-color-regular\)\s*\)/gi,
      (_, n) => rgba('124, 58, 237', n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*#7c3aed\s+(\d+)\s*%\s*,\s*var\(--el-border-color\)\s*\)/gi,
      (_, n) => rgba('124, 58, 237', n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*#7c3aed\s+(\d+)\s*%\s*,\s*var\(--el-fill-color-light\)\s*\)/gi,
      (_, n) => rgba('124, 58, 237', n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*#22c55e\s+(\d+)\s*%\s*,\s*var\(--admin-text\)\s*\)/gi,
      (_, n) => rgba('34, 197, 94', n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*#22c55e\s+(\d+)\s*%\s*,\s*var\(--admin-border\)\s*\)/gi,
      () => 'rgba(34, 197, 94, 0.35)',
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*#22c55e\s+(\d+)\s*%\s*,\s*#1f2937\s*\)/gi,
      () => 'rgba(34, 173, 92, 1)',
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-danger\)\s+(\d+)\s*%\s*,\s*var\(--admin-border\)\s*\)/gi,
      () => 'rgba(239, 68, 68, 0.28)',
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-danger\)\s+(\d+)\s*%\s*,\s*var\(--admin-surface-muted\)\s*\)/gi,
      () => (dark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-fill-color-light\)\s+(\d+)\s*%\s*,\s*var\(--el-fill-color-blank\)\s*\)/gi,
      (_, n) => rgba(dark ? '51, 65, 85' : '243, 244, 246', n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-fill-color-lighter\)\s+(\d+)\s*%\s*,\s*var\(--el-fill-color-blank\)\s*\)/gi,
      (_, n) => rgba(dark ? '30, 41, 59' : '249, 250, 251', n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-bg-color\)\s+(\d+)\s*%\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*\)/gi,
      () => (dark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.94)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-border-color-lighter\)\s+(\d+)\s*%\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*\)/gi,
      () => (dark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(99, 102, 241, 0.12)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*,\s*var\(--el-border-color-lighter\)\s*\)/gi,
      () => (dark ? 'rgba(129, 140, 248, 0.18)' : 'rgba(99, 102, 241, 0.14)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*,\s*var\(--el-bg-color\)\s*\)/gi,
      (_, n) => rgba(c.p, n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--admin-surface-muted\)\s+(\d+)\s*%\s*,\s*var\(--admin-surface\)\s*\)\s*100%/gi,
      () => (dark ? 'rgba(30, 41, 59, 1)' : 'rgba(248, 250, 252, 1)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--admin-surface-muted\)\s+(\d+)\s*%\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*\)/gi,
      () => (dark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(248, 250, 252, 0.95)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary-light-9\)\s+(\d+)\s*%\s*,\s*var\(--admin-surface-muted\)\s*\)/gi,
      () => (dark ? 'rgba(51, 65, 85, 0.45)' : 'rgba(238, 242, 255, 0.4)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--admin-border,\s*var\(--el-border-color\)\)\s+(\d+)\s*%\s*,\s*var\(--gd-accent\)\s+(\d+)\s*%\s*\)/gi,
      () => (dark ? 'rgba(129, 140, 248, 0.2)' : 'rgba(99, 102, 241, 0.16)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--admin-border,\s*var\(--el-border-color-lighter\)\)\s+(\d+)\s*%\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*\)/gi,
      () => (dark ? 'rgba(129, 140, 248, 0.16)' : 'rgba(99, 102, 241, 0.12)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--admin-border,\s*var\(--el-border-color-lighter\)\)\s+(\d+)\s*%\s*,\s*var\(--gd-accent\)\s+(\d+)\s*%\s*\)/gi,
      () => (dark ? 'rgba(129, 140, 248, 0.18)' : 'rgba(99, 102, 241, 0.14)'),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary\)\s+(\d+)\s*%\s*,\s*var\(--el-color-primary-light-3\)\s*\)/gi,
      (_, n) => rgba(c.p3, n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--el-color-primary-light-3\)\s+(\d+)\s*%\s*,\s*var\(--el-color-primary\)\s*\)/gi,
      (_, n) => rgba(c.p3, n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*#fff\s+(\d+)\s*%\s*,\s*var\(--el-color-primary-light-5\)\s*\)/gi,
      (_, n) => rgba('255, 255, 255', Math.min(100, Number(n) + 10)),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*#ffffff\s+(\d+)\s*%\s*,\s*var\(--el-color-primary-light-5\)\s*\)/gi,
      (_, n) => rgba('255, 255, 255', Math.min(100, Number(n) + 10)),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*#fff\s+(\d+)\s*%\s*,\s*transparent\s*\)/gi,
      (_, n) => rgba('255, 255, 255', n),
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*#fff\s+0%\s*,\s*transparent\s*\)/gi,
      () => 'rgba(255, 255, 255, 0)',
    )
    .replace(
      /color-mix\s*\(\s*in\s+srgb\s*,\s*var\(--admin-surface\)\s+(\d+)\s*%\s*,\s*var\(--admin-surface-muted\)\s+(\d+)\s*%\s*\)/gi,
      () => (dark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.94)'),
    )
}

function approximateFull(value, dark) {
  let prev = value
  for (let i = 0; i < 24; i++) {
    const next = approxOnce(prev, dark)
    if (next === prev) break
    prev = next
  }
  return prev
}

export default function postcssColorMixFallback() {
  return {
    postcssPlugin: 'postcss-color-mix-fallback',
    Declaration(decl) {
      const v = decl.value
      if (!v || !v.includes('color-mix(')) return
      const dark = ruleIsDark(decl.parent)
      const fb = approximateFull(v, dark)
      if (fb === v || fb.includes('color-mix(')) return
      decl.cloneBefore({ value: fb })
    },
  }
}

postcssColorMixFallback.postcss = true
