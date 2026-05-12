<script setup lang="ts">
import { computed, nextTick, ref, useAttrs, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TreeNodeData, TreeOptionProps } from 'element-plus'

defineOptions({ inheritAttrs: false })

type NodeKey = string | number

const props = withDefaults(
  defineProps<{
    data: TreeNodeData[]
    nodeKey: string
    props?: TreeOptionProps
    showCheckbox?: boolean
    checkStrictly?: boolean
    defaultCheckedKeys?: unknown[]
    currentNodeKey?: NodeKey
    highlightCurrent?: boolean
    expandOnClickNode?: boolean
    filterNodeMethod?: (value: string, data: TreeNodeData) => boolean
    filterText?: string
    /** 是否显示“展开/收缩”按钮 */
    showExpandCollapse?: boolean
    /** 默认是否展开全部（建议保持 false） */
    defaultExpandAll?: boolean
    /** 按钮位置 */
    actionsPlacement?: 'top-right' | 'top'
    bodyMaxHeight?: string
    emptyText?: string
  }>(),
  {
    props: () => ({ children: 'children', label: 'label' }),
    showCheckbox: false,
    checkStrictly: false,
    defaultCheckedKeys: () => [],
    currentNodeKey: undefined,
    highlightCurrent: false,
    expandOnClickNode: false,
    filterText: '',
    showExpandCollapse: true,
    defaultExpandAll: false,
    actionsPlacement: 'top-right',
    bodyMaxHeight: '280px',
    emptyText: '',
  },
)

const emit = defineEmits<{
  (e: 'node-click', data: TreeNodeData): void
  (e: 'check', data: TreeNodeData, checked: unknown): void
  (e: 'check-change', data: TreeNodeData, checked: boolean, indeterminate: boolean): void
  (e: 'current-change', data: TreeNodeData, node: unknown): void
}>()

const { t } = useI18n()
const attrs = useAttrs()
const treeRef = ref<any>(null)

const treeOptionProps = computed<TreeOptionProps>(() => props.props ?? { children: 'children', label: 'label' })

function collectAllKeys(list: TreeNodeData[]): NodeKey[] {
  const out: NodeKey[] = []
  const childrenKey = (treeOptionProps.value.children || 'children') as string
  const keyProp = props.nodeKey
  function walk(nodes: TreeNodeData[]) {
    for (const n of nodes) {
      const k = (n as Record<string, unknown>)[keyProp]
      if (typeof k === 'string' || typeof k === 'number') out.push(k)
      const ch = (n as Record<string, unknown>)[childrenKey]
      if (Array.isArray(ch) && ch.length) walk(ch as TreeNodeData[])
    }
  }
  walk(list)
  return out
}

const allKeys = computed(() => collectAllKeys(props.data))

/**
 * Element Plus `el-tree` 并不暴露 setExpandedKeys（那是 tree-v2 的能力）。
 * 这里通过公开的 getNode(key) + node.expand/collapse 来批量展开/收起（更稳）。
 */
async function expandAll() {
  await nextTick()
  const inst: any = treeRef.value
  if (!inst?.getNode) return
  for (const k of allKeys.value) {
    const node = inst.getNode(k)
    node?.expand?.()
  }
}

async function collapseAll() {
  await nextTick()
  const inst: any = treeRef.value
  if (!inst?.getNode) return
  // 先子后父收起
  for (let i = allKeys.value.length - 1; i >= 0; i--) {
    const node = inst.getNode(allKeys.value[i])
    node?.collapse?.()
  }
}

function filter(text: string) {
  treeRef.value?.filter(text)
}

defineExpose({
  getTree: () => treeRef.value as any,
  expandAll,
  collapseAll,
  filter,
})

watch(
  () => props.filterText,
  (v) => {
    if (v == null) return
    treeRef.value?.filter(v)
  },
  { immediate: true },
)

watch(
  () => props.data,
  async () => {
    // 默认收缩；若开启 defaultExpandAll 则展开
    await nextTick()
    if (props.defaultExpandAll) await expandAll()
    else await collapseAll()
    // 保持过滤效果
    if (props.filterText) treeRef.value?.filter(props.filterText)
  },
  { deep: false },
)

const bodyStyle = computed(() => ({
  maxHeight: props.bodyMaxHeight,
  overflow: 'auto',
}))
</script>

<template>
  <div class="smart-tree" v-bind="attrs">
    <div
      v-if="showExpandCollapse"
      class="smart-tree__actions"
      :class="`is-${actionsPlacement}`"
    >
      <el-button plain size="small" class="smart-tree__btn" @click="expandAll">
        {{ t('common.expandAll') }}
      </el-button>
      <el-button plain size="small" class="smart-tree__btn" @click="collapseAll">
        {{ t('common.collapseAll') }}
      </el-button>
    </div>

    <div class="smart-tree__body" :style="bodyStyle">
      <el-empty
        v-if="!data?.length"
        :description="emptyText || undefined"
        class="smart-tree__empty"
      />
      <el-tree
        v-else
        ref="treeRef"
        :data="data"
        :node-key="nodeKey"
        :props="treeOptionProps"
        :show-checkbox="showCheckbox"
        :check-strictly="checkStrictly"
        :default-checked-keys="defaultCheckedKeys"
        :current-node-key="currentNodeKey"
        :highlight-current="highlightCurrent"
        :expand-on-click-node="expandOnClickNode"
        :filter-node-method="filterNodeMethod"
        @node-click="(d: TreeNodeData) => emit('node-click', d)"
        @check="(d: TreeNodeData, c: unknown) => emit('check', d, c)"
        @check-change="(d: TreeNodeData, checked: boolean, indeterminate: boolean) => emit('check-change', d, checked, indeterminate)"
        @current-change="(d: TreeNodeData, node: unknown) => emit('current-change', d, node)"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.smart-tree {
  width: 100%;
  min-width: 0;
}

.smart-tree__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;

  &.is-top-right {
    justify-content: flex-end;
  }
}

.smart-tree__btn {
  border-radius: 999px;
}

.smart-tree__body {
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  padding: 6px 6px 4px;
}

.smart-tree__empty {
  padding: 18px 0;
}
</style>

