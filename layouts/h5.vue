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
  if (!isMobile()) {
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
