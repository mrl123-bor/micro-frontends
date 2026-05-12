<template>
  <div class="login-auth-forms">
    <template v-if="loginPanel === 'account'">
      <div v-if="demoRuntime" class="login-demo-banner">
        <div class="login-demo-banner__title">{{ t('login.demoPanelTitle') }}</div>
        <p class="login-demo-banner__desc">{{ t('login.demoPanelDesc') }}</p>
      </div>

      <form class="form" @submit.prevent="emit('submit')">
        <div class="field field-stagger-1">
          <label for="login-user">{{ t('login.account') }}</label>
          <div class="input-shell">
            <input
              id="login-user"
              v-model="username"
              type="text"
              name="username"
              autocomplete="username"
              :placeholder="t('login.usernamePh')"
              required
              @focus="emit('accountTyping', true)"
              @blur="emit('accountTyping', false)"
            />
            <span class="input-glow" aria-hidden="true" />
          </div>
        </div>

        <div class="field field-stagger-2">
          <label for="login-pass">{{ t('login.password') }}</label>
          <div class="input-shell">
            <div class="password-wrap">
              <input
                id="login-pass"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                name="password"
                autocomplete="current-password"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                class="eye-btn"
                tabindex="-1"
                :aria-label="showPassword ? t('login.hidePwd') : t('login.showPwd')"
                :class="{ 'is-revealed': showPassword }"
                @click="emit('togglePassword')"
              >
                <el-icon v-if="showPassword" :size="18"><Hide /></el-icon>
                <el-icon v-else :size="18"><View /></el-icon>
              </button>
            </div>
            <span class="input-glow" aria-hidden="true" />
          </div>
        </div>

        <div v-if="captchaUuid" class="field field-stagger-3">
          <label for="login-cap">{{ t('login.captcha') }}</label>
          <div class="cap-row">
            <div class="input-shell" style="flex: 1; min-width: 0">
              <input
                id="login-cap"
                v-model="captchaCode"
                type="text"
                autocomplete="off"
                :placeholder="t('login.captchaPh')"
                class="cap-input"
              />
              <span class="input-glow" aria-hidden="true" />
            </div>
            <div class="captcha-box" @click="onCaptchaClick">
              <div class="captcha-glow-ring" aria-hidden="true" />
              <img
                v-if="captchaImg"
                :src="captchaImg"
                class="captcha-img"
                :alt="t('login.captchaAlt')"
                :title="t('login.captchaTitle')"
              />
              <div class="captcha-shimmer" aria-hidden="true" />
            </div>
          </div>
          <p v-if="captchaPlain" class="hint">{{ t('login.debugPlain') }}: {{ captchaPlain }}</p>
        </div>

        <div class="form-extras">
          <label class="remember-check">
            <input v-model="rememberMe" type="checkbox" name="remember" />
            <span>{{ t('login.rememberMe') }}</span>
          </label>
          <button
            v-if="showLoginMobileOption"
            type="button"
            class="form-mode-switch"
            @click="emit('switchPhone')"
          >
            {{ t('login.switchToPhone') }}
          </button>
        </div>

        <button
          type="submit"
          class="btn-primary field-stagger-4"
          :disabled="loading"
          :style="{ '--btn-color': primaryColor }"
        >
          <span class="btn-bg" aria-hidden="true" />
          <span class="btn-ripple" aria-hidden="true" />
          <span class="btn-content">
            <span v-if="loading" class="btn-loading-dots">
              <i>•</i><i>•</i><i>•</i>
            </span>
            <span v-else>{{ t('login.submit') }}</span>
          </span>
        </button>
      </form>
    </template>

    <template v-else>
      <div class="phone-login-bar">
        <button
          type="button"
          class="phone-back"
          :aria-label="t('login.switchToAccount')"
          @click="emit('switchAccount')"
        >
          <el-icon :size="20"><ArrowLeft /></el-icon>
        </button>
      </div>

      <form class="form" @submit.prevent="emit('submitPhone')">
        <div class="field field-stagger-1">
          <label for="login-phone">{{ t('login.phone') }}</label>
          <div class="input-shell">
            <input
              id="login-phone"
              v-model="phone"
              type="tel"
              name="phone"
              autocomplete="tel"
              maxlength="11"
              inputmode="numeric"
              pattern="[0-9]{11}"
              :placeholder="t('login.phonePh')"
              required
              @focus="emit('phoneFocus', true)"
              @blur="emit('phoneFocus', false)"
            />
            <span class="input-glow" aria-hidden="true" />
          </div>
        </div>

        <div class="field field-stagger-2">
          <label for="login-sms">{{ t('login.smsCode') }}</label>
          <div class="cap-row cap-row--sms">
            <div class="input-shell" style="flex: 1; min-width: 0">
              <input
                id="login-sms"
                v-model="smsCode"
                type="text"
                name="sms"
                autocomplete="one-time-code"
                :placeholder="t('login.smsPh')"
                maxlength="8"
                required
              />
              <span class="input-glow" aria-hidden="true" />
            </div>
            <button
              type="button"
              class="sms-send-btn"
              :disabled="smsCooldown > 0"
              @click="emit('sendSms')"
            >
              {{
                smsCooldown > 0 ? t('login.smsRetry', { n: smsCooldown }) : t('login.smsSend')
              }}
            </button>
          </div>
        </div>

        <div class="form-extras">
          <label class="remember-check">
            <input v-model="rememberMe" type="checkbox" name="remember-phone" />
            <span>{{ t('login.rememberMe') }}</span>
          </label>
          <button type="button" class="form-mode-switch" @click="emit('switchAccount')">
            {{ t('login.switchToAccount') }}
          </button>
        </div>

        <button type="submit" class="btn-primary field-stagger-4" :style="{ '--btn-color': primaryColor }">
          <span class="btn-bg" aria-hidden="true" />
          <span class="btn-ripple" aria-hidden="true" />
          <span class="btn-content">{{ t('login.submit') }}</span>
        </button>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { View, Hide, ArrowLeft } from '@element-plus/icons-vue'

const props = defineProps<{
  loginPanel: 'account' | 'phone'
  demoRuntime: boolean
  loading: boolean
  captchaUuid: string
  captchaImg: string
  captchaPlain: string
  showLoginMobileOption: boolean
  smsCooldown: number
  primaryColor: string
  showPassword: boolean
  onCaptchaClick: () => void
}>()

const emit = defineEmits<{
  submit: []
  submitPhone: []
  switchPhone: []
  switchAccount: []
  sendSms: []
  togglePassword: []
  accountTyping: [v: boolean]
  phoneFocus: [v: boolean]
}>()

const username = defineModel<string>('username', { required: true })
const password = defineModel<string>('password', { required: true })
const captchaCode = defineModel<string>('captchaCode', { required: true })
const rememberMe = defineModel<boolean>('rememberMe', { required: true })
const phone = defineModel<string>('phone', { required: true })
const smsCode = defineModel<string>('smsCode', { required: true })

const { t } = useI18n()

function onCaptchaClick() {
  props.onCaptchaClick()
}
</script>

<style scoped lang="scss">
$ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
$ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
$ease-smooth: cubic-bezier(0.22, 1, 0.36, 1);

.login-auth-forms {
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
}

.form-extras {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: -4px;
  padding-top: 2px;
}

.remember-check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  cursor: pointer;
  user-select: none;

  input {
    width: 16px;
    height: 16px;
    accent-color: var(--el-color-primary);
    cursor: pointer;
  }
}

.form-mode-switch {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  margin: 0;
  padding: 4px 2px;
  border: none;
  border-radius: 8px;
  background: none;
  font: inherit;
  font-size: 13px;
  font-weight: 650;
  color: var(--el-color-primary);
  cursor: pointer;
  transition:
    opacity 0.2s ease,
    background 0.2s ease,
    transform 0.2s $ease-smooth;

  &:hover {
    opacity: 1;
    text-decoration: none;
    background: rgba(99, 102, 241, 0.1);

    @supports (color: color-mix(in srgb, red, blue)) {
      background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
    }
  }

  &:active {
    transform: scale(0.98);
  }
}

.phone-login-bar {
  display: flex;
  align-items: center;
  margin: 0 0 6px;
  min-height: 32px;

  .phone-back {
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: var(--el-color-primary);
    cursor: pointer;
    transition:
      background 0.2s ease,
      transform 0.2s $ease-smooth;

    &:hover {
      background: rgba(99, 102, 241, 0.1);

      @supports (color: color-mix(in srgb, red, blue)) {
        background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
      }
    }

    &:active {
      transform: scale(0.94);
    }
  }
}

.cap-row--sms {
  align-items: stretch;
  flex-wrap: wrap;
}

@media (max-width: 1100px) and (min-width: 901px) {
  .cap-row.cap-row--sms {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .cap-row.cap-row--sms .sms-send-btn {
    width: 100%;
    min-width: 0;
  }
}

.sms-send-btn {
  flex-shrink: 0;
  min-width: min(118px, 100%);
  height: 48px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1.5px solid var(--el-color-primary);
  background: rgba(99, 102, 241, 0.08);
  color: var(--el-color-primary);
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
  transition:
    background 0.2s ease,
    opacity 0.2s ease,
    transform 0.2s $ease-smooth;

  @supports (color: color-mix(in srgb, red, blue)) {
    background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  }

  &:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.14);

    @supports (color: color-mix(in srgb, red, blue)) {
      background: color-mix(in srgb, var(--el-color-primary) 16%, transparent);
    }
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }
}

.login-demo-banner {
  margin: -4px 0 22px;
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--el-color-warning) 35%, transparent);
  background: color-mix(in srgb, var(--el-color-warning) 10%, var(--admin-surface-muted));
  text-align: center;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.5) inset;
}

.login-demo-banner__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin-bottom: 6px;
}

.login-demo-banner__desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field-stagger-1 {
  animation: stagger-in 0.5s $ease-out-expo both;
  animation-delay: 0.25s;
}
.field-stagger-2 {
  animation: stagger-in 0.5s $ease-out-expo both;
  animation-delay: 0.35s;
}
.field-stagger-3 {
  animation: stagger-in 0.5s $ease-out-expo both;
  animation-delay: 0.45s;
}
.field-stagger-4 {
  animation: stagger-in 0.5s $ease-out-expo both;
  animation-delay: 0.55s;
}

@keyframes stagger-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 9px;

  label {
    font-size: 13px;
    font-weight: 650;
    color: var(--el-text-color-regular);
    letter-spacing: 0.01em;

    @supports (color: color-mix(in srgb, red, blue)) {
      color: color-mix(in srgb, var(--el-text-color-primary) 78%, var(--el-color-primary) 22%);
    }
  }
}

.input-shell {
  position: relative;

  .input-glow {
    position: absolute;
    inset: -2px;
    border-radius: 14px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
    background: linear-gradient(
      135deg,
      rgba(99, 102, 241, 0.3),
      rgba(129, 140, 248, 0.2),
      transparent 60%
    );
    z-index: 1;

    @supports (color: color-mix(in srgb, red, blue)) {
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--el-color-primary) 30%, transparent),
        color-mix(in srgb, var(--el-color-primary-light-3) 20%, transparent),
        transparent 60%
      );
    }
  }

  input {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 48px;
    padding: 0 16px;
    border-radius: 12px;
    border: 1.5px solid var(--el-border-color);

    @supports (color: color-mix(in srgb, red, blue)) {
      border-width: 1px;
      border-color: color-mix(in srgb, var(--el-border-color) 88%, var(--el-color-primary) 12%);
    }
    font-size: 14px;
    outline: none;
    background: rgba(255, 255, 255, 0.92);
    color: var(--el-text-color-primary);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.35) inset;
    transition:
      border-color 0.25s ease,
      box-shadow 0.25s ease,
      transform 0.2s $ease-smooth;

    @supports (color: color-mix(in srgb, red, blue)) {
      background: color-mix(in srgb, var(--el-bg-color) 92%, transparent);
      box-shadow: 0 1px 0 color-mix(in srgb, #ffffff 35%, transparent) inset;
    }

    @at-root html.dark & {
      background: rgba(15, 23, 42, 0.92);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset;

      @supports (color: color-mix(in srgb, red, blue)) {
        background: color-mix(in srgb, var(--el-bg-color) 92%, transparent);
        box-shadow: 0 1px 0 color-mix(in srgb, #ffffff 35%, transparent) inset;
      }
    }

    &::placeholder {
      color: var(--el-text-color-placeholder);
      transition: color 0.2s ease;
    }

    &:focus {
      border-color: var(--el-color-primary);
      box-shadow:
        0 0 0 3px rgba(99, 102, 241, 0.22),
        0 1px 0 rgba(255, 255, 255, 0.35) inset;
      transform: translateY(-1px);

      @supports (color: color-mix(in srgb, red, blue)) {
        box-shadow:
          0 0 0 3px color-mix(in srgb, var(--el-color-primary) 18%, transparent),
          0 1px 0 color-mix(in srgb, #ffffff 35%, transparent) inset;
      }

      @at-root html.dark & {
        box-shadow:
          0 0 0 3px rgba(129, 140, 248, 0.28),
          0 1px 0 rgba(255, 255, 255, 0.04) inset;

        @supports (color: color-mix(in srgb, red, blue)) {
          box-shadow:
            0 0 0 3px color-mix(in srgb, var(--el-color-primary) 18%, transparent),
            0 1px 0 color-mix(in srgb, #ffffff 35%, transparent) inset;
        }
      }

      &::placeholder {
        color: transparent;
      }

      ~ .input-glow {
        opacity: 1;
      }
    }
  }
}

.password-wrap {
  display: flex;

  input {
    padding-right: 46px;
  }
}

.eye-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  background: none;
  border: none;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.25s $ease-spring;

  &:hover {
    color: var(--el-color-primary);
    background: rgba(99, 102, 241, 0.1);

    @supports (color: color-mix(in srgb, red, blue)) {
      background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
    }
  }

  &.is-revealed {
    color: var(--el-color-primary);
    transform: translateY(-50%) rotateY(180deg);
  }
}

.cap-row {
  display: flex;
  gap: 10px;
  align-items: stretch;

  .cap-input {
    width: 100%;
  }
}

.captcha-box {
  position: relative;
  width: 130px;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 12px;
  overflow: visible;
  transition: transform 0.2s $ease-smooth;

  &:hover {
    transform: translateY(-2px);

    .captcha-glow-ring {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(0) scale(0.97);
  }

  .captcha-glow-ring {
    position: absolute;
    inset: -4px;
    border-radius: 14px;
    z-index: 0;
    pointer-events: none;
    opacity: 0;
    background: conic-gradient(
      from 0deg,
      var(--el-color-primary-light-3),
      var(--el-color-primary),
      #a78bfa,
      var(--el-color-primary-light-3)
    );
    filter: blur(6px);
    transition: opacity 0.3s ease;
  }

  .captcha-shimmer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      105deg,
      transparent 40%,
      rgba(255, 255, 255, 0.15) 45%,
      rgba(255, 255, 255, 0.15) 55%,
      transparent 60%
    );
    animation: shimmer-sweep 3s ease-in-out infinite;
    z-index: 2;
  }
}

.captcha-img {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 48px;
  object-fit: contain;
  border-radius: 12px;
  border: 1.5px solid var(--el-border-color);
  background: rgba(243, 244, 246, 0.85);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.3) inset;

  @supports (color: color-mix(in srgb, red, blue)) {
    background: color-mix(in srgb, var(--el-fill-color-light) 70%, transparent);
    box-shadow: 0 1px 0 color-mix(in srgb, #ffffff 30%, transparent) inset;
  }

  @at-root html.dark & {
    background: rgba(30, 41, 59, 0.75);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset;

    @supports (color: color-mix(in srgb, red, blue)) {
      background: color-mix(in srgb, var(--el-fill-color-light) 70%, transparent);
      box-shadow: 0 1px 0 color-mix(in srgb, #ffffff 30%, transparent) inset;
    }
  }
}

@keyframes shimmer-sweep {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.hint {
  margin: 6px 0 0;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.btn-primary {
  position: relative;
  width: 100%;
  height: 52px;
  font-size: 16px;
  font-weight: 650;
  border: none;
  border-radius: 14px;
  color: #fff;
  cursor: pointer;
  overflow: hidden;
  isolation: isolate;
  letter-spacing: 0.04em;
  margin-top: 6px;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.22) inset;

  @supports (color: color-mix(in srgb, red, blue)) {
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.22) inset,
      0 10px 28px -6px color-mix(in srgb, var(--btn-color, #6366f1) 42%, transparent);
  }

  .btn-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    background: linear-gradient(135deg, #7c7ff2, var(--btn-color), #5b5ee8);
    background-size: 200% 200%;
    animation: btn-gradient-shift 4s ease infinite;

    @supports (color: color-mix(in srgb, red, blue)) {
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--btn-color) 90%, #818cf8),
        var(--btn-color),
        color-mix(in srgb, var(--btn-color) 85%, #4f46e5)
      );
    }
  }

  .btn-ripple {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background: radial-gradient(
      circle at 50% 50%,
      rgba(255, 255, 255, 0.18),
      transparent 50%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .btn-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
    border-radius: 14px;
    box-shadow: 0 12px 32px rgba(99, 102, 241, 0.35);
    transition: box-shadow 0.3s ease;

    @supports (color: color-mix(in srgb, red, blue)) {
      box-shadow: 0 12px 32px color-mix(in srgb, var(--btn-color) 28%, transparent);
    }
  }

  &:hover:not(:disabled) {
    .btn-ripple {
      opacity: 1;
    }

    &::after {
      box-shadow: 0 16px 40px rgba(99, 102, 241, 0.45);

      @supports (color: color-mix(in srgb, red, blue)) {
        box-shadow: 0 16px 40px color-mix(in srgb, var(--btn-color) 40%, transparent);
      }
    }

    transform: translateY(-2px);
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.97);
  }

  transition:
    transform 0.2s $ease-smooth,
    opacity 0.2s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;

    &::after {
      box-shadow: none;
    }
  }
}

@keyframes btn-gradient-shift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.btn-loading-dots {
  display: inline-flex;
  gap: 3px;
  align-items: center;

  i {
    font-style: normal;
    animation: dot-bounce 1.2s ease-in-out infinite;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes dot-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.35;
  }
  40% {
    transform: translateY(-6px);
    opacity: 1;
  }
}
</style>
