<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from '@/utils/toast'
import { CopyDocument, Key, RefreshRight } from '@element-plus/icons-vue'
import SimplePage from '@/views/common/SimplePage.vue'
import AvatarCropDialog from '@/components/profile/AvatarCropDialog.vue'
import GlassFormDialog from '@/components/GlassFormDialog.vue'
import * as authApi from '@/api/auth'
import * as userApi from '@/api/user'
import { useAuthStore } from '@/stores/auth'
import { formatDateTimeLocal } from '@/utils/formatDateTime'
import { resolvePublicFileUrl } from '@/utils/publicUrl'

type ProfileResp = Awaited<ReturnType<typeof authApi.getProfile>>

const { t } = useI18n()
const authStore = useAuthStore()
const loading = ref(false)
const profile = ref<ProfileResp | null>(null)
const saving = ref(false)
const pwdVisible = ref(false)
const pwdSaving = ref(false)

const form = ref({
  nickName: '',
  phonenumber: '',
  email: '',
})

const pwdForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmNewPassword: '',
})

const avatarCropOpen = ref(false)
/** 从头像区拖入/粘贴后交给裁剪弹窗 */
const pendingAvatarFile = ref<File | null>(null)
const avatarDragOver = ref(false)

const AVATAR_IMAGE_RE = /^image\/(jpeg|png|webp|gif)$/i

function openAvatarCrop() {
  avatarCropOpen.value = true
}

function setPendingAvatarAndOpen(file: File | undefined | null) {
  if (!file || !AVATAR_IMAGE_RE.test(file.type)) {
    toast.warning(t('pages.profile.avatarPickImage'))
    return
  }
  pendingAvatarFile.value = file
  avatarCropOpen.value = true
}

function onAvatarDrop(e: DragEvent) {
  e.preventDefault()
  avatarDragOver.value = false
  setPendingAvatarAndOpen(e.dataTransfer?.files?.[0] ?? null)
}

function onAvatarDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
}

function onAvatarDragLeave(e: DragEvent) {
  const cur = e.currentTarget as HTMLElement
  const rel = e.relatedTarget as Node | null
  if (rel && cur.contains(rel)) return
  avatarDragOver.value = false
}

function onAvatarPaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items?.length) return
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    if (it.kind === 'file' && it.type.startsWith('image/')) {
      const f = it.getAsFile()
      if (f) {
        e.preventDefault()
        setPendingAvatarAndOpen(f)
        return
      }
    }
  }
}

const TIP_KEYS = [
  'pages.profile.tip1',
  'pages.profile.tip2',
  'pages.profile.tip3',
  'pages.profile.tip4',
  'pages.profile.tip5',
] as const
const tipIndex = ref(0)

const greetTick = ref(0)
const greetingLabel = computed(() => {
  greetTick.value
  const h = new Date().getHours()
  if (h < 12) return t('pages.profile.greetMorning')
  if (h < 18) return t('pages.profile.greetAfternoon')
  return t('pages.profile.greetEvening')
})

function nextTip() {
  tipIndex.value = (tipIndex.value + 1) % TIP_KEYS.length
}

const now = ref(new Date())
const clockTime = computed(() =>
  now.value.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }),
)
const clockDate = computed(() =>
  now.value.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
)
const clockIso = computed(() => {
  const d = now.value
  const z = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`
})

const user = computed(() => (profile.value?.user ?? {}) as Record<string, unknown>)
const roles = computed(() => profile.value?.roles ?? [])
const perms = computed(() => profile.value?.permissions ?? [])
const isSuperAdmin = computed(() => !!profile.value?.isSuperAdmin)
const activeTab = ref<'basic' | 'security'>('basic')

const initials = computed(() => {
  const n = (authStore.nickName || authStore.userName || t('pages.profile.me')).trim()
  return (n ? n.slice(0, 1) : 'U').toUpperCase()
})

const avatarSrc = computed(() =>
  resolvePublicFileUrl((user.value.avatar as string | undefined) || ''),
)

async function copyText(v: unknown) {
  const s = String(v ?? '')
  if (!s) return
  try {
    await navigator.clipboard.writeText(s)
    toast.success(t('common.copied'))
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = s
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      toast.success(t('common.copied'))
    } catch {
      toast.error(t('common.opFail'))
    }
  }
}

async function load() {
  loading.value = true
  try {
    profile.value = await authApi.getProfile()
    form.value.nickName = String((profile.value.user as any)?.nickName ?? '')
    form.value.phonenumber = String((profile.value.user as any)?.phonenumber ?? '')
    form.value.email = String((profile.value.user as any)?.email ?? '')
    const av = (profile.value.user as { avatar?: string } | undefined)?.avatar
    if (av) authStore.setAvatar(String(av))
  } finally {
    loading.value = false
  }
}

function onAvatarSaved(avatarPath?: string) {
  if (avatarPath) authStore.setAvatar(avatarPath)
  void load()
}

async function onSaveProfile() {
  saving.value = true
  try {
    await userApi.updateMyProfile({
      nickName: form.value.nickName,
      phonenumber: form.value.phonenumber,
      email: form.value.email,
    })
    toast.success(t('common.saveOk'))
    // 同步顶部昵称展示
    authStore.nickName = form.value.nickName
    await load()
  } finally {
    saving.value = false
  }
}

function openPwd() {
  pwdForm.value = { oldPassword: '', newPassword: '', confirmNewPassword: '' }
  pwdVisible.value = true
}

async function onSavePwd() {
  if (!pwdForm.value.newPassword || pwdForm.value.newPassword.length < 6) {
    toast.error(t('pages.profile.pwdMin'))
    return
  }
  if (pwdForm.value.newPassword !== pwdForm.value.confirmNewPassword) {
    toast.error(t('pages.profile.pwdMismatch'))
    return
  }
  pwdSaving.value = true
  try {
    await userApi.updateMyPassword({
      oldPassword: pwdForm.value.oldPassword,
      newPassword: pwdForm.value.newPassword,
    })
    toast.success(t('pages.profile.pwdOkRelogin'))
    pwdVisible.value = false
    await authStore.logout()
  } finally {
    pwdSaving.value = false
  }
}

let greetInterval: number | undefined
let clockInterval: number | undefined
onMounted(() => {
  load()
  greetInterval = window.setInterval(() => {
    greetTick.value++
  }, 60_000)
  clockInterval = window.setInterval(() => {
    now.value = new Date()
  }, 1000)
})
onUnmounted(() => {
  if (greetInterval !== undefined) clearInterval(greetInterval)
  if (clockInterval !== undefined) clearInterval(clockInterval)
})
</script>

<template>
  <SimplePage :title="t('pages.profile.title')" :subtitle="t('pages.profile.subtitle')">
    <el-skeleton :loading="loading" animated>
      <template #default>
        <div class="biz">
          <div class="biz-grid">
            <el-card shadow="never" class="biz-left">
              <div class="biz-cardHead">
                <div
                  class="biz-avatar biz-avatar--interactive"
                  :class="{ 'is-drag-over': avatarDragOver }"
                  role="button"
                  tabindex="0"
                  :title="t('pages.profile.avatarCardHint')"
                  @click="openAvatarCrop"
                  @keydown.enter.prevent="openAvatarCrop"
                  @keydown.space.prevent="openAvatarCrop"
                  @drop.prevent="onAvatarDrop"
                  @dragover="onAvatarDragOver"
                  @dragenter.prevent="avatarDragOver = true"
                  @dragleave="onAvatarDragLeave"
                  @paste="onAvatarPaste"
                >
                  <img v-if="avatarSrc" :src="avatarSrc" alt="" />
                  <div v-else class="biz-avatar__fallback">{{ initials }}</div>
                  <div class="biz-avatar__mask" aria-hidden="true">
                    <span>{{ t('pages.profile.avatarEdit') }}</span>
                  </div>
                </div>
                <div class="biz-cardMeta">
                  <div class="biz-cardName">
                    <span class="name">{{ authStore.nickName || authStore.userName || t('common.dash') }}</span>
                    <el-tag v-if="isSuperAdmin" type="warning" size="small" effect="plain">
                      {{ t('pages.profile.superAdmin') }}
                    </el-tag>
                  </div>
                  <div class="biz-cardSub">
                    <span class="k">{{ t('pages.profile.accountColon') }}</span>
                    <span class="v">{{ authStore.userName || t('common.dash') }}</span>
                    <el-button v-if="authStore.userName" text class="biz-icoBtn" @click="copyText(authStore.userName)">
                      <el-icon><CopyDocument /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>

              <div class="biz-kv">
                <div class="row">
                  <div class="k">{{ t('pages.profile.userId') }}</div>
                  <div class="v">
                    {{ (user.userId as number | undefined) ?? t('common.dash') }}
                    <el-button v-if="user.userId != null" text class="biz-icoBtn" @click="copyText(user.userId)">
                      <el-icon><CopyDocument /></el-icon>
                    </el-button>
                  </div>
                </div>
                <div class="row">
                  <div class="k">{{ t('pages.profile.loginTime') }}</div>
                  <div class="v">
                    {{ formatDateTimeLocal(user.loginDate) || t('common.dash') }}
                  </div>
                </div>
                <div class="row">
                  <div class="k">{{ t('pages.profile.roles') }}</div>
                  <div class="v">{{ roles.length }}</div>
                </div>
                <div class="row">
                  <div class="k">{{ t('pages.profile.perms') }}</div>
                  <div class="v">{{ perms.length }}</div>
                </div>
              </div>

              <div class="biz-divider" />
              <div class="biz-sectionTitle">{{ t('pages.profile.accountInfo') }}</div>
              <div class="biz-kv2 biz-kv2--left">
                <div class="item">
                  <div class="k">{{ t('table.userNameAccount') }}</div>
                  <div class="v">{{ (user.userName as string | undefined) ?? authStore.userName ?? t('common.dash') }}</div>
                </div>
                <div class="item">
                  <div class="k">{{ t('table.nickName') }}</div>
                  <div class="v">{{ (user.nickName as string | undefined) ?? authStore.nickName ?? t('common.dash') }}</div>
                </div>
                <div class="item">
                  <div class="k">{{ t('table.email') }}</div>
                  <div class="v">{{ (user.email as string | undefined) ?? t('common.dash') }}</div>
                </div>
                <div class="item">
                  <div class="k">{{ t('table.phone') }}</div>
                  <div class="v">{{ (user.phonenumber as string | undefined) ?? t('common.dash') }}</div>
                </div>
              </div>
            </el-card>

            <el-card shadow="never" class="biz-right">
              <!-- 资料/安全 与操作按钮同一行：左侧标签、右侧与下方表单右缘对齐 -->
              <div class="biz-tabToolbar" role="tablist">
                <div class="biz-tabNav">
                  <button
                    type="button"
                    role="tab"
                    class="biz-tabBtn"
                    :class="{ 'is-active': activeTab === 'basic' }"
                    :aria-selected="activeTab === 'basic'"
                    @click="activeTab = 'basic'"
                  >
                    {{ t('pages.profile.tabBasic') }}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    class="biz-tabBtn"
                    :class="{ 'is-active': activeTab === 'security' }"
                    :aria-selected="activeTab === 'security'"
                    @click="activeTab = 'security'"
                  >
                    {{ t('pages.profile.tabSecurity') }}
                  </button>
                </div>
                <div class="biz-tabToolbar__actions">
                  <el-button
                    v-if="activeTab === 'basic'"
                    type="primary"
                    :loading="saving"
                    @click="onSaveProfile"
                  >
                    {{ t('pages.profile.saveProfile') }}
                  </el-button>
                  <el-button v-else type="primary" plain @click="openPwd">
                    <el-icon><Key /></el-icon>
                    {{ t('pages.profile.changePwd') }}
                  </el-button>
                </div>
              </div>

              <div v-show="activeTab === 'basic'" class="biz-pane" role="tabpanel">
                <div class="biz-sectionTitle">{{ t('pages.profile.basic') }}</div>
                <el-form label-width="76px" class="biz-form">
                  <el-row :gutter="14">
                    <el-col :xs="24" :sm="12">
                      <el-form-item :label="t('table.nickName')">
                        <el-input v-model="form.nickName" maxlength="64" show-word-limit />
                      </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12">
                      <el-form-item :label="t('table.phone')">
                        <el-input v-model="form.phonenumber" maxlength="64" />
                      </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12">
                      <el-form-item :label="t('table.email')">
                        <el-input v-model="form.email" maxlength="128" />
                      </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12">
                      <el-form-item :label="t('table.dept')">
                        <el-input :model-value="(user.dept as any)?.deptName ?? t('common.dash')" disabled />
                      </el-form-item>
                    </el-col>
                  </el-row>
                </el-form>
              </div>

              <div v-show="activeTab === 'security'" class="biz-pane" role="tabpanel">
                <div class="biz-sectionTitle">{{ t('pages.profile.pwdDialog') }}</div>
                <div class="biz-muted">{{ t('pages.profile.securityHint') }}</div>
              </div>

              <!-- 与 Tab 无关：切换资料/安全时仍展示 -->
              <div class="biz-fun">
                <div class="biz-funHero">
                  <div class="biz-funHero__text">
                    <div class="biz-funHero__greet">{{ greetingLabel }}</div>
                    <div class="biz-funHero__sub">{{ t('pages.profile.greetSub') }}</div>
                  </div>
                  <div class="biz-funHero__clockCard" role="timer" :aria-label="t('pages.profile.clockLive')">
                    <svg class="biz-funHero__deco" viewBox="0 0 120 120" aria-hidden="true">
                      <g class="biz-funHero__orbit biz-funHero__orbit--a">
                        <circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" stroke-width="1.2" />
                      </g>
                      <g class="biz-funHero__orbit biz-funHero__orbit--b">
                        <circle
                          cx="60"
                          cy="60"
                          r="34"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.4"
                          stroke-dasharray="5 9"
                        />
                      </g>
                      <g class="biz-funHero__orbit biz-funHero__orbit--c">
                        <circle
                          cx="60"
                          cy="60"
                          r="24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-dasharray="16 36"
                        />
                      </g>
                    </svg>
                    <div class="biz-funHero__clockFace">
                      <div class="biz-funHero__clockLabel">
                        <span class="biz-funHero__pulse" aria-hidden="true" />
                        {{ t('pages.profile.clockLive') }}
                      </div>
                      <time class="biz-funHero__clockTime" :datetime="clockIso">{{ clockTime }}</time>
                      <div class="biz-funHero__clockDate">{{ clockDate }}</div>
                    </div>
                  </div>
                </div>

                <div class="biz-funStack">
                  <div class="biz-funCard">
                    <div class="biz-funCard__head">
                      <span class="biz-funCard__title">{{ t('pages.profile.tipTitle') }}</span>
                      <el-button type="primary" link @click="nextTip">
                        <el-icon class="biz-funCard__ico"><RefreshRight /></el-icon>
                        {{ t('pages.profile.nextTip') }}
                      </el-button>
                    </div>
                    <p class="biz-funTip">{{ t(TIP_KEYS[tipIndex]) }}</p>
                  </div>

                  <div class="biz-funCard">
                    <div class="biz-funCard__title biz-funCard__title--block">{{ t('pages.profile.securityFunTitle') }}</div>
                    <ul class="biz-funList">
                      <li>{{ t('pages.profile.securityFun1') }}</li>
                      <li>{{ t('pages.profile.securityFun2') }}</li>
                      <li>{{ t('pages.profile.securityFun3') }}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </template>
    </el-skeleton>

    <GlassFormDialog
      v-model="pwdVisible"
      :title="t('pages.profile.pwdDialog')"
      width="min(92vw, 420px)"
      :loading="pwdSaving"
      @confirm="onSavePwd"
    >
      <template #subtitle>{{ t('pages.profile.pwdDialogHint') }}</template>
      <el-form label-width="86px">
        <el-form-item :label="t('pages.profile.oldPwd')" required>
          <el-input v-model="pwdForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item :label="t('pages.profile.newPwd')" required>
          <el-input v-model="pwdForm.newPassword" type="password" show-password :placeholder="t('pages.profile.newPwdPh')" />
        </el-form-item>
        <el-form-item :label="t('pages.profile.confirmPwd')" required>
          <el-input
            v-model="pwdForm.confirmNewPassword"
            type="password"
            show-password
            :placeholder="t('pages.profile.confirmPwdPh')"
          />
        </el-form-item>
      </el-form>
    </GlassFormDialog>

    <AvatarCropDialog
      v-model="avatarCropOpen"
      :initial-file="pendingAvatarFile"
      @update:initial-file="pendingAvatarFile = $event"
      @saved="onAvatarSaved"
    />
  </SimplePage>
</template>

<style scoped lang="scss">
.biz {
  width: 100%;
}

.biz-grid {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.biz-left,
.biz-right {
  position: relative;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--admin-border) 85%, var(--el-color-primary) 15%);
  background: linear-gradient(
    165deg,
    var(--admin-surface) 0%,
    color-mix(in srgb, var(--admin-surface) 94%, var(--admin-surface-muted) 6%) 100%
  );
  box-shadow: var(--admin-shadow-soft);
  transition:
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}

.biz-left:hover,
.biz-right:hover {
  border-color: color-mix(in srgb, var(--admin-border-strong) 70%, var(--el-color-primary) 30%);
  box-shadow: var(--admin-shadow-soft), 0 20px 50px rgba(15, 23, 42, 0.045);
}
html.dark .biz-left:hover,
html.dark .biz-right:hover {
  box-shadow: var(--admin-shadow-soft), 0 20px 56px rgba(0, 0, 0, 0.42);
}

.biz-left::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 3px;
  border-radius: 0 4px 4px 0;
  background: linear-gradient(
    180deg,
    var(--el-color-primary) 0%,
    color-mix(in srgb, var(--el-color-primary-light-3) 85%, var(--el-color-primary)) 100%
  );
  opacity: 0.85;
  pointer-events: none;
}

.biz-left :deep(.el-card__body),
.biz-right :deep(.el-card__body) {
  padding: 18px 18px 20px;
}

.biz-cardHead {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  padding-bottom: 16px;
  margin-bottom: 2px;
  border-bottom: 1px solid transparent;
  background: linear-gradient(var(--admin-border), var(--admin-border)) bottom / 100% 1px no-repeat;
}

.biz-avatar {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--admin-border-strong) 75%, var(--el-color-primary) 25%);
  background: color-mix(in srgb, var(--admin-surface-muted) 80%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent),
    0 8px 20px color-mix(in srgb, var(--el-color-primary) 14%, transparent);
}
.biz-avatar--interactive {
  position: relative;
  cursor: pointer;
  outline: none;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.biz-avatar--interactive.is-drag-over {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 35%, transparent);
}

.biz-avatar--interactive:hover,
.biz-avatar--interactive:focus-visible {
  transform: scale(1.04);
  box-shadow: 0 8px 22px rgba(64, 158, 255, 0.28);
}
.biz-avatar__mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.72) 100%);
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}
.biz-avatar--interactive:hover .biz-avatar__mask,
.biz-avatar--interactive:focus-visible .biz-avatar__mask {
  opacity: 1;
}
.biz-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.biz-avatar__fallback {
  font-weight: 900;
  font-size: 22px;
  color: #fff;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.92), rgba(91, 92, 240, 0.78));
}

.biz-cardName {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}
.biz-cardName .name {
  font-weight: 800;
  font-size: 17px;
  letter-spacing: -0.02em;
  color: var(--admin-text);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.biz-cardSub {
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--admin-text-secondary);
  font-size: 12px;
}
.biz-cardSub .v {
  color: var(--admin-text);
  font-weight: 700;
}

.biz-icoBtn {
  padding: 0 6px !important;
  height: 22px !important;
  border-radius: 10px !important;
}

.biz-kv {
  padding: 14px 0 10px;
  display: grid;
  gap: 6px;
}
.biz-kv .row {
  display: grid;
  grid-template-columns: 78px 1fr;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  margin: 0 -6px;
  border-radius: 12px;
  transition: background 0.18s ease;
}
.biz-kv .row:hover {
  background: color-mix(in srgb, var(--admin-surface-muted) 65%, transparent);
}
.biz-kv .k {
  font-size: 12px;
  color: var(--admin-text-secondary);
}
.biz-kv .v {
  font-size: 12px;
  color: var(--admin-text);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-start;
  word-break: break-all;
}

.biz-actions {
  margin-top: 4px;
  display: grid;
  gap: 10px;
}

.biz-tabToolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px 16px;
  flex-wrap: wrap;
  margin: -2px 0 18px;
  padding-bottom: 0;
  border-bottom: none;
}
.biz-tabNav {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  padding: 5px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--admin-surface-muted) 88%, var(--el-color-primary) 12%);
  box-shadow: inset 0 1px 0 color-mix(in srgb, #fff 55%, transparent);
}
html.dark .biz-tabNav {
  box-shadow: inset 0 1px 0 color-mix(in srgb, #fff 6%, transparent);
}
.biz-tabBtn {
  position: relative;
  margin: 0;
  padding: 8px 18px;
  border: none;
  background: transparent;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--admin-text-secondary);
  cursor: pointer;
  border-radius: 10px;
  transition:
    color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}
.biz-tabBtn:hover {
  color: var(--el-color-primary);
}
.biz-tabBtn:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
  border-radius: 10px;
}
.biz-tabBtn.is-active {
  color: var(--el-color-primary);
  background: var(--admin-surface);
  box-shadow:
    0 1px 3px rgba(15, 23, 42, 0.07),
    0 0 0 1px color-mix(in srgb, var(--admin-border-strong) 55%, transparent);
}
html.dark .biz-tabBtn.is-active {
  box-shadow:
    0 2px 10px rgba(0, 0, 0, 0.28),
    0 0 0 1px var(--admin-border-strong);
}
.biz-tabToolbar__actions {
  flex-shrink: 0;
  padding-bottom: 0;
}
.biz-tabToolbar__actions :deep(.el-button) {
  border-radius: 11px;
  font-weight: 600;
  padding: 9px 18px;
}
.biz-pane {
  min-height: 0;
}

.biz-fun {
  margin-top: 22px;
  padding-top: 20px;
  border-top: none;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--el-color-primary) 35%, transparent) 0%,
    color-mix(in srgb, var(--admin-border) 90%, transparent) 28%,
    color-mix(in srgb, var(--admin-border) 90%, transparent) 100%
  );
  background-size: 100% 1px;
  background-repeat: no-repeat;
  background-position: top;
}

.biz-funHero {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--admin-border) 78%, var(--el-color-primary) 22%);
  background:
    radial-gradient(
      120% 80% at 100% 0%,
      color-mix(in srgb, var(--el-color-primary) 14%, transparent),
      transparent 55%
    ),
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--admin-surface) 92%, var(--el-color-primary-light-9) 8%) 0%,
      color-mix(in srgb, var(--admin-surface-muted) 40%, transparent) 100%
    );
  margin-bottom: 16px;
  overflow: hidden;
  box-shadow: 0 10px 36px color-mix(in srgb, var(--el-color-primary) 8%, rgba(15, 23, 42, 0.06));
}
html.dark .biz-funHero {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
}
.biz-funHero__text {
  min-width: 0;
}
.biz-funHero__greet {
  font-size: 18px;
  font-weight: 900;
  color: var(--admin-text);
  letter-spacing: 0.02em;
}
.biz-funHero__sub {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--admin-text-secondary);
}
.biz-funHero__clockCard {
  position: relative;
  flex-shrink: 0;
  align-self: center;
  min-width: 148px;
  padding: 12px 14px 12px 16px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--admin-border) 55%, var(--el-color-primary) 45%);
  background: color-mix(in srgb, var(--admin-surface) 82%, #fff 18%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow:
    0 0 0 1px color-mix(in srgb, #fff 70%, transparent) inset,
    0 8px 24px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}
html.dark .biz-funHero__clockCard {
  background: color-mix(in srgb, var(--admin-surface) 75%, var(--admin-surface-muted) 25%);
  box-shadow:
    0 0 0 1px color-mix(in srgb, #fff 8%, transparent) inset,
    0 8px 28px rgba(0, 0, 0, 0.35);
}
.biz-funHero__deco {
  position: absolute;
  right: -18px;
  top: 50%;
  width: 118px;
  height: 118px;
  margin-top: -59px;
  color: var(--el-color-primary);
  opacity: 0.42;
  pointer-events: none;
}
.biz-funHero__orbit {
  transform-origin: 60px 60px;
}
.biz-funHero__orbit--a {
  animation: bizOrbit 26s linear infinite;
  opacity: 0.35;
}
.biz-funHero__orbit--b {
  animation: bizOrbit 17s linear infinite reverse;
  opacity: 0.55;
}
.biz-funHero__orbit--c {
  animation: bizOrbit 11s linear infinite;
  opacity: 0.75;
}
@keyframes bizOrbit {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .biz-funHero__orbit--a,
  .biz-funHero__orbit--b,
  .biz-funHero__orbit--c {
    animation: none;
  }
  .biz-funHero__pulse {
    animation: none;
  }
}
.biz-funHero__clockFace {
  position: relative;
  z-index: 1;
  text-align: right;
}
.biz-funHero__clockLabel {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--admin-text-secondary);
  margin-bottom: 4px;
}
.biz-funHero__pulse {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-success);
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--el-color-success) 45%, transparent);
  animation: bizPulse 2.2s ease-in-out infinite;
}
@keyframes bizPulse {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
    box-shadow: 0 0 0 0 transparent;
  }
  50% {
    opacity: 1;
    transform: scale(1.12);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-success) 25%, transparent);
  }
}
.biz-funHero__clockTime {
  display: block;
  font-size: 22px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  color: var(--admin-text);
  line-height: 1.15;
}
.biz-funHero__clockDate {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--admin-text-secondary);
  max-width: 200px;
  margin-left: auto;
}

.biz-funStack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.biz-funCard {
  border: 1px solid color-mix(in srgb, var(--admin-border) 88%, var(--el-color-primary) 12%);
  border-radius: 16px;
  padding: 14px 16px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--admin-surface) 96%, var(--el-color-primary-light-9) 4%) 0%,
    var(--admin-surface) 100%
  );
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}
.biz-funCard:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 32%, var(--admin-border));
  box-shadow: 0 8px 28px color-mix(in srgb, var(--el-color-primary) 7%, rgba(15, 23, 42, 0.06));
  transform: translateY(-1px);
}
@media (prefers-reduced-motion: reduce) {
  .biz-funCard:hover {
    transform: none;
  }
}
.biz-funCard__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.biz-funCard__title {
  font-size: 13px;
  font-weight: 800;
  color: var(--admin-text);
}
.biz-funCard__title--block {
  display: block;
  margin-bottom: 10px;
}
.biz-funCard__ico {
  margin-right: 4px;
  vertical-align: text-bottom;
}
.biz-funTip {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--admin-text-secondary);
}
.biz-funList {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.65;
  color: var(--admin-text-secondary);
}
.biz-funList li + li {
  margin-top: 6px;
}

@media (max-width: 640px) {
  .biz-funHero {
    flex-direction: column;
    align-items: stretch;
  }
  .biz-funHero__clockCard {
    align-self: stretch;
    min-width: 0;
  }
  .biz-funHero__clockFace {
    text-align: left;
  }
  .biz-funHero__clockLabel {
    justify-content: flex-start;
  }
  .biz-funHero__clockDate {
    margin-left: 0;
    max-width: none;
  }
}

.biz-sectionTitle {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--admin-text);
  margin-bottom: 14px;
}
.biz-sectionTitle::before {
  content: '';
  width: 3px;
  height: 14px;
  border-radius: 3px;
  background: linear-gradient(
    180deg,
    var(--el-color-primary),
    color-mix(in srgb, var(--el-color-primary-light-3) 90%, var(--el-color-primary))
  );
  flex-shrink: 0;
}
.biz-muted {
  color: var(--admin-text-secondary);
  font-size: 13px;
  margin-bottom: 12px;
}
.biz-form :deep(.el-form-item) {
  margin-bottom: 14px;
}
.biz-form :deep(.el-input__wrapper) {
  border-radius: 11px;
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
  transition: box-shadow 0.2s ease;
}
.biz-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 35%, var(--el-border-color)) inset;
}
.biz-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}
.biz-divider {
  height: 1px;
  background: var(--admin-border);
  margin: 2px 0 14px;
}
.biz-kv2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.biz-kv2--left {
  grid-template-columns: 1fr;
}
.biz-kv2 .item {
  border: none;
  border-radius: 14px;
  padding: 12px 14px;
  background: color-mix(in srgb, var(--admin-surface-muted) 78%, var(--el-color-primary-light-9) 22%);
  box-shadow:
    0 1px 0 color-mix(in srgb, #fff 80%, transparent) inset,
    0 4px 14px rgba(15, 23, 42, 0.04);
  transition: box-shadow 0.2s ease;
}
html.dark .biz-kv2 .item {
  box-shadow:
    0 1px 0 color-mix(in srgb, #fff 6%, transparent) inset,
    0 4px 18px rgba(0, 0, 0, 0.2);
}
.biz-kv2 .item:hover {
  box-shadow:
    0 1px 0 color-mix(in srgb, #fff 80%, transparent) inset,
    0 6px 20px color-mix(in srgb, var(--el-color-primary) 9%, rgba(15, 23, 42, 0.06));
}
.biz-kv2 .k {
  font-size: 12px;
  color: var(--admin-text-secondary);
}
.biz-kv2 .v {
  margin-top: 6px;
  font-size: 13px;
  font-weight: 800;
  color: var(--admin-text);
  word-break: break-all;
}

.biz-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.biz-tags--scroll {
  max-height: 360px;
  overflow: auto;
  padding-right: 4px;
}
.biz-empty {
  color: var(--admin-text-muted);
  font-size: 13px;
}

@media (max-width: 960px) {
  .biz-grid {
    grid-template-columns: 1fr;
  }
  .biz-kv2 {
    grid-template-columns: 1fr;
  }
}

</style>

