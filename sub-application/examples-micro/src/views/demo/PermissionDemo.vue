<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SimplePage from '@micro/components/SimplePage.vue'
import { useRouteTitle } from '@micro/composables/useRouteTitle'
import { usePermission } from '@micro/composables/usePermission'
import {
  PERM_DEMO_PERM_ALL_A,
  PERM_DEMO_PERM_ALL_B,
  PERM_DEMO_PERM_DISABLED,
  PERM_DEMO_PERM_HIDDEN,
  PERM_DEMO_PERM_VISIBLE,
} from '@micro/constants/perms'
import { isDemoRuntime } from '@micro/constants/runtimeMode'

const route = useRoute()
const { titleForRoute } = useRouteTitle()
const title = computed(() => titleForRoute(route))
const { hasPerm, hasAllPerms } = usePermission()

const subtitle = computed(() =>
  isDemoRuntime()
    ? '演示模式下请在主壳顶栏用「角色切换」对比：示例访客仅有部分权限码，管理员为全开。'
    : '权限与当前登录账号一致，可与主应用共用同一套权限码。',
)

const allCombo = [PERM_DEMO_PERM_ALL_A, PERM_DEMO_PERM_ALL_B] as const
</script>

<template>
  <SimplePage :title="title" :subtitle="subtitle">
    <p class="lead">
      本页仅在<strong>示例子应用</strong>内展示
      <code>v-permission</code>
      与
      <code>usePermission()</code>
      的写法；菜单能否进入仍由主路由
      <code>meta.roles</code>
      控制。
    </p>

    <el-divider content-position="left">默认：无权限则隐藏</el-divider>
    <p class="hint">
      <code>v-permission="'demo:perm:visible'"</code>
      — 示例访客具备，按钮应显示；
      <code>demo:perm:hidden</code>
      — 示例访客不具备，按钮应消失。
    </p>
    <el-space wrap>
      <el-button v-permission="PERM_DEMO_PERM_VISIBLE" type="primary">
        可见操作（demo:perm:visible）
      </el-button>
      <el-button v-permission="PERM_DEMO_PERM_HIDDEN" type="danger">
        高危操作（demo:perm:hidden）
      </el-button>
    </el-space>

    <el-divider content-position="left">修饰符 .disable：无权限则禁用</el-divider>
    <p class="hint">
      仍占位可见，适合「提示存在但不可点」的交互；指令为
      <code>v-permission.disable</code>
      。
    </p>
    <el-space wrap>
      <el-button v-permission.disable="PERM_DEMO_PERM_VISIBLE">有权限 — 可点</el-button>
      <el-button v-permission.disable="PERM_DEMO_PERM_DISABLED" type="warning">
        无权限 — 禁用（demo:perm:disabled）
      </el-button>
    </el-space>

    <el-divider content-position="left">修饰符 .all：数组内需全部权限</el-divider>
    <p class="hint">
      示例访客仅有
      <code>demo:perm:allA</code>
      、缺少
      <code>demo:perm:allB</code>
      ，下列按钮应对示例访客隐藏；切换为管理员后两者皆满足，按钮出现。
    </p>
    <el-space wrap>
      <el-button
        v-permission.all="allCombo"
        type="success"
      >
        需同时具备 allA + allB
      </el-button>
    </el-space>

    <el-divider content-position="left">usePermission() + v-if</el-divider>
    <p class="hint">适合复杂模板片段或非按钮元素的条件渲染。</p>
    <el-alert
      v-if="hasPerm(PERM_DEMO_PERM_VISIBLE)"
      type="info"
      :closable="false"
      show-icon
      title="当前账号具备 demo:perm:visible"
    />
    <el-alert
      v-if="hasAllPerms(allCombo)"
      type="success"
      :closable="false"
      show-icon
      class="mt"
      title="当前账号同时具备 allA 与 allB（一般为管理员预设）"
    />
  </SimplePage>
</template>

<style scoped lang="scss">
.lead {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--admin-text-muted);
  line-height: 1.65;
}

.lead code {
  padding: 1px 6px;
  font-size: 12px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
}

.hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--admin-text-muted);
  line-height: 1.6;
}

.hint code {
  font-size: 12px;
}

.mt {
  margin-top: 12px;
}
</style>
