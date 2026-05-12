/** 与 preview-vue3 一致：用于视频初始宽度（桌面约 60% 视口） */
export const DEVICE_TYPE = {
  DESKTOP: 'desktop',
  TABLET: 'tablet',
  MOBILE: 'mobile',
} as const

export function getPreviewDeviceType(): (typeof DEVICE_TYPE)[keyof typeof DEVICE_TYPE] {
  if (typeof window === 'undefined' || !window.matchMedia) return DEVICE_TYPE.DESKTOP
  if (window.matchMedia('(max-width: 576px)').matches) return DEVICE_TYPE.MOBILE
  if (window.matchMedia('(max-width: 1199px)').matches) return DEVICE_TYPE.TABLET
  return DEVICE_TYPE.DESKTOP
}
