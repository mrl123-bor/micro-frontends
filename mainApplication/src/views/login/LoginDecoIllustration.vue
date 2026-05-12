<template>
  <aside class="form-wrapper-deco" aria-hidden="true">
    <div class="form-wrapper-deco__backdrop" aria-hidden="true" />
    <div class="form-wrapper-deco__grid" />
    <div class="form-illust-swap">
      <div class="form-illust">
        <div class="form-illust__shadow" />
        <div class="form-illust__pencil">
          <span class="form-illust__pencil-tip" />
          <span class="form-illust__pencil-wood" />
          <span class="form-illust__pencil-body" />
          <span class="form-illust__pencil-eraser" />
        </div>
        <div class="form-illust__girl">
          <div class="form-illust__hair" />
          <div class="form-illust__face">
            <span class="form-illust__glasses" />
            <span class="form-illust__eye form-illust__eye--l" />
            <span class="form-illust__eye form-illust__eye--r" />
            <span class="form-illust__blush form-illust__blush--l" />
            <span class="form-illust__blush form-illust__blush--r" />
          </div>
          <div class="form-illust__shirt" />
          <div class="form-illust__skirt" />
          <div class="form-illust__leg form-illust__leg--l" />
          <div class="form-illust__leg form-illust__leg--r" />
          <div class="form-illust__arm form-illust__arm--wave" />
          <div class="form-illust__pack" />
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.form-wrapper-deco {
  position: relative;
  /* 与表单栏同级，避免整块压盖 .form-stage-blob；透明区可透出圆形背景 */
  z-index: 2;
  flex: 0 0 38.2%;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 18px 14px 20px;
  border-radius: 0;
  overflow: hidden;
  background: transparent;
  border: none;
  box-shadow: none;

  @media (min-width: 1024px) {
    overflow: visible;
    pointer-events: none;
  }
}

.form-wrapper-deco__backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  /* 与 .form-wrapper-frame 同一视觉底，不分左右双色；圆形层可从透明区透出 */
  background: transparent;
  box-shadow: none;

  @at-root html.dark & {
    background: transparent;
    box-shadow: none;
  }
}

.form-wrapper-deco__grid {
  position: absolute;
  inset: 0;
  z-index: 1;
  opacity: 0.42;
  background-image:
    linear-gradient(to right, rgba(148, 163, 184, 0.16) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148, 163, 184, 0.16) 1px, transparent 1px);
  background-size: 22px 22px;
  mask-image: linear-gradient(165deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.38) 55%, rgba(0, 0, 0, 0.2));

  @at-root html.dark & {
    opacity: 0.28;
    background-image:
      linear-gradient(to right, rgba(148, 163, 184, 0.1) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(148, 163, 184, 0.1) 1px, transparent 1px);
  }
}

.form-illust-swap {
  position: relative;
  z-index: 2;
  width: 100%;
  height: min(220px, 100%);
  max-height: 220px;
  margin: 0 auto;
}

.form-illust {
  position: relative;
  z-index: 2;
  width: 100%;
  height: min(220px, 100%);
  max-height: 220px;
  margin: 0 auto;
  animation: form-illust-float 5s ease-in-out infinite;
}

@keyframes form-illust-float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}

@keyframes form-illust-float-mirror {
  0%,
  100% {
    transform: scaleX(-1) translateY(0);
  }

  50% {
    transform: scaleX(-1) translateY(-8px);
  }
}

.form-illust__shadow {
  position: absolute;
  left: 50%;
  bottom: 18px;
  width: 72%;
  height: 22px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(15, 23, 42, 0.22), transparent 70%);
  filter: blur(6px);
}

.form-illust__pencil {
  position: absolute;
  left: 8%;
  bottom: 12%;
  width: 180px;
  height: 22px;
  transform: rotate(-32deg);
  transform-origin: 20% 50%;
}

.form-illust__pencil-tip {
  position: absolute;
  left: 0;
  top: 50%;
  width: 0;
  height: 0;
  margin-top: -8px;
  border-style: solid;
  border-width: 8px 0 8px 14px;
  border-color: transparent transparent transparent #1e293b;
}

.form-illust__pencil-wood {
  position: absolute;
  left: 12px;
  top: 2px;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  background: linear-gradient(180deg, #fde68a, #d97706);
}

.form-illust__pencil-body {
  position: absolute;
  left: 28px;
  top: 0;
  width: 132px;
  height: 22px;
  border-radius: 4px;
  background: linear-gradient(180deg, #fde047, #eab308 45%, #ca8a04);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

.form-illust__pencil-eraser {
  position: absolute;
  right: 0;
  top: 1px;
  width: 22px;
  height: 20px;
  border-radius: 4px;
  background: linear-gradient(180deg, #fbcfe8, #f472b6);
}

.form-illust__girl {
  position: absolute;
  right: 6%;
  bottom: 14%;
  width: 120px;
  height: 200px;
}

.form-illust__hair {
  position: absolute;
  left: 18px;
  top: 0;
  width: 78px;
  height: 64px;
  border-radius: 40px 48px 36px 36px;
  background: linear-gradient(145deg, #78350f, #451a03);
  z-index: 1;
}

.form-illust__face {
  position: absolute;
  left: 22px;
  top: 28px;
  width: 64px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(180deg, #ffe4d5, #fdba74);
  z-index: 2;
  box-shadow: 0 4px 12px rgba(120, 53, 15, 0.15);
}

.form-illust__glasses {
  position: absolute;
  left: 8px;
  top: 22px;
  width: 48px;
  height: 18px;
  border: 3px solid #0f172a;
  border-radius: 10px;
  box-shadow:
    inset 0 0 0 2px rgba(255, 255, 255, 0.35),
    0 0 0 1px rgba(15, 23, 42, 0.2);

  &::before {
    content: '';
    position: absolute;
    left: 50%;
    top: -3px;
    width: 4px;
    height: 10px;
    margin-left: -2px;
    background: #0f172a;
    border-radius: 2px;
  }
}

.form-illust__eye {
  position: absolute;
  top: 28px;
  width: 8px;
  height: 10px;
  border-radius: 50%;
  background: #0f172a;
}

.form-illust__eye--l {
  left: 16px;
}

.form-illust__eye--r {
  right: 16px;
}

.form-illust__blush {
  position: absolute;
  top: 38px;
  width: 12px;
  height: 6px;
  border-radius: 50%;
  background: rgba(251, 113, 133, 0.45);
  filter: blur(1px);
}

.form-illust__blush--l {
  left: 10px;
}

.form-illust__blush--r {
  right: 10px;
}

.form-illust__shirt {
  position: absolute;
  left: 24px;
  top: 78px;
  width: 56px;
  height: 44px;
  border-radius: 14px 14px 8px 8px;
  background: linear-gradient(180deg, #fef08a, #eab308);
  z-index: 1;
}

.form-illust__skirt {
  position: absolute;
  left: 18px;
  top: 118px;
  width: 0;
  height: 0;
  border-left: 34px solid transparent;
  border-right: 34px solid transparent;
  border-top: 52px solid #2563eb;
  filter: drop-shadow(0 6px 8px rgba(37, 99, 235, 0.25));
  z-index: 1;
}

.form-illust__leg {
  position: absolute;
  top: 168px;
  width: 14px;
  height: 36px;
  border-radius: 6px;
  background: linear-gradient(180deg, #fef9c3, #fde047);
  z-index: 0;
}

.form-illust__leg--l {
  left: 32px;
}

.form-illust__leg--r {
  right: 36px;
}

.form-illust__arm {
  position: absolute;
  z-index: 3;
}

.form-illust__arm--wave {
  right: -4px;
  top: 86px;
  width: 12px;
  height: 44px;
  border-radius: 8px;
  background: linear-gradient(180deg, #ffe4d5, #fdba74);
  transform: rotate(28deg);
  transform-origin: 50% 0;
  animation: form-illust-wave 2.4s ease-in-out infinite;
}

@keyframes form-illust-wave {
  0%,
  100% {
    transform: rotate(22deg);
  }

  50% {
    transform: rotate(38deg);
  }
}

.form-illust__pack {
  position: absolute;
  right: 4px;
  top: 92px;
  width: 28px;
  height: 56px;
  border-radius: 10px 10px 8px 8px;
  background: linear-gradient(145deg, #f9a8d4, #ec4899);
  z-index: 0;
  box-shadow: -2px 4px 10px rgba(236, 72, 153, 0.25);
}

@media (prefers-reduced-motion: reduce) {
  .form-illust {
    animation: none;
  }

  .form-illust__arm--wave {
    animation: none;
  }
}
</style>
