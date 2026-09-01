<script setup lang="ts">
// 短链路由 /t?f= → 落地（还原原版 t → index/index/index）
definePageMeta({ layout: 'h5' })
const route = useRoute()
onMounted(() => {
  const f = String(route.query.f || '')
  navigateTo(`/?f=${encodeURIComponent(f)}`, { replace: true })
})
</script>

<template>
  <div class="desktop-guard">
    <van-loading color="#f53036" vertical>跳转中...</van-loading>
  </div>
</template>
