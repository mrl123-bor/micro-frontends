<template>
  <div class="login-bg-effects" aria-hidden="true">
    <div class="bg-mesh">
      <span class="mesh-blob mesh-blob-1" />
      <span class="mesh-blob mesh-blob-2" />
      <span class="mesh-blob mesh-blob-3" />
      <span class="mesh-blob mesh-blob-4" />
    </div>
    <div class="bg-particles">
      <span v-for="i in 16" :key="'p' + i" class="bg-particle" :style="{ '--pi': i }" />
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 脱离 .login-page 双栏网格占位，避免与左右栏挤成多格 */
.login-bg-effects {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-mesh {
  position: fixed;
  inset: 0;
  z-index: -3;
  pointer-events: none;
  overflow: hidden;
}

.mesh-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.28;
}

.mesh-blob-1 {
  width: 50vw;
  height: 50vw;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.3), transparent 70%);
  left: -10%;
  top: -20%;
  animation: mesh-drift-1 18s ease-in-out infinite;
}

.mesh-blob-2 {
  width: 40vw;
  height: 40vw;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.22), transparent 70%);
  right: -5%;
  bottom: -15%;
  animation: mesh-drift-2 22s ease-in-out infinite;
}

.mesh-blob-3 {
  width: 35vw;
  height: 35vw;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.2), transparent 70%);
  left: 40%;
  top: 40%;
  animation: mesh-drift-3 25s ease-in-out infinite;
}

.mesh-blob-4 {
  width: 30vw;
  height: 30vw;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.12), transparent 70%);
  right: 20%;
  top: 10%;
  animation: mesh-drift-4 20s ease-in-out infinite reverse;
}

@keyframes mesh-drift-1 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(8vw, 6vh) scale(1.2);
  }
  66% {
    transform: translate(-4vw, -4vh) scale(0.85);
  }
}

@keyframes mesh-drift-2 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(-6vw, -8vh) scale(1.15);
  }
  66% {
    transform: translate(4vw, 4vh) scale(0.9);
  }
}

@keyframes mesh-drift-3 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(-5vw, 5vh) scale(1.3);
  }
  66% {
    transform: translate(5vw, -3vh) scale(0.8);
  }
}

@keyframes mesh-drift-4 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(3vw, -6vh) scale(1.25);
  }
  66% {
    transform: translate(-6vw, 2vh) scale(0.85);
  }
}

.bg-particles {
  position: fixed;
  inset: 0;
  z-index: -2;
  pointer-events: none;
  overflow: hidden;
}

.bg-particle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(
    circle at 40% 40%,
    rgba(255, 255, 255, 0.16),
    rgba(255, 255, 255, 0.03) 60%,
    transparent 100%
  );

  width: calc(3px + var(--pi) * 1px);
  height: calc(3px + var(--pi) * 1px);
  left: calc(var(--pi) * 6.2%);
  top: calc(var(--pi) * 5.8% + 5%);
  animation: particle-float calc(10s + var(--pi) * 1.5s) ease-in-out infinite;
  animation-delay: calc(var(--pi) * -0.8s);
  opacity: 0;
  box-shadow: 0 0 calc(4px + var(--pi) * 2px) rgba(255, 255, 255, 0.15);

  @at-root html.dark & {
    background: radial-gradient(
      circle at 40% 40%,
      rgba(255, 255, 255, 0.1),
      rgba(255, 255, 255, 0.02) 60%,
      transparent 100%
    );
    box-shadow: 0 0 calc(4px + var(--pi) * 2px) rgba(255, 255, 255, 0.08);
  }
}

@keyframes particle-float {
  0%,
  100% {
    transform: translateY(0) translateX(0) scale(0.6);
    opacity: 0;
  }
  10% {
    opacity: 0.7;
  }
  30% {
    transform: translateY(-40px) translateX(12px) scale(1.3);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-20px) translateX(-8px) scale(0.9);
    opacity: 0.35;
  }
  70% {
    transform: translateY(-55px) translateX(6px) scale(1.4);
    opacity: 0.45;
  }
  85% {
    opacity: 0.1;
  }
  100% {
    transform: translateY(-70px) translateX(-3px) scale(0.5);
    opacity: 0;
  }
}
</style>
