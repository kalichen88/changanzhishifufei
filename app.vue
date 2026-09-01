<script setup lang="ts">
// 依据路由自动切换布局：H5 前台 / 总后台 / 代理后台
const route = useRoute()
const layout = computed<'h5' | 'admin' | 'agent'>(() => {
  if (route.path.startsWith('/admin')) return 'admin'
  if (route.path.startsWith('/agent')) return 'agent'
  return 'h5'
})
</script>

<template>
  <NuxtLayout :name="layout">
    <NuxtPage />
  </NuxtLayout>
</template>
