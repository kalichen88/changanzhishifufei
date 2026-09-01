<script setup lang="ts">
// 总后台根路径：已登录跳仪表盘，未登录跳登录页
definePageMeta({ layout: false })

const router = useRouter()
const { token } = useAdminApi()

onMounted(() => {
  router.replace(token.value ? '/admin/dashboard' : '/admin/login')
})
</script>

<template>
  <div class="admin-redirect">
    <el-icon class="spin" :size="28"><Loading /></el-icon>
    <p>正在跳转，请稍候...</p>
  </div>
</template>

<style scoped>
.admin-redirect {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #909399;
  font-size: 14px;
  background: linear-gradient(135deg, #f53036 0%, #8f1418 100%);
}
.admin-redirect p {
  color: #fff;
}
.spin {
  color: #fff;
  animation: rot 1s linear infinite;
}
@keyframes rot {
  to {
    transform: rotate(360deg);
  }
}
</style>
