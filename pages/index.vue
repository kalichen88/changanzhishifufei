<script setup lang="ts">
// 根路径入口：解析 f/sn → 落地；已有本地上下文 → 直接进首页
definePageMeta({ layout: 'h5' })

const route = useRoute()
const h5 = useH5()
const invalid = ref(false)

onMounted(() => {
  h5.load()
  const f = String(route.query.f || '')
  const sn = String(route.query.sn || '')

  if (f) {
    const target = `/l?f=${encodeURIComponent(f)}${sn ? `&sn=${encodeURIComponent(sn)}` : ''}`
    navigateTo(target, { replace: true })
    return
  }

  if (h5.ready()) {
    navigateTo('/list', { replace: true })
    return
  }

  // 无推广码 → 公共池兜底（未归属流量归平台/站长）
  $fetch<{ code: number; msg: string; data?: { redirect: string; nickname: string } }>('/api/h5/pool')
    .then((pool) => {
      if (pool.code === 1 && pool.data?.redirect) {
        navigateTo(pool.data.redirect, { replace: true })
      } else {
        invalid.value = true
      }
    })
    .catch(() => {
      invalid.value = true
    })
})
</script>

<template>
  <div v-if="invalid" class="desktop-guard">
    <div style="font-size: 56px">🔗</div>
    <h2 style="margin: 16px 0 8px">推广链接无效</h2>
    <p style="color: #969799; font-size: 14px; margin: 0">请通过代理分享的推广链接或二维码进入</p>
  </div>
  <div v-else class="desktop-guard">
    <van-loading color="#f53036" vertical>正在进入...</van-loading>
  </div>
</template>
