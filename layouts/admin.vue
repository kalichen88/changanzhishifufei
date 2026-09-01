<script setup lang="ts">
// 总后台布局（还原 FastAdmin：左侧菜单 + 顶栏 + 内容区）
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const { api, token } = useAdminApi()
const auth = useBackendAuth('admin_token')

const collapsed = ref(false)
const me = ref<any>(null)

const menus = [
  { path: '/admin/dashboard', title: '数据看板', icon: 'Odometer' },
  { path: '/admin/admins', title: '代理管理', icon: 'User' },
  { path: '/admin/domains', title: '域名管理', icon: 'Link' },
  { path: '/admin/stocks', title: '片库管理', icon: 'VideoCamera' },
  { path: '/admin/import-tasks', title: '导入任务', icon: 'UploadFilled' },
  { path: '/admin/categories', title: '分类管理', icon: 'Files' },
  { path: '/admin/orders', title: '订单管理', icon: 'List' },
  { path: '/admin/cash', title: '提现管理', icon: 'Wallet' },
  { path: '/admin/money', title: '余额流水', icon: 'Coin' },
  { path: '/admin/pay-channels', title: '支付配置', icon: 'CreditCard' },
  { path: '/admin/mubans', title: '模板管理', icon: 'Grid' },
  { path: '/admin/hezis', title: '盒子链接', icon: 'Box' },
  { path: '/admin/configs', title: '系统配置', icon: 'Setting' },
]

const activePath = computed(() => {
  const m = menus.find((x) => route.path.startsWith(x.path))
  return m?.path || '/admin/dashboard'
})

// 除登录页外，均需登录态
onMounted(async () => {
  if (!token.value) {
    router.replace('/admin/login')
    return
  }
  const m = await auth.fetchMe(api)
  if (!m) {
    ElMessage.error('登录已过期')
    router.replace('/admin/login')
    return
  }
  me.value = m
})

function handleLogout() {
  auth.logout(api)
  ElMessage.success('已退出登录')
  router.replace('/admin/login')
}
</script>

<template>
  <el-container class="admin-shell">
    <!-- 左侧菜单 -->
    <el-aside :width="collapsed ? '64px' : '220px'" class="admin-aside">
      <div class="logo" :class="{ collapsed }">
        <span v-if="!collapsed">长安知识付费</span>
        <span v-else>长</span>
      </div>
      <el-scrollbar class="menu-scroll">
        <el-menu :default-active="activePath" :collapse="collapsed" router background-color="#2b2f3a" text-color="#a5abb7" active-text-color="#ffffff" :collapse-transition="false">
          <el-menu-item v-for="m in menus" :key="m.path" :index="m.path">
            <el-icon><component :is="m.icon" /></el-icon>
            <template #title>{{ m.title }}</template>
          </el-menu-item>
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container>
      <!-- 顶栏 -->
      <el-header class="admin-header" height="56px">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="collapsed = !collapsed">
            <Expand v-if="collapsed" />
            <Fold v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ menus.find((m) => m.path === activePath)?.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="(c: string) => (c === 'logout' ? handleLogout() : null)">
            <span class="user-info">
              <el-avatar :size="28" style="background: #f53036">{{ me?.nickname?.[0] || '管' }}</el-avatar>
              <span class="uname">{{ me?.nickname || '管理员' }}</span>
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

      <el-main class="admin-main-area">
        <slot />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.admin-shell {
  height: 100vh;
}
.admin-aside {
  background: #2b2f3a;
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
  background: #242833;
  white-space: nowrap;
}
.menu-scroll {
  height: calc(100vh - 56px);
}
.admin-aside :deep(.el-menu) {
  border-right: none;
}
.admin-aside :deep(.el-menu-item.is-active) {
  background: #f53036 !important;
}
.admin-aside :deep(.el-menu-item:hover) {
  background: #363b49;
}
.admin-header {
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
.admin-main-area {
  background: #f2f3f5;
  padding: 16px;
}
</style>
