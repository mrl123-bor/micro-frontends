<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { toast } from '@/utils/toast'
import { useAuthStore } from '@/stores/auth'
import { getCaptcha } from '@/api/auth'
import { MagicStick } from '@element-plus/icons-vue'
import { gsap } from 'gsap'
import LanguageSwitcher from '@/layouts/LanguageSwitcher.vue'
import LoginBackgroundEffects from '@/views/login/LoginBackgroundEffects.vue'
import LoginBrandPanel from '@/views/login/LoginBrandPanel.vue'
import LoginDecoIllustration from '@/views/login/LoginDecoIllustration.vue'
import LoginAuthForms from '@/views/login/LoginAuthForms.vue'
import { showI18nSwitcher, showLoginMobileOption } from '@/constants/features'
import { ROUTE_NAMES } from '@/constants/route-names'
import { isDemoRuntime } from '@/constants/runtimeMode'
import { useAsyncState, useToggle, useDebounceFn, useEventListener } from '@/hooks'

const primaryColor = '#6366f1'

const REMEMBER_USER_KEY = 'admin_login_remember_user'

type LoginPanel = 'account' | 'phone'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { t, locale } = useI18n()

const username = ref('')
const password = ref('')
const captchaCode = ref('')
const captchaUuid = ref('')
const captchaPlain = ref('')
const captchaImg = ref('')
const { loading, run } = useAsyncState()
const { value: showPassword, toggle: toggleShowPassword } = useToggle(false)
const debouncedRefreshCaptcha = useDebounceFn(() => {
  void refreshCaptcha()
}, 400)
const isTyping = ref(false)
const phoneFocused = ref(false)
const loginPanel = ref<LoginPanel>('account')
const phone = ref('')
const smsCode = ref('')
const rememberMe = ref(false)
const smsCooldown = ref(0)
let smsTick: ReturnType<typeof setInterval> | undefined
const tagline = ref('')
const uiErrorPulse = ref(false)
const uiSuccessPulse = ref(false)
const pageReady = ref(false)

const confettiPieces = Array.from({ length: 36 }, (_, i) => i)

const demoRuntime = computed(() => isDemoRuntime())

/** 与参考图 1–6：白圆从中心铺开 → 换左右栏 → 再收束露出新表单 */
type SwapPhase =
  | 'idle'
  | 'toPhone_cover'
  | 'toPhone_uncover'
  | 'toAccount_cover'
  | 'toAccount_uncover'

const swapPhase = ref<SwapPhase>('idle')

const formMainContentRef = ref<HTMLElement | null>(null)

function tweenPromise(target: gsap.TweenTarget, vars: gsap.TweenVars): Promise<void> {
  return new Promise((resolve) => {
    gsap.to(target, {
      ...vars,
      onComplete: resolve,
    })
  })
}

function clearSmsTick() {
  if (smsTick != null) {
    clearInterval(smsTick)
    smsTick = undefined
  }
}


function switchLoginToAccount() {
  goLoginPanel('account')
}

function switchLoginToPhone() {
  goLoginPanel('phone')
}

async function goLoginPanel(panel: LoginPanel) {
  if (panel === 'phone' && !showLoginMobileOption) return
  if (loginPanel.value === panel) return
  if (swapPhase.value !== 'idle') return
  if (!showLoginMobileOption) {
    loginPanel.value = panel
    return
  }

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const narrow = typeof window !== 'undefined' && !window.matchMedia('(min-width: 1024px)').matches

  if (reduceMotion || narrow) {
    loginPanel.value = panel
    return
  }

  const stage = document.querySelector<HTMLElement>('.form-wrapper-split--stage')
  const blob = document.querySelector<HTMLElement>('.form-stage-blob')
  const blobDisk = blob?.querySelector<HTMLElement>('.form-stage-blob__disk')
  const illWrap = document.querySelector<HTMLElement>('.form-illust-swap')
  const contentEl = formMainContentRef.value

  if (!stage || !blob || !blobDisk || !illWrap || !contentEl) {
    loginPanel.value = panel
    return
  }

  const isToPhone = panel === 'phone'
  swapPhase.value = isToPhone ? 'toPhone_cover' : 'toAccount_cover'

  gsap.set([illWrap, contentEl], { transformOrigin: '50% 58%' })
  gsap.set(blobDisk, { transformOrigin: '50% 50%' })

  try {
    await Promise.all([
      tweenPromise([illWrap, contentEl], {
        scale: 0.74,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
      }),
      tweenPromise(blobDisk, {
        scale: 0.72,
        duration: 0.3,
        ease: 'power2.in',
      }),
    ])

    await tweenPromise(blob, {
      left: isToPhone ? '6%' : '96%',
      duration: 0.48,
      ease: 'power2.inOut',
    })

    loginPanel.value = panel
    swapPhase.value = isToPhone ? 'toPhone_uncover' : 'toAccount_uncover'

    await nextTick()

    const illWrap2 = document.querySelector<HTMLElement>('.form-illust-swap')
    const contentEl2 = formMainContentRef.value
    const blobDisk2 = document.querySelector<HTMLElement>('.form-stage-blob__disk')
    if (!illWrap2 || !contentEl2 || !blobDisk2) return

    gsap.set(blobDisk2, { transformOrigin: '50% 50%' })
    gsap.set([illWrap2, contentEl2], { scale: 0.78, opacity: 0 })

    await Promise.all([
      tweenPromise(blobDisk2, {
        scale: 1.12,
        duration: 0.44,
        ease: 'back.out(1.35)',
      }),
      tweenPromise(illWrap2, {
        scale: 1,
        opacity: 1,
        duration: 0.4,
        ease: 'back.out(1.55)',
      }),
    ])

    await tweenPromise(contentEl2, {
      scale: 1,
      opacity: 1,
      duration: 0.34,
      ease: 'power2.out',
      delay: 0.02,
    })

    gsap.set(blob, { clearProps: 'left' })
    gsap.set(blobDisk2, { clearProps: 'transform' })
    gsap.set([illWrap2, contentEl2], { clearProps: 'transform,opacity' })
  } finally {
    swapPhase.value = 'idle'
  }
}

function onSendSms() {
  if (smsCooldown.value > 0) return
  const p = phone.value.trim()
  if (!/^\d{11}$/.test(p)) {
    toast.warning(t('login.phoneInvalid'))
    return
  }
  toast.info(t('login.smsSentStub'))
  smsCooldown.value = 60
  clearSmsTick()
  smsTick = setInterval(() => {
    smsCooldown.value -= 1
    if (smsCooldown.value <= 0) clearSmsTick()
  }, 1000)
}

async function onSubmitPhone() {
  if (isDemoRuntime()) {
    try {
      await run(async () => {
        auth.enterDemoShell({
          userName: phone.value,
          nickName: phone.value,
        })
        uiSuccessPulse.value = true
        const redirectPath = route.query.redirect as string | undefined
        window.setTimeout(() => {
          if (redirectPath) router.push(redirectPath)
          else router.push({ name: ROUTE_NAMES.dashboard })
        }, 950)
      })
    } catch {
      uiErrorPulse.value = true
      window.setTimeout(() => {
        uiErrorPulse.value = false
      }, 520)
    }
    return
  }
  toast.info(t('login.phoneLoginTip'))
}

const TAGLINES_ZH = [
  '山高路远，静水流深。',
  '在热爱里，认真生活。',
  '不疾不徐，终会抵达。',
  '星光不负赶路人。',
  '心有山海，静而不争。',
  '把平常的日子，过成喜欢的样子。',
  '愿你历尽千帆，归来仍是少年。',
  '风起于青萍之末，浪成于微澜之间。',
  '行到水穷处，坐看云起时。',
  '且听风吟，静待花开。',
]

const TAGLINES_EN = [
  'Small steps, steady progress.',
  'Do what you love, and love what you do.',
  'Slow is smooth; smooth is fast.',
  'The stars favor the persistent.',
  'Calm seas, clear mind.',
  'Turn ordinary days into your favorite story.',
  'May you return with the heart of a beginner.',
  'Great things start from tiny beginnings.',
  'When paths end, clouds still rise.',
  'Listen to the wind; wait for the bloom.',
]

const leftBg = computed(() => ({
  '--login-primary': primaryColor,
}))

function pickTagline() {
  const list = locale.value === 'en-US' ? TAGLINES_EN : TAGLINES_ZH
  tagline.value = list[Math.floor(Math.random() * list.length)] || ''
}

onMounted(async () => {
  if (route.query.expired === '1') {
    toast.warning(t('login.sessionExpired'))
    const q = { ...route.query }
    delete q.expired
    await router.replace({ path: route.path, query: q })
  }
  pickTagline()
  try {
    const saved = localStorage.getItem(REMEMBER_USER_KEY)
    if (saved) {
      username.value = saved
      rememberMe.value = true
    }
  } catch {
    /* ignore */
  }
  pageReady.value = true
  if (!isDemoRuntime()) {
    try {
      const c = await getCaptcha()
      captchaUuid.value = c.uuid
      captchaImg.value = c.img || ''
      if (c.code) captchaPlain.value = c.code
    } catch {
      /* ignore */
    }
  }
})

async function refreshCaptcha() {
  if (isDemoRuntime()) return
  try {
    const c = await getCaptcha()
    captchaUuid.value = c.uuid
    captchaImg.value = c.img || ''
    captchaPlain.value = c.code || ''
    captchaCode.value = ''
  } catch {
    /* ignore */
  }
}

useEventListener(window, 'online', () => {
  void refreshCaptcha()
})

watch(locale, () => pickTagline())

onUnmounted(() => {
  clearSmsTick()
})

async function onSubmit() {
  try {
    await run(async () => {
      await auth.login({
        username: username.value,
        password: password.value,
        uuid: captchaUuid.value || undefined,
        code: captchaCode.value || undefined,
      })
      try {
        if (rememberMe.value) {
          localStorage.setItem(REMEMBER_USER_KEY, username.value.trim())
        } else {
          localStorage.removeItem(REMEMBER_USER_KEY)
        }
      } catch {
        /* ignore */
      }
      uiSuccessPulse.value = true
      const redirectPath = route.query.redirect as string | undefined
      window.setTimeout(() => {
        if (redirectPath) router.push(redirectPath)
        else router.push({ name: ROUTE_NAMES.dashboard })
      }, 950)
    })
  } catch {
    uiErrorPulse.value = true
    window.setTimeout(() => {
      uiErrorPulse.value = false
    }, 520)
    await refreshCaptcha()
  }
}
</script>

<template>
  <div
    class="login-page"
    :class="{
      'is-error': uiErrorPulse,
      'is-success': uiSuccessPulse,
      'is-ready': pageReady,
    }"
  >
    <LoginBackgroundEffects />

    <div v-if="uiSuccessPulse" class="confetti-layer" aria-hidden="true">
      <span
        v-for="i in confettiPieces"
        :key="'c' + i"
        class="confetti-piece"
        :style="{ '--ci': i }"
      />
    </div>

    <LoginBrandPanel
      :brand-style="leftBg"
      :tagline="tagline"
      :is-typing="isTyping"
      :phone-focused="phoneFocused"
      :password="password"
      :show-password="showPassword"
      :ui-error-pulse="uiErrorPulse"
      :ui-success-pulse="uiSuccessPulse"
    />

    <div class="right">
      <div v-if="showI18nSwitcher" class="login-lang-bar">
        <LanguageSwitcher />
      </div>

      <div
        class="form-wrapper"
        :class="{
          'is-phone-layout': showLoginMobileOption && loginPanel === 'phone',
        }"
      >
        <div class="form-panel form-wrapper-frame">
          <div class="form-wrapper-split form-wrapper-split--stage">
            <LoginDecoIllustration />
            <div class="form-stage-blob" aria-hidden="true">
              <div class="form-stage-blob__disk" />
            </div>
            <div class="form-wrapper-main-outer">
              <div class="form-wrapper-main">
              <div v-if="uiSuccessPulse" class="success-mark" aria-hidden="true">
                <span class="check" />
                <span class="text">{{ t('login.successLine') }}</span>
              </div>

              <div ref="formMainContentRef" class="form-main-content">
                <div class="mobile-brand">
                  <div class="brand-icon mobile-brand-icon"><el-icon :size="16"><MagicStick /></el-icon></div>
                  <span>{{ t('login.brand') }}</span>
                </div>
                <LoginAuthForms
                  v-model:username="username"
                  v-model:password="password"
                  v-model:captcha-code="captchaCode"
                  v-model:remember-me="rememberMe"
                  v-model:phone="phone"
                  v-model:sms-code="smsCode"
                  :login-panel="loginPanel"
                  :demo-runtime="demoRuntime"
                  :loading="loading"
                  :captcha-uuid="captchaUuid"
                  :captcha-img="captchaImg"
                  :captcha-plain="captchaPlain"
                  :show-login-mobile-option="showLoginMobileOption"
                  :sms-cooldown="smsCooldown"
                  :primary-color="primaryColor"
                  :show-password="showPassword"
                  :on-captcha-click="debouncedRefreshCaptcha"
                  @submit="onSubmit"
                  @submit-phone="onSubmitPhone"
                  @switch-phone="switchLoginToPhone"
                  @switch-account="switchLoginToAccount"
                  @send-sms="onSendSms"
                  @toggle-password="toggleShowPassword()"
                  @account-typing="(v) => (isTyping = v)"
                  @phone-focus="(v) => (phoneFocused = v)"
                />
              </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ========================================
   缓动变量
   ======================================== */
$ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
$ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
$ease-smooth: cubic-bezier(0.22, 1, 0.36, 1);

/* ========================================
   页面主体
   ======================================== */
.login-page {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: auto;
  opacity: 0;
  transition: opacity 0.8s $ease-out-expo;

  &.is-ready {
    opacity: 1;
  }
}

.login-page > :deep(.login-brand-panel) {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.confetti-layer {
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  top: -14px;
  left: calc(var(--ci) * 2.7% + 3%);
  width: 8px;
  height: 12px;
  background: hsl(calc(var(--ci) * 36), 80%, 60%);
  border-radius: 2px;
  opacity: 0;
  animation: confetti-fall calc(2.2s + var(--ci) * 0.05s) ease-in both;
  animation-delay: calc(var(--ci) * 0.035s);
}

@keyframes confetti-fall {
  0% {
    transform: translateY(0) rotate(0deg) scale(0);
    opacity: 0;
  }
  6% {
    opacity: 1;
    transform: translateY(0) rotate(0deg) scale(1);
  }
  25% {
    opacity: 0.9;
    transform: translateY(25vh) rotate(120deg) scale(1.05) translateX(10px);
  }
  50% {
    opacity: 0.7;
    transform: translateY(55vh) rotate(310deg) scale(0.9) translateX(-8px);
  }
  75% {
    opacity: 0.35;
    transform: translateY(80vh) rotate(520deg) scale(0.7) translateX(5px);
  }
  100% {
    opacity: 0;
    transform: translateY(105vh) rotate(720deg) scale(0.3) translateX(-3px);
  }
}

.login-page.is-error {
  .form-panel {
    animation: form-shake 0.45s $ease-out-expo both;
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.55) inset,
      0 22px 60px rgba(15, 23, 42, 0.08),
      0 0 0 3px rgba(239, 68, 68, 0.32),
      0 0 40px rgba(239, 68, 68, 0.16);

    @at-root html.dark & {
      box-shadow:
        0 1px 0 rgba(255, 255, 255, 0.04) inset,
        0 22px 60px rgba(0, 0, 0, 0.35),
        0 0 0 3px rgba(239, 68, 68, 0.32),
        0 0 40px rgba(239, 68, 68, 0.16);
    }

    @supports (color: color-mix(in srgb, red, blue)) {
      box-shadow:
        0 1px 0 color-mix(in srgb, #ffffff 55%, transparent) inset,
        0 22px 60px color-mix(in srgb, var(--admin-text) 8%, transparent),
        0 0 0 3px color-mix(in srgb, #ef4444 32%, transparent),
        0 0 40px color-mix(in srgb, #ef4444 16%, transparent);
    }

    @at-root html.dark & {
      @supports (color: color-mix(in srgb, red, blue)) {
        box-shadow:
          0 1px 0 color-mix(in srgb, #ffffff 55%, transparent) inset,
          0 22px 60px color-mix(in srgb, var(--admin-text) 8%, transparent),
          0 0 0 3px color-mix(in srgb, #ef4444 32%, transparent),
          0 0 40px color-mix(in srgb, #ef4444 16%, transparent);
      }
    }
  }
}

.login-page.is-success {
  .form-panel {
    animation: login-pop 0.55s $ease-spring both;
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.55) inset,
      0 22px 60px rgba(15, 23, 42, 0.08),
      0 0 0 3px rgba(34, 197, 94, 0.28),
      0 0 50px rgba(34, 197, 94, 0.14);

    @at-root html.dark & {
      box-shadow:
        0 1px 0 rgba(255, 255, 255, 0.04) inset,
        0 22px 60px rgba(0, 0, 0, 0.35),
        0 0 0 3px rgba(34, 197, 94, 0.28),
        0 0 50px rgba(34, 197, 94, 0.14);
    }

    @supports (color: color-mix(in srgb, red, blue)) {
      box-shadow:
        0 1px 0 color-mix(in srgb, #ffffff 55%, transparent) inset,
        0 22px 60px color-mix(in srgb, var(--admin-text) 8%, transparent),
        0 0 0 3px color-mix(in srgb, #22c55e 28%, transparent),
        0 0 50px color-mix(in srgb, #22c55e 14%, transparent);
    }

    @at-root html.dark & {
      @supports (color: color-mix(in srgb, red, blue)) {
        box-shadow:
          0 1px 0 color-mix(in srgb, #ffffff 55%, transparent) inset,
          0 22px 60px color-mix(in srgb, var(--admin-text) 8%, transparent),
          0 0 0 3px color-mix(in srgb, #22c55e 28%, transparent),
          0 0 50px color-mix(in srgb, #22c55e 14%, transparent);
      }
    }
  }
}

@keyframes login-pop {
  0% { transform: translateY(0) scale(1); }
  45% { transform: translateY(-3px) scale(1.015); }
  100% { transform: translateY(0) scale(1); }
}

@keyframes form-shake {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-5px); }
  30% { transform: translateX(5px); }
  45% { transform: translateX(-4px); }
  60% { transform: translateX(3px); }
  75% { transform: translateX(-2px); }
  90% { transform: translateX(1px); }
}

.login-page::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -2;
  background-color: var(--admin-page-bg);
  background-image: url('https://api.xsot.cn/bing?jump=true');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: saturate(1.06) contrast(1.06) brightness(0.96);
}

.login-page::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(120% 90% at 10% 0%, rgba(99, 102, 241, 0.2), transparent 60%),
    radial-gradient(120% 90% at 90% 80%, rgba(129, 140, 248, 0.12), transparent 62%),
    radial-gradient(120% 120% at 50% 50%, rgba(0, 0, 0, 0.22), transparent 54%),
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.55) 0%,
      rgba(255, 255, 255, 0.78) 52%,
      rgba(255, 255, 255, 0.6) 100%
    );
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);

  @at-root html.dark & {
    background:
      radial-gradient(120% 90% at 10% 0%, rgba(129, 140, 248, 0.18), transparent 60%),
      radial-gradient(120% 90% at 90% 80%, rgba(165, 180, 252, 0.1), transparent 62%),
      radial-gradient(120% 120% at 50% 50%, rgba(0, 0, 0, 0.36), transparent 54%),
      linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.55) 0%,
        rgba(0, 0, 0, 0.65) 52%,
        rgba(0, 0, 0, 0.58) 100%
      );
  }

  @supports (color: color-mix(in srgb, red, blue)) {
    background:
      radial-gradient(
        120% 90% at 10% 0%,
        color-mix(in srgb, var(--el-color-primary) 20%, transparent),
        transparent 60%
      ),
      radial-gradient(
        120% 90% at 90% 80%,
        color-mix(in srgb, var(--el-color-primary-light-3) 12%, transparent),
        transparent 62%
      ),
      radial-gradient(120% 120% at 50% 50%, rgba(0, 0, 0, 0.22), transparent 54%),
      linear-gradient(
        180deg,
        color-mix(in srgb, #ffffff 55%, transparent) 0%,
        color-mix(in srgb, #ffffff 78%, transparent) 52%,
        color-mix(in srgb, #ffffff 60%, transparent) 100%
      );

    @at-root html.dark & {
      background:
        radial-gradient(
          120% 90% at 10% 0%,
          color-mix(in srgb, var(--el-color-primary) 18%, transparent),
          transparent 60%
        ),
        radial-gradient(
          120% 90% at 90% 80%,
          color-mix(in srgb, var(--el-color-primary-light-3) 10%, transparent),
          transparent 62%
        ),
        radial-gradient(120% 120% at 50% 50%, rgba(0, 0, 0, 0.36), transparent 54%),
        linear-gradient(
          180deg,
          color-mix(in srgb, #000000 55%, transparent) 0%,
          color-mix(in srgb, #000000 65%, transparent) 52%,
          color-mix(in srgb, #000000 58%, transparent) 100%
        );
    }
  }
}

/* ========================================
   右侧面板
   ======================================== */
.right {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: transparent;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(120% 80% at 20% 0%, rgba(99, 102, 241, 0.14), transparent 60%),
      linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.38) 0%,
        rgba(255, 255, 255, 0.48) 55%,
        rgba(255, 255, 255, 0.4) 100%
      );

    @at-root html.dark & {
      background:
        radial-gradient(120% 80% at 20% 0%, rgba(129, 140, 248, 0.12), transparent 60%),
        linear-gradient(
          180deg,
          rgba(0, 0, 0, 0.35) 0%,
          rgba(0, 0, 0, 0.42) 55%,
          rgba(0, 0, 0, 0.38) 100%
        );
    }

    @supports (color: color-mix(in srgb, red, blue)) {
      background:
        radial-gradient(
          120% 80% at 20% 0%,
          color-mix(in srgb, var(--el-color-primary) 14%, transparent),
          transparent 60%
        ),
        linear-gradient(
          180deg,
          color-mix(in srgb, #ffffff 38%, transparent) 0%,
          color-mix(in srgb, #ffffff 48%, transparent) 55%,
          color-mix(in srgb, #ffffff 40%, transparent) 100%
        );

      @at-root html.dark & {
        background:
          radial-gradient(
            120% 80% at 20% 0%,
            color-mix(in srgb, var(--el-color-primary) 12%, transparent),
            transparent 60%
          ),
          linear-gradient(
            180deg,
            color-mix(in srgb, #000000 35%, transparent) 0%,
            color-mix(in srgb, #000000 42%, transparent) 55%,
            color-mix(in srgb, #000000 38%, transparent) 100%
          );
      }
    }
  }
}

.login-lang-bar {
  position: absolute;
  top: max(16px, env(safe-area-inset-top));
  right: max(16px, env(safe-area-inset-right));
  z-index: 3;
}

.form-wrapper {
  width: 100%;
  max-width: 980px;
  animation: form-wrapper-in 0.6s $ease-out-expo both;
  animation-delay: 0.15s;
}

@keyframes form-wrapper-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* —— form-wrapper：按图片 1-6 的分栏登录卡与手机态圆形表单 —— */
.form-wrapper .form-panel.form-wrapper-frame {
  padding: 0;
  overflow: hidden;
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 1) 100%);
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.04),
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 8px 24px -8px rgba(99, 102, 241, 0.12),
    0 28px 64px -24px rgba(15, 23, 42, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;

  @at-root html.dark & {
    background: linear-gradient(
      175deg,
      color-mix(in srgb, var(--admin-surface) 96%, #1e293b) 0%,
      color-mix(in srgb, var(--admin-surface) 99%, #0f172a) 100%
    );
    border-color: rgba(148, 163, 184, 0.14);
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.35),
      0 1px 2px rgba(0, 0, 0, 0.25),
      0 20px 48px -12px rgba(0, 0, 0, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  &::before {
    display: none;
  }
}

.form-wrapper-split {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  width: 100%;
  min-height: 0;
  height: auto;
}

/* 桌面分栏：统一最小高度，避免账号/手机切换时整卡忽高忽低（手机端在下方 media 里覆盖为 auto） */
@media (min-width: 1024px) {
  .form-wrapper-split {
    min-height: clamp(432px, 41vmin, 508px);
  }
}

.form-wrapper-split--stage {
  position: relative;
  isolation: isolate;
  /* 避免裁剪位移中的 .form-stage-blob；外沿仍由 .form-wrapper-frame 的 overflow 圆角裁切 */
  overflow: visible;
  border-radius: inherit;
}

.form-wrapper-main-outer {
  position: relative;
  z-index: 2;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* 外层负责位移；内层负责圆形与「静止时略大 → 切换时缩小 → 到位后再放大」的 scale 动画 */
.form-stage-blob {
  display: none;
  position: absolute;
  z-index: 1;
  top: 50%;
  width: min(148%, 900px);
  max-width: none;
  aspect-ratio: 1;
  pointer-events: none;
  transform: translate(-50%, -50%);
  will-change: left;
  isolation: isolate;
  background: none;
  border-radius: 0;
  box-shadow: none;

  @media (min-width: 1024px) {
    display: block;
  }

  .form-wrapper:not(.is-phone-layout) & {
    left: 96%;
  }

  .form-wrapper.is-phone-layout & {
    left: 6%;
  }
}

.form-stage-blob__disk {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transform: scale(1.12);
  transform-origin: 50% 50%;
  will-change: transform;
  pointer-events: none;
  isolation: isolate;
  background:
    radial-gradient(circle at 32% 26%, rgba(255, 255, 255, 1) 0%, transparent 52%),
    radial-gradient(circle at 72% 78%, rgba(238, 242, 255, 0.9) 0%, transparent 48%),
    linear-gradient(165deg, #ffffff 0%, #f8fafc 52%, #f1f5f9 100%);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.9) inset,
    0 0 0 1px rgba(99, 102, 241, 0.06),
    0 4px 12px rgba(15, 23, 42, 0.04),
    0 20px 44px -12px rgba(99, 102, 241, 0.14),
    0 36px 72px -28px rgba(15, 23, 42, 0.12),
    inset 0 -28px 48px -30px rgba(99, 102, 241, 0.06);

  @at-root html.dark & {
    background:
      radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.12) 0%, transparent 45%),
      radial-gradient(circle at 70% 80%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
      linear-gradient(
        165deg,
        color-mix(in srgb, var(--admin-surface) 99%, #1e293b) 0%,
        color-mix(in srgb, var(--admin-surface) 96%, #0f172a) 100%
      );
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.06) inset,
      0 0 0 1px rgba(0, 0, 0, 0.35),
      0 20px 48px -14px rgba(0, 0, 0, 0.45),
      inset 0 -24px 40px -28px rgba(99, 102, 241, 0.08);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 10%;
    border-radius: inherit;
    pointer-events: none;
    opacity: 0.55;
    background: radial-gradient(
      circle at 50% 50%,
      transparent 55%,
      rgba(99, 102, 241, 0.04) 100%
    );
    z-index: 1;
  }
}

.form-main-content {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;

  @media (min-width: 1024px) {
    max-width: 408px;
    width: 100%;
    margin-inline: auto;
  }
}

.form-wrapper-main {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
  width: 100%;
  margin: 0;
  padding: 18px 26px 22px 24px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  /* 避免 overflow-x:hidden 与 overflow-y:visible 组合把纵向算成 auto 而出现竖条 */
  overflow: visible;

  @supports (overflow: clip) {
    overflow-x: clip;
    overflow-y: visible;
  }

  background: #ffffff;
  border-radius: 0 22px 22px 0;
  box-shadow: none;

  @at-root html.dark & {
    background: color-mix(in srgb, var(--admin-surface) 98%, #0f172a);
    box-shadow: none;
  }

  @media (min-width: 1024px) {
    padding: 22px 28px 26px 28px;
    background: transparent;
    align-items: center;
    justify-content: center;

    @at-root html.dark & {
      background: transparent;
    }
  }
}

@media (min-width: 1024px) {
  .mobile-brand {
    display: none;
  }
}

.form-wrapper.is-phone-layout .form-wrapper-split {
  flex-direction: row-reverse;
}

.form-wrapper.is-phone-layout .form-wrapper-main {
  /* 约半宽 + 可伸缩，避免 58% 过窄把验证码输入和按钮挤在一起 */
  flex: 1 1 50%;
  width: auto;
  min-width: min(100%, 300px);
  min-height: 0;
  height: auto;
  margin: 0 0 0 8px;
  padding: 18px 22px 20px 20px;
  border-radius: 22px 0 0 22px;
  align-self: stretch;
  overflow: visible;

  @supports (overflow: clip) {
    overflow-x: clip;
    overflow-y: visible;
  }

  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    0 12px 36px rgba(99, 102, 241, 0.1);

  @media (min-width: 1024px) {
    padding: 22px 26px 24px 22px;
    box-shadow: none;
  }
}

.form-wrapper.is-phone-layout :deep(.form-wrapper-deco) {
  flex: 1 1 50%;
  min-width: 0;
  margin: 0;
  padding: 12px 8px;
}

.form-wrapper.is-phone-layout :deep(.form-illust) {
  animation-name: form-illust-float-mirror;
}

.form-main-content > .login-auth-forms {
  flex: 0 0 auto;
  min-width: 0;
  width: 100%;
}

@media (prefers-reduced-motion: reduce) {
  :deep(.form-illust) {
    animation: none;
  }

  .form-wrapper.is-phone-layout :deep(.form-illust) {
    animation: none;
  }

  :deep(.form-illust__arm--wave) {
    animation: none;
  }
}

/* H5 / 平板竖屏：与左侧品牌区隐藏断点一致，角色插画在上、表单在下，整宽 */
@media (max-width: 1023px) {
  .form-wrapper-split {
    flex-direction: column;
    min-height: 0 !important;
    height: auto;
    max-height: none;
  }

  :deep(.form-wrapper-deco) {
    order: 1;
    flex: 0 0 auto;
    max-width: none;
    margin: 0;
    min-height: 180px;
    padding: 14px 12px 12px;
    border-radius: 18px 18px 0 0;
    box-shadow: inset 0 -1px 0 rgba(15, 23, 42, 0.06);

    @at-root html.dark & {
      box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.06);
    }
  }

  .form-wrapper-main-outer {
    order: 2;
    width: 100%;
  }

  :deep(.form-illust-swap) {
    height: 180px;
    max-height: 200px;
  }

  :deep(.form-illust) {
    height: 180px;
    max-height: 200px;
  }

  /* 账号 ⇄ 手机 切换时统一表单区最小高度，避免整块卡片忽高忽低 */
  .form-main-content {
    min-height: clamp(420px, 50svh, 500px);
  }

  /* order:2 表单在下，白底底角与卡片下沿对齐 */
  .form-wrapper-main {
    margin: 0;
    padding: 18px 16px 16px;
    border-radius: 0 0 18px 18px;
    clip-path: none;
  }

  .form-wrapper.is-phone-layout .form-wrapper-split {
    flex-direction: column;
  }

  .form-wrapper.is-phone-layout .form-wrapper-main {
    width: 100%;
    max-width: none;
    flex: 1 1 auto;
    min-width: 0;
    height: auto;
    margin: 0;
    padding: 18px 16px 16px;
    border-radius: 0 0 18px 18px;
    clip-path: none;
  }

  .cap-row.cap-row--sms {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .cap-row.cap-row--sms .sms-send-btn {
    width: 100%;
    min-width: 0;
    height: 46px;
  }
}

.form-panel {
  position: relative;
  padding: 32px 28px 26px;
  border-radius: 20px;
  border: 1px solid rgba(51, 65, 85, 0.12);
  background: rgba(255, 255, 255, 0.86);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.55) inset,
    0 22px 60px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);

  @at-root html.dark & {
    border: 1px solid rgba(148, 163, 184, 0.17);
    background: rgba(15, 23, 42, 0.86);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.04) inset,
      0 22px 60px rgba(0, 0, 0, 0.32);
  }

  @supports (color: color-mix(in srgb, red, blue)) {
    border: 1px solid color-mix(in srgb, var(--admin-border-strong) 85%, transparent);
    background: color-mix(in srgb, var(--admin-surface) 86%, transparent);
    box-shadow:
      0 1px 0 color-mix(in srgb, #ffffff 55%, transparent) inset,
      0 22px 60px color-mix(in srgb, var(--admin-text) 8%, transparent);
  }

  @at-root html.dark & {
    @supports (color: color-mix(in srgb, red, blue)) {
      border: 1px solid color-mix(in srgb, var(--admin-border-strong) 85%, transparent);
      background: color-mix(in srgb, var(--admin-surface) 86%, transparent);
      box-shadow:
        0 1px 0 color-mix(in srgb, #ffffff 55%, transparent) inset,
        0 22px 60px color-mix(in srgb, var(--admin-text) 8%, transparent);
    }
  }

  &::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: 20px;
    pointer-events: none;
    background: radial-gradient(
      110% 90% at 0% 0%,
      rgba(99, 102, 241, 0.16),
      transparent 60%
    );
    opacity: 0.65;

    @supports (color: color-mix(in srgb, red, blue)) {
      background: radial-gradient(
        110% 90% at 0% 0%,
        color-mix(in srgb, var(--el-color-primary) 16%, transparent),
        transparent 60%
      );
    }
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

/* ========================================
   响应式
   ======================================== */
@media (max-width: 1023px) {
  .login-page {
    grid-template-columns: 1fr;
    overflow-x: hidden;
  }
  :deep(.login-brand-panel) {
    display: none;
  }

  :deep(.login-bg-effects .bg-particles),
  :deep(.login-bg-effects .bg-mesh) {
    display: none;
  }

  .right {
    align-items: center;
    justify-content: center;
    min-height: 100svh;
    padding: max(16px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right))
      max(16px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left));
  }

  .form-wrapper {
    width: 100%;
    max-width: 520px;
  }

  .form-panel {
    max-height: calc(100svh - max(32px, env(safe-area-inset-top)) - max(32px, env(safe-area-inset-bottom)));
    overflow-y: auto;
  }

  /* 分栏登录卡片内容更高，勿用视口高度把整块卡死导致裁切 */
  .form-wrapper .form-panel.form-wrapper-frame {
    max-height: none;
    overflow: visible;
  }

  .mobile-brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    color: var(--el-text-color-primary);

    .mobile-brand-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(99, 102, 241, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;

      @supports (color: color-mix(in srgb, red, blue)) {
        background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
      }
    }
  }

  .login-lang-bar {
    position: static;
    display: flex;
    justify-content: flex-end;
    margin-bottom: 12px;
    z-index: 1;
  }
}

@media (max-width: 640px) {
  .form-panel {
    border-radius: 14px;
    padding: 20px 14px 16px;
  }

  .form-wrapper .form-panel.form-wrapper-frame {
    padding: 0;
  }

  .success-mark {
    position: static;
    margin: 0 auto 12px;
    justify-content: center;
  }

  .header {
    margin-bottom: 18px;

    h1 { font-size: 24px; margin-bottom: 6px; }
    p { font-size: 13px; }
  }

  :deep(.form) {
    gap: 14px;
  }

  :deep(.field) {
    gap: 6px;

    label {
      font-size: 13px;
    }

    .input-shell input {
      height: 44px;
      border-radius: 9px;
      font-size: 14px;
    }
  }

  :deep(.btn-primary) {
    height: 44px;
    font-size: 15px;
    border-radius: 10px;
  }

  :deep(.captcha-box) {
    width: 118px;
  }
  :deep(.captcha-img) {
    height: 44px;
    border-radius: 9px;
  }
  :deep(.eye-btn) {
    right: 8px;
  }
}

@media (max-width: 460px) {
  .right {
    padding-left: max(10px, env(safe-area-inset-left));
    padding-right: max(10px, env(safe-area-inset-right));
  }

  .mobile-brand { margin-bottom: 14px; font-size: 17px; }
  .header .badge { margin-bottom: 10px; }
  :deep(.captcha-box) {
    width: 104px;
  }
  :deep(.cap-row .cap-input) {
    width: 100%;
  }
  :deep(.captcha-img) {
    object-fit: contain;
  }
  :deep(.hint) {
    line-height: 1.45;
  }
}
</style>
