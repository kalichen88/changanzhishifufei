<script setup lang="ts">
// 布局由各页面 definePageMeta 声明（不在此强制，避免覆盖 layout:false）：
// - H5 前台页：layout: 'h5'
// - 总后台页：layout: 'admin'
// - 代理后台页：layout: 'agent'
// - 登录页 / 根跳转页 / pc-blocked：layout: false（无布局，独立全屏）
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
