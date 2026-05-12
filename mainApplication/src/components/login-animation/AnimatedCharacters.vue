<template>
  <div
    class="characters-container"
    :class="{
      'is-error': props.reaction === 'error',
      'is-success': props.reaction === 'success',
    }"
  >
    <div ref="purpleRef" class="char purple" :style="purpleStyle">
      <div class="eyes" :style="purpleEyesStyle">
        <EyeBall
          v-for="i in 2"
          :key="'p' + i"
          :size="18"
          :pupil-size="7"
          :max-distance="5"
          eye-color="white"
          pupil-color="#2D2D2D"
          :is-blinking="isPurpleBlinking"
          :force-look-x="purpleLookX"
          :force-look-y="purpleLookY"
        />
      </div>
      <!-- 嫌弃时的汗滴 -->
      <span v-if="isError" class="sweat sweat-1" aria-hidden="true" />
      <span v-if="isError" class="sweat sweat-2" aria-hidden="true" />
      <!-- 庆祝光环 -->
      <span v-if="isSuccess" class="celebrate-ring" aria-hidden="true" />
    </div>
    <div ref="blackRef" class="char black" :style="blackStyle">
      <div class="eyes" :style="blackEyesStyle">
        <EyeBall
          v-for="i in 2"
          :key="'b' + i"
          :size="16"
          :pupil-size="6"
          :max-distance="4"
          eye-color="white"
          pupil-color="#2D2D2D"
          :is-blinking="isBlackBlinking"
          :force-look-x="blackLookX"
          :force-look-y="blackLookY"
        />
      </div>
    </div>
    <div ref="orangeRef" class="char orange" :style="orangeStyle">
      <div class="eyes" :style="orangeEyesStyle">
        <Pupil
          v-for="i in 2"
          :key="'o' + i"
          :size="12"
          :max-distance="5"
          pupil-color="#2D2D2D"
          :force-look-x="hiding ? -5 : isSuccess ? 5 : undefined"
          :force-look-y="hiding ? -4 : isSuccess ? -4 : undefined"
        />
      </div>
    </div>
    <div ref="yellowRef" class="char yellow" :style="yellowStyle">
      <div class="eyes" :style="yellowEyesStyle">
        <Pupil
          v-for="i in 2"
          :key="'y' + i"
          :size="12"
          :max-distance="5"
          pupil-color="#2D2D2D"
          :force-look-x="hiding ? -5 : isSuccess ? -5 : undefined"
          :force-look-y="hiding ? -4 : isSuccess ? -4 : undefined"
        />
      </div>
      <div class="mouth" :style="yellowMouthStyle" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import EyeBall from './EyeBall.vue'
import Pupil from './Pupil.vue'

const props = withDefaults(
  defineProps<{
    isTyping?: boolean
    hasSecret?: boolean
    secretVisible?: boolean
    reaction?: 'error' | 'success' | null
  }>(),
  {
    isTyping: false,
    hasSecret: false,
    secretVisible: false,
    reaction: null,
  },
)

const isError = computed(() => props.reaction === 'error')
const isSuccess = computed(() => props.reaction === 'success')

const mouseX = ref(0)
const mouseY = ref(0)
const isPurpleBlinking = ref(false)
const isBlackBlinking = ref(false)
const isLookingAtEachOther = ref(false)
const isPurplePeeking = ref(false)

const purpleRef = ref<HTMLDivElement | null>(null)
const blackRef = ref<HTMLDivElement | null>(null)
const yellowRef = ref<HTMLDivElement | null>(null)
const orangeRef = ref<HTMLDivElement | null>(null)

const purplePos = reactive({ faceX: 0, faceY: 0, bodySkew: 0 })
const blackPos = reactive({ faceX: 0, faceY: 0, bodySkew: 0 })
const yellowPos = reactive({ faceX: 0, faceY: 0, bodySkew: 0 })
const orangePos = reactive({ faceX: 0, faceY: 0, bodySkew: 0 })

const hiding = computed(() => props.hasSecret && props.secretVisible)
const leaning = computed(
  () => props.isTyping || (props.hasSecret && !props.secretVisible),
)

function calcPos(
  el: HTMLDivElement | null,
  target: { faceX: number; faceY: number; bodySkew: number },
) {
  if (!el) return
  const r = el.getBoundingClientRect()
  const dx = mouseX.value - (r.left + r.width / 2)
  const dy = mouseY.value - (r.top + r.height / 3)
  target.faceX = Math.max(-15, Math.min(15, dx / 20))
  target.faceY = Math.max(-10, Math.min(10, dy / 30))
  target.bodySkew = Math.max(-6, Math.min(6, -dx / 120))
}

let rafId = 0
function tick() {
  calcPos(purpleRef.value, purplePos)
  calcPos(blackRef.value, blackPos)
  calcPos(yellowRef.value, yellowPos)
  calcPos(orangeRef.value, orangePos)
  rafId = requestAnimationFrame(tick)
}

function onMouseMove(e: MouseEvent) {
  mouseX.value = e.clientX
  mouseY.value = e.clientY
}

function setupBlink(target: { value: boolean }) {
  let t = 0
  const go = () => {
    t = window.setTimeout(
      () => {
        target.value = true
        window.setTimeout(() => {
          target.value = false
          go()
        }, 150)
      },
      Math.random() * 4000 + 3000,
    )
  }
  go()
  return () => clearTimeout(t)
}

let stopP: (() => void) | undefined
let stopB: (() => void) | undefined

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
  stopP = setupBlink(isPurpleBlinking)
  stopB = setupBlink(isBlackBlinking)
  rafId = requestAnimationFrame(tick)
})
onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  cancelAnimationFrame(rafId)
  stopP?.()
  stopB?.()
})

watch(
  () => props.isTyping,
  (v) => {
    if (v) {
      isLookingAtEachOther.value = true
      setTimeout(() => {
        isLookingAtEachOther.value = false
      }, 800)
    } else {
      isLookingAtEachOther.value = false
    }
  },
)

let peekT: number | undefined
watch(
  [() => props.hasSecret, () => props.secretVisible, isPurplePeeking],
  () => {
    if (peekT !== undefined) clearTimeout(peekT)
    if (props.hasSecret && props.secretVisible) {
      peekT = window.setTimeout(() => {
        isPurplePeeking.value = true
        setTimeout(() => {
          isPurplePeeking.value = false
        }, 800)
      }, Math.random() * 3000 + 2000)
    } else {
      isPurplePeeking.value = false
    }
  },
)

const purpleStyle = computed(() => {
  if (isSuccess.value)
    return {
      height: '400px',
      transform: 'skewX(0deg)',
      animation: 'char-bounce-success 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
    }
  return {
    height: leaning.value ? '440px' : '400px',
    transform: hiding.value
      ? 'skewX(0deg)'
      : leaning.value
        ? `skewX(${purplePos.bodySkew - 12}deg) translateX(40px)`
        : `skewX(${purplePos.bodySkew}deg)`,
  }
})
const purpleEyesStyle = computed(() => ({
  left: hiding.value ? '20px' : isLookingAtEachOther.value ? '55px' : `${45 + purplePos.faceX}px`,
  top: hiding.value ? '35px' : isLookingAtEachOther.value ? '65px' : `${40 + purplePos.faceY}px`,
  gap: '32px',
}))
const purpleLookX = computed(() => {
  if (isError.value) return 5
  if (isSuccess.value) return 4
  return hiding.value
    ? isPurplePeeking.value
      ? 4
      : -4
    : isLookingAtEachOther.value
      ? 3
      : undefined
})
const purpleLookY = computed(() => {
  if (isError.value) return -5
  if (isSuccess.value) return -4
  return hiding.value
    ? isPurplePeeking.value
      ? 5
      : -4
    : isLookingAtEachOther.value
      ? 4
      : undefined
})

const blackStyle = computed(() => {
  if (isSuccess.value)
    return {
      transform: 'skewX(0deg)',
      animation: 'char-bounce-success 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.08s both',
    }
  return {
    transform: hiding.value
      ? 'skewX(0deg)'
      : isLookingAtEachOther.value
        ? `skewX(${blackPos.bodySkew * 1.5 + 10}deg) translateX(20px)`
        : leaning.value
          ? `skewX(${blackPos.bodySkew * 1.5}deg)`
          : `skewX(${blackPos.bodySkew}deg)`,
  }
})
const blackEyesStyle = computed(() => ({
  left: hiding.value ? '10px' : isLookingAtEachOther.value ? '32px' : `${26 + blackPos.faceX}px`,
  top: hiding.value ? '28px' : isLookingAtEachOther.value ? '12px' : `${32 + blackPos.faceY}px`,
  gap: '24px',
}))
const blackLookX = computed(() => {
  if (isError.value) return -5
  if (isSuccess.value) return 4
  return hiding.value ? -4 : isLookingAtEachOther.value ? 0 : undefined
})
const blackLookY = computed(() => {
  if (isError.value) return -5
  if (isSuccess.value) return -4
  return hiding.value ? -4 : isLookingAtEachOther.value ? -4 : undefined
})

const orangeStyle = computed(() => {
  if (isSuccess.value)
    return {
      transform: 'skewX(0deg)',
      animation: 'char-bounce-success 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.04s both',
    }
  return {
    transform: hiding.value ? 'skewX(0deg)' : `skewX(${orangePos.bodySkew}deg)`,
  }
})
const orangeEyesStyle = computed(() => ({
  left: hiding.value ? '50px' : `${82 + orangePos.faceX}px`,
  top: hiding.value ? '85px' : `${90 + orangePos.faceY}px`,
  gap: '32px',
}))

const yellowStyle = computed(() => {
  if (isSuccess.value)
    return {
      transform: 'skewX(0deg)',
      animation: 'char-bounce-success 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.12s both',
    }
  return {
    transform: hiding.value ? 'skewX(0deg)' : `skewX(${yellowPos.bodySkew}deg)`,
  }
})
const yellowEyesStyle = computed(() => ({
  left: hiding.value ? '20px' : `${52 + yellowPos.faceX}px`,
  top: hiding.value ? '35px' : `${40 + yellowPos.faceY}px`,
  gap: '24px',
}))
const yellowMouthStyle = computed(() => {
  if (isSuccess.value)
    return {
      left: '40px',
      top: '88px',
      width: '26px',
      height: '14px',
      background: 'transparent',
      borderBottom: '3px solid #2D2D2D',
      borderRadius: '0 0 50% 50%',
      transform: 'none',
    }
  if (isError.value)
    return {
      left: '40px',
      top: '88px',
      height: '6px',
      transform: 'rotate(-10deg) translateY(-2px)',
      borderRadius: '999px',
    }
  return {
    left: hiding.value ? '10px' : `${40 + yellowPos.faceX}px`,
    top: hiding.value ? '88px' : `${88 + yellowPos.faceY}px`,
    height: '4px',
    transform: 'none',
    borderRadius: '4px',
  }
})
</script>

<style scoped>
.characters-container {
  position: relative;
  width: 550px;
  height: 400px;
}

.characters-container.is-error .purple {
  animation: char-shake 0.4s ease-out both;
}

.characters-container.is-error .black {
  animation: char-shake 0.4s ease-out 0.05s both;
}

@keyframes char-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px) rotate(-2deg); }
  40% { transform: translateX(6px) rotate(2deg); }
  60% { transform: translateX(-4px) rotate(-1deg); }
  80% { transform: translateX(4px) rotate(1deg); }
}

@keyframes char-bounce-success {
  0% { transform: translateY(0) scale(1); }
  30% { transform: translateY(-30px) scale(1.08); }
  50% { transform: translateY(-15px) scale(1.04); }
  70% { transform: translateY(-25px) scale(1.06); }
  100% { transform: translateY(0) scale(1); }
}

.char {
  position: absolute;
  bottom: 0;
  transition: all 0.7s ease-in-out;
  transform-origin: bottom center;
}

.purple {
  left: 70px;
  width: 180px;
  background: #6c3ff5;
  border-radius: 10px 10px 0 0;
  z-index: 1;
}

.black {
  left: 240px;
  width: 120px;
  height: 310px;
  background: #2d2d2d;
  border-radius: 8px 8px 0 0;
  z-index: 2;
}

.orange {
  left: 0;
  width: 240px;
  height: 200px;
  background: #ff9b6b;
  border-radius: 120px 120px 0 0;
  z-index: 3;
}

.yellow {
  left: 310px;
  width: 140px;
  height: 230px;
  background: #e8d754;
  border-radius: 70px 70px 0 0;
  z-index: 4;
}

.eyes {
  position: absolute;
  display: flex;
  transition: all 0.7s ease-in-out;
}

.mouth {
  position: absolute;
  width: 80px;
  height: 4px;
  background: #2d2d2d;
  border-radius: 4px;
  transition: all 0.3s ease-out;
}

/* 汗滴 */
.sweat {
  position: absolute;
  width: 6px;
  height: 10px;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  background: #81d4fa;
  opacity: 0.85;
  z-index: 5;
}
.sweat-1 {
  right: 20px;
  top: 20px;
  animation: sweat-drop 0.6s ease-out both;
}
.sweat-2 {
  right: 55px;
  top: 14px;
  animation: sweat-drop 0.6s ease-out 0.15s both;
}

@keyframes sweat-drop {
  0% { transform: translateY(0) scale(0); opacity: 0; }
  40% { transform: translateY(0) scale(1); opacity: 0.85; }
  100% { transform: translateY(12px) scale(0.8); opacity: 0; }
}

/* 庆祝光环 */
.celebrate-ring {
  position: absolute;
  inset: -8px;
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  animation: ring-pulse 0.6s ease-out both;
  pointer-events: none;
}

@keyframes ring-pulse {
  0% { transform: scale(0.9); opacity: 1; }
  100% { transform: scale(1.25); opacity: 0; }
}
</style>
