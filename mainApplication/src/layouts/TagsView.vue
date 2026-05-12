<script setup lang="ts">
import { ref, watch, onMounted, nextTick, inject } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import {
  Close,
  DArrowLeft,
  DArrowRight,
  Delete,
  Grid,
  RefreshRight,
  StarFilled,
} from '@element-plus/icons-vue'
import {
  coreLayoutChildren,
  layoutChildren,
} from '@/router/routes'
import { usePermissionStore } from '@/stores/permission'
import { useDynamicRoutesStore } from '@/stores/dynamic-routes'
import { recordAccessible } from '@/utils/routeAccess'
import { useI18n } from 'vue-i18n'
import type { DropdownInstance } from 'element-plus'
import { ROUTE_NAMES } from '@/constants/route-names'

export interface TagItem {
  fullPath: string
  title: string
  affix?: boolean
  /** 有则优先按 `route.${name}` 翻译，否则用 title（常为后端中文） */
  routeName?: string
}

const route = useRoute()
const router = useRouter()
const { t, te } = useI18n()
const reloadMainView = inject<(() => void) | undefined>('reloadMainView', undefined)
const permissionStore = usePermissionStore()
const dynamicStore = useDynamicRoutesStore()
const { loaded: dynamicLoaded, layoutAddons } = storeToRefs(dynamicStore)

const visitedTags = ref<TagItem[]>([])

function queryText(v: unknown): string {
  if (Array.isArray(v)) return String(v[0] ?? '').trim()
  return String(v ?? '').trim()
}

function compactLabel(input: string, max = 18): string {
  const text = input.trim()
  if (text.length <= max) return text
  return `${text.slice(0, max)}...`
}

function buildDynamicTagTitle(baseTitle: string): string {
  const routeName = String(route.name ?? '')
  if (routeName === 'DesignEdit' || routeName === 'DesignEditH5') {
    const tplName = queryText(route.query.name)
    if (tplName) return `${baseTitle} · ${compactLabel(tplName)}`
    const raw = String(route.params.tableId ?? '').trim()
    const tableId = /^nan$/i.test(raw) ? 'NAN' : raw
    if (tableId === 'NAN') return `${baseTitle} · 新建`
    if (tableId) return `${baseTitle} · #${tableId}`
  }
  return baseTitle
}

function tagDisplayTitle(tag: TagItem): string {
  const name = tag.routeName
  const key = name ? `route.${name}` : ''
  if (key && te(key)) return t(key)
  return tag.title
}

function menuRecordsForTags(): RouteRecordRaw[] {
  if (permissionStore.source === 'api') {
    return [
      ...coreLayoutChildren,
      ...(dynamicLoaded.value ? layoutAddons.value : []),
    ]
  }
  return layoutChildren
}

function collectAffixTags(): TagItem[] {
  const out: TagItem[] = []
  const roleList = permissionStore.roles
  const walk = (records: RouteRecordRaw[]) => {
    for (const r of records) {
      if (r.meta?.affix && r.meta?.title && r.name != null) {
        if (
          !recordAccessible(r, roleList, (c) => permissionStore.hasAnyPerm(c))
        )
          continue
        const { fullPath } = router.resolve({ name: r.name as string })
        out.push({
          fullPath,
          title: String(r.meta.title),
          affix: true,
          routeName: String(r.name),
        })
      }
      if (r.children?.length) walk(r.children)
    }
  }
  walk(menuRecordsForTags())
  return out
}

function addCurrentTag() {
  if (route.meta?.noTags) return

  /** hidden 仅表示侧栏不展示（如 nest-admin 分配角色/分配用户）；标签栏仍应显示 */
  const leaf = [...route.matched]
    .reverse()
    .find((m) => m.meta?.title && !m.meta.noTags)
  if (!leaf?.meta?.title) return

  const title = buildDynamicTagTitle(String(leaf.meta.title))
  const affix = !!leaf.meta.affix
  const routeName =
    leaf.name != null && leaf.name !== '' ? String(leaf.name) : undefined
  const { fullPath } = route

  if (visitedTags.value.some((t) => t.fullPath === fullPath)) return

  visitedTags.value.push({
    fullPath,
    title,
    affix,
    routeName,
  })
}

onMounted(() => {
  visitedTags.value = [...collectAffixTags()]
  addCurrentTag()
})

watch(() => route.fullPath, addCurrentTag)

watch(
  () =>
    `${permissionStore.roles.join('\0')}\0${permissionStore.perms.join('\0')}\0${dynamicLoaded.value}`,
  () => {
    visitedTags.value = [...collectAffixTags()]
    if (permissionStore.canAccessRoute(route)) {
      addCurrentTag()
    } else {
      router.replace({ name: ROUTE_NAMES.dashboard })
    }
  },
)

function isActive(tag: TagItem) {
  return tag.fullPath === route.fullPath
}

function toTag(tag: TagItem) {
  if (tag.fullPath !== route.fullPath) {
    router.push(tag.fullPath)
  }
}

function closeTag(tag: TagItem) {
  if (tag.affix) return
  const idx = visitedTags.value.findIndex((t) => t.fullPath === tag.fullPath)
  if (idx === -1) return
  const wasActive = isActive(tag)
  visitedTags.value.splice(idx, 1)
  if (wasActive) {
    const next = visitedTags.value[idx] ?? visitedTags.value[idx - 1]
    if (next) {
      router.push(next.fullPath)
    } else {
      router.push({ name: ROUTE_NAMES.dashboard })
    }
  }
}

function tagIndex(tag: TagItem) {
  return visitedTags.value.findIndex((t) => t.fullPath === tag.fullPath)
}

function canCloseOthers(tag: TagItem) {
  return visitedTags.value.some(
    (t) => !t.affix && t.fullPath !== tag.fullPath,
  )
}

function canCloseLeft(tag: TagItem) {
  const i = tagIndex(tag)
  if (i <= 0) return false
  return visitedTags.value.slice(0, i).some((t) => !t.affix)
}

function canCloseRight(tag: TagItem) {
  const i = tagIndex(tag)
  if (i === -1 || i >= visitedTags.value.length - 1) return false
  return visitedTags.value.slice(i + 1).some((t) => !t.affix)
}

function canCloseAll() {
  return visitedTags.value.some((t) => !t.affix)
}

function refreshTag(tag: TagItem) {
  if (!reloadMainView) return
  if (route.fullPath !== tag.fullPath) {
    router.push(tag.fullPath).then(() => nextTick(() => reloadMainView()))
  } else {
    nextTick(() => reloadMainView())
  }
}

function closeOthers(tag: TagItem) {
  const fp = route.fullPath
  visitedTags.value = visitedTags.value.filter(
    (t) => t.affix || t.fullPath === tag.fullPath,
  )
  if (!visitedTags.value.some((t) => t.fullPath === fp)) {
    router.push(tag.fullPath)
  }
}

function closeLeft(tag: TagItem) {
  const i = tagIndex(tag)
  if (i <= 0) return
  const fp = route.fullPath
  visitedTags.value = visitedTags.value.filter((t, idx) => {
    if (idx >= i) return true
    return !!t.affix
  })
  if (!visitedTags.value.some((t) => t.fullPath === fp)) {
    router.push(tag.fullPath)
  }
}

function closeRight(tag: TagItem) {
  const i = tagIndex(tag)
  if (i === -1 || i >= visitedTags.value.length - 1) return
  const fp = route.fullPath
  visitedTags.value = visitedTags.value.filter((t, idx) => {
    if (idx <= i) return true
    return !!t.affix
  })
  if (!visitedTags.value.some((t) => t.fullPath === fp)) {
    router.push(tag.fullPath)
  }
}

function closeAll() {
  const fp = route.fullPath
  visitedTags.value = visitedTags.value.filter((t) => t.affix)
  if (!visitedTags.value.some((t) => t.fullPath === fp)) {
    const first = visitedTags.value[0]
    router.push(first?.fullPath ?? '/dashboard')
  }
}

const tagDropdownRefs = new Map<string, DropdownInstance>()

function setTagDropdownRef(el: unknown, tag: TagItem) {
  const path = tag.fullPath
  if (
    el != null &&
    typeof el === 'object' &&
    'handleClose' in el &&
    typeof (el as DropdownInstance).handleClose === 'function'
  ) {
    tagDropdownRefs.set(path, el as DropdownInstance)
  } else {
    tagDropdownRefs.delete(path)
  }
}

/** 只保留一个标签右键菜单：新开一个时关掉其它（避免叠两层 popper） */
function onTagDropdownVisible(visible: boolean, tag: TagItem) {
  if (!visible) return
  const cur = tag.fullPath
  tagDropdownRefs.forEach((inst, path) => {
    if (path !== cur) {
      inst.handleClose()
    }
  })
}

function onContextCommand(cmd: string, tag: TagItem) {
  switch (cmd) {
    case 'refresh':
      refreshTag(tag)
      break
    case 'close':
      closeTag(tag)
      break
    case 'closeOthers':
      closeOthers(tag)
      break
    case 'closeLeft':
      closeLeft(tag)
      break
    case 'closeRight':
      closeRight(tag)
      break
    case 'closeAll':
      closeAll()
      break
    default:
      break
  }
}
</script>

<template>
  <div class="tags-view tags-view-playful">
    <div class="tags-scroll">
      <el-dropdown
        v-for="tag in visitedTags"
        :key="tag.fullPath"
        :ref="(el: unknown) => setTagDropdownRef(el, tag)"
        trigger="contextmenu"
        popper-class="tags-playful-dropdown"
        class="tag-dropdown"
        @visible-change="(v: boolean) => onTagDropdownVisible(v, tag)"
        @command="(cmd: string | number) => onContextCommand(String(cmd), tag)"
      >
        <div
          class="tags-pill"
          :class="{ 'is-active': isActive(tag), 'is-affix': tag.affix }"
          @click="toTag(tag)"
        >
          <el-icon v-if="tag.affix" class="tags-pill-ico"><StarFilled /></el-icon>
          <span
            v-if="isActive(tag)"
            class="tags-pill-pulse"
            aria-hidden="true"
          />
          <span class="tags-pill-text">{{ tagDisplayTitle(tag) }}</span>
          <button
            v-if="!tag.affix"
            type="button"
            class="tags-pill-x"
            :aria-label="t('tags.closeTabAria')"
            @click.stop="closeTag(tag)"
          >
            <el-icon :size="12"><Close /></el-icon>
          </button>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="refresh">
              <el-icon class="tags-menu-ico"><RefreshRight /></el-icon>
              {{ t('tags.refresh') }}
            </el-dropdown-item>
            <el-dropdown-item command="close" divided :disabled="!!tag.affix">
              <el-icon class="tags-menu-ico"><Close /></el-icon>
              {{ t('tags.close') }}
            </el-dropdown-item>
            <el-dropdown-item
              command="closeOthers"
              :disabled="!canCloseOthers(tag)"
            >
              <el-icon class="tags-menu-ico"><Grid /></el-icon>
              {{ t('tags.closeOthers') }}
            </el-dropdown-item>
            <el-dropdown-item
              command="closeLeft"
              :disabled="!canCloseLeft(tag)"
            >
              <el-icon class="tags-menu-ico"><DArrowLeft /></el-icon>
              {{ t('tags.closeLeft') }}
            </el-dropdown-item>
            <el-dropdown-item
              command="closeRight"
              :disabled="!canCloseRight(tag)"
            >
              <el-icon class="tags-menu-ico"><DArrowRight /></el-icon>
              {{ t('tags.closeRight') }}
            </el-dropdown-item>
            <el-dropdown-item
              command="closeAll"
              divided
              class="tags-menu-item-danger"
              :disabled="!canCloseAll()"
            >
              <el-icon class="tags-menu-ico"><Delete /></el-icon>
              {{ t('tags.closeAll') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tags-view {
  flex-shrink: 0;
  background: var(--admin-tags-bg);
  border-bottom: 1px solid var(--admin-header-border);
  padding: 10px 14px 12px max(14px, env(safe-area-inset-left));
  padding-right: max(14px, env(safe-area-inset-right));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.tags-scroll {
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: color-mix(
      in srgb,
      var(--el-color-primary) 32%,
      var(--admin-border-strong)
    );
  }
}

.tag-dropdown {
  flex-shrink: 0;
  display: inline-flex;
  vertical-align: middle;
}

@media (max-width: 768px) {
  .tags-view {
    padding-top: 8px;
    padding-bottom: 10px;
  }

  .tags-pill {
    max-width: 140px;
  }
}
</style>
