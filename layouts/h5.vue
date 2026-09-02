<script setup lang="ts">
// H5 布局：前端二次校验 UA（防后端绕过/缓存）
const route = useRoute()

function isMobile(): boolean {
  if (!import.meta.client) return true
  const ua = navigator.userAgent || ''
  const touch = 'ontouchstart' in window && navigator.maxTouchPoints > 0
  return touch || /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(ua)
}

const blocked = ref(false)
onMounted(() => {
  // 预览模式（?preview=1）→ 允许 PC 访问，便于后台/代理在电脑上核对 H5 页面
  if (route.query.preview === '1') {
    try {
      sessionStorage.setItem('h5_preview', '1')
    } catch {
      /* ignore */
    }
  }
  let previewing = false
  try {
    previewing = sessionStorage.getItem('h5_preview') === '1'
  } catch {
    previewing = false
  }
  if (!previewing && !isMobile()) {
    blocked.value = true
    window.location.replace('/pc-blocked')
  }
})
</script>

<template>
  <div class="h5-layout">
    <slot v-if="!blocked" />
  </div>
</template>
