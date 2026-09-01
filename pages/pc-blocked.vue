<script setup lang="ts">
// 电脑端拦截兜底页（服务端已拦截，这里仅前端防御展示）
definePageMeta({ layout: false })
</script>

<template>
  <div class="pc-block">
    <div style="font-size: 64px">📱</div>
    <h2 style="margin: 16px 0 8px">请使用手机访问</h2>
    <p style="color: #969799; font-size: 14px; margin: 0; line-height: 1.8">
      本内容仅支持在手机端观看<br />
      请用手机浏览器扫描推广二维码进入
    </p>
  </div>
</template>

<style scoped>
.pc-block {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f7f8fa;
  color: #323233;
  text-align: center;
  padding: 24px;
}
</style>
