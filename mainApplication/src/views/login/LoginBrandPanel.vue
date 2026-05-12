<template>
  <div
    class="login-brand-panel"
    :class="{ 'is-success': uiSuccessPulse }"
    :style="brandStyle"
  >
    <div class="floating-orbs" aria-hidden="true">
      <span v-for="i in 6" :key="'o' + i" class="orb" :style="{ '--oi': i }" />
    </div>

    <div class="brand">
      <div class="brand-icon">
        <el-icon :size="18"><MagicStick /></el-icon>
      </div>
      <span class="brand-text">{{ t('login.brand') }}</span>
    </div>

    <div class="characters-area">
      <AnimatedCharacters
        :is-typing="isTyping || phoneFocused"
        :has-secret="!!password"
        :secret-visible="showPassword"
        :reaction="uiErrorPulse ? 'error' : uiSuccessPulse ? 'success' : null"
      />
    </div>

    <div class="footer-links">
      <div class="left-tagline">
        <span v-if="tagline" class="tagline-text">{{ tagline }}</span>
      </div>
    </div>

    <div class="deco-grid" aria-hidden="true" />
    <div class="deco-circle deco-circle-1" aria-hidden="true" />
    <div class="deco-circle deco-circle-2" aria-hidden="true" />
    <div class="deco-circle deco-circle-3" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import type { StyleValue } from 'vue'
import { useI18n } from 'vue-i18n'
import { MagicStick } from '@element-plus/icons-vue'
import AnimatedCharacters from '@/components/login-animation/AnimatedCharacters.vue'

defineProps<{
  brandStyle: StyleValue
  tagline: string
  isTyping: boolean
  phoneFocused: boolean
  password: string
  showPassword: boolean
  uiErrorPulse: boolean
  uiSuccessPulse: boolean
}>()

const { t } = useI18n()
</script>

<style scoped lang="scss">
$ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
$ease-smooth: cubic-bezier(0.22, 1, 0.36, 1);

.login-brand-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px;
  color: #fff;
  overflow: hidden;
  background: transparent;
}

.login-brand-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.44),
    rgba(99, 102, 241, 0.36) 45%,
    rgba(99, 102, 241, 0.28)
  );
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);

  @supports (color: color-mix(in srgb, red, blue)) {
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--login-primary) 44%, transparent),
      color-mix(in srgb, var(--login-primary) 36%, transparent) 45%,
      color-mix(in srgb, var(--login-primary) 28%, transparent)
    );
  }
}

.floating-orbs {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(20px);

  width: calc(50px + var(--oi) * 18px);
  height: calc(50px + var(--oi) * 18px);
  left: calc(var(--oi) * 15% + 8%);
  top: calc(var(--oi) * 13% + 3%);
  background: radial-gradient(
    circle at 35% 35%,
    rgba(255, 255, 255, 0.2),
    rgba(255, 255, 255, 0.05) 50%,
    transparent 80%
  );
  animation: orb-drift calc(14s + var(--oi) * 2s) ease-in-out infinite;
  animation-delay: calc(var(--oi) * -2s);
  opacity: 0.55;
}

@keyframes orb-drift {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(20px, -25px) scale(1.15);
  }
  50% {
    transform: translate(-12px, -10px) scale(0.88);
  }
  75% {
    transform: translate(-22px, 16px) scale(1.12);
  }
}

.brand {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
}

.brand-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s $ease-smooth;

  &:hover {
    transform: scale(1.08) rotate(-3deg);
  }
}

.brand-text {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 255, 255, 0.7) 30%,
    rgba(255, 255, 255, 1) 50%,
    rgba(255, 255, 255, 0.8) 70%,
    rgba(255, 255, 255, 1) 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: brand-shimmer 4s ease-in-out infinite;
  letter-spacing: 0.03em;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3));
}

@keyframes brand-shimmer {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.characters-area {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.login-brand-panel.is-success .characters-area {
  animation: login-pop 0.55s $ease-spring both;
}

@keyframes login-pop {
  0% {
    transform: translateY(0) scale(1);
  }
  45% {
    transform: translateY(-3px) scale(1.015);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

.footer-links {
  position: relative;
  z-index: 20;
  font-size: 14px;
}

.left-tagline {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .tagline-text {
    font-size: 12px;
    letter-spacing: 0.03em;
    color: rgba(255, 255, 255, 0.68);
    transition: opacity 0.5s ease;
  }
}

.deco-grid {
  position: absolute;
  inset: 0;
  z-index: 1;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 20px 20px;
  animation: grid-shift 30s linear infinite;
}

@keyframes grid-shift {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 20px 20px;
  }
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(48px);
  z-index: 1;
  pointer-events: none;
}

.deco-circle-1 {
  top: 25%;
  right: 25%;
  width: 256px;
  height: 256px;
  background: rgba(255, 255, 255, 0.1);
  animation: circle-breathe 8s ease-in-out infinite;
}

.deco-circle-2 {
  bottom: 25%;
  left: 25%;
  width: 384px;
  height: 384px;
  background: rgba(255, 255, 255, 0.05);
  animation: circle-breathe 10s ease-in-out infinite reverse;
}

.deco-circle-3 {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.07);
  animation: circle-breathe 7s ease-in-out infinite 2s;
}

@keyframes circle-breathe {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.25);
    opacity: 0.9;
  }
}
</style>
