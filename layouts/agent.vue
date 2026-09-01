<script setup lang="ts">
// 代理后台布局（独立子站，Element Plus，风格对齐总后台）
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const { api, token } = useAgentApi()
const auth = useBackendAuth('agent_token')

const collapsed = ref(false)
const me = ref<any>(null)

const menus = [
  { path: '/agent/dashboard', title: '数据面板', icon: 'Odometer' },
  { path: '/agent/promo', title: '推广中心', icon: 'Share' },
  { path: '/agent/orders', title: '我的订单', icon: 'List' },
  { path: '/agent/cash', title: '提现申请', icon: 'Wallet' },
  { path: '/agent/pricing', title: '独立定价', icon: 'PriceTag' },
  { path: '/agent/template', title: '模板选择', icon: 'Grid' },
  { path: '/agent/domains', title: '我的域名', icon: 'Link' },
]

const activePath = computed(() => {
  const m = menus.find((x) => route.path.startsWith(x.path))
  return m?.path || '/agent/dashboard'
})

onMounted(async () => {
  if (!token.value) {
    router.replace('/agent/login')
    return
  }
  const m = await auth.fetchMe(api)
  if (m === null) {
    ElMessage.error('登录已过期')
    router.replace('/agent/login')
    return
  }
  if (m) me.value = m
})

function handleLogout() {
  auth.logout(api)
  ElMessage.success('已退出登录')
  router.replace('/agent/login')
}
</script>

<template>
  <el-container class="agent-shell">
    <el-aside :width="collapsed ? '64px' : '220px'" class="agent-aside">
      <div class="logo" :class="{ collapsed }">
        <span v-if="!collapsed">代理推广后台</span>
        <span v-else>代</span>
      </div>
      <el-scrollbar class="menu-scroll">
        <el-menu :default-active="activePath" :collapse="collapsed" router background-color="#1f2430" text-color="#a5abb7" active-text-color="#ffffff" :collapse-transition="false">
          <el-menu-item v-for="m in menus" :key="m.path" :index="m.path">
            <el-icon><component :is="m.icon" /></el-icon>
            <template #title>{{ m.title }}</template>
          </el-menu-item>
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container>
      <el-header class="agent-header" height="56px">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="collapsed = !collapsed">
            <Expand v-if="collapsed" />
            <Fold v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/agent/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ menus.find((m) => m.path === activePath)?.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="(c: string) => (c === 'logout' ? handleLogout() : null)">
            <span class="user-info">
              <el-avatar :size="28" style="background: #f53036">{{ me?.nickname?.[0] || '代' }}</el-avatar>
              <span class="uname">{{ me?.nickname || '代理' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="agent-main-area">
        <slot />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.agent-shell {
  height: 100vh;
}
.agent-aside {
  background: #1f2430;
  transition: width 0.2s;
  overflow: hidden;
}
.logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  background: #171b25;
  white-space: nowrap;
}
.menu-scroll {
  height: calc(100vh - 56px);
}
.agent-aside :deep(.el-menu) {
  border-right: none;
}
.agent-aside :deep(.el-menu-item.is-active) {
  background: #f53036 !important;
}
.agent-aside :deep(.el-menu-item:hover) {
  background: #2b3344;
}
.agent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e8eaee;
  background: #fff;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #5f6672;
}
.header-right .user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #323233;
}
.agent-main-area {
  background: #f2f3f5;
  padding: 16px;
}
</style>
