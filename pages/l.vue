<script setup lang="ts">
// 落地页（还原 Index::lists）：写 localStorage → 进首页
definePageMeta({ layout: 'h5' })

const route = useRoute()
const h5 = useH5()
const errMsg = ref('')

onMounted(async () => {
  const f = String(route.query.f || '')
  const sn = String(route.query.sn || '')
  if (!f) {
    errMsg.value = '推广链接无效'
    return
  }

  try {
    // 1) 入口：写 HttpOnly 指纹/sn Cookie + 访问计数
    const entry = await $fetch<{ code: number; msg: string; data?: { uid: number; nickname: string } }>(
      `/api/h5/entry?f=${encodeURIComponent(f)}${sn ? `&sn=${encodeURIComponent(sn)}` : ''}`,
    )
    if (entry.code !== 1 || !entry.data) {
      errMsg.value = entry.msg || '推广链接无效'
      return
    }

    // 2) 落地：取 localStorage 数据
    const landing = await $fetch<{
      code: number
      data?: { uid: number; view_id: number; muban: string; f: string; h_url: string; nickname: string }
    }>(`/api/h5/landing?f=${encodeURIComponent(f)}`)
    if (landing.code !== 1 || !landing.data) {
      errMsg.value = landing.msg || '落地失败'
      return
    }

    h5.save({
      uid: landing.data.uid,
      view_id: landing.data.view_id,
      f: landing.data.f,
      h_url: landing.data.h_url,
      nickname: landing.data.nickname,
    })

    // 3) 进首页
    navigateTo('/list', { replace: true })
  } catch {
    errMsg.value = '网络异常，请稍后重试'
  }
})
</script>

<template>
  <div v-if="errMsg" class="desktop-guard">
    <div style="font-size: 56px">⚠️</div>
    <h2 style="margin: 16px 0 8px">{{ errMsg }}</h2>
    <p style="color: #969799; font-size: 14px; margin: 0">请通过代理分享的推广链接或二维码进入</p>
  </div>
  <div v-else class="desktop-guard">
    <van-loading color="#f53036" vertical>正在加载...</van-loading>
  </div>
</template>
