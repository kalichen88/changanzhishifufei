<script setup lang="ts">
// 关于页
definePageMeta({ layout: 'h5' })

const h5 = useH5()
const router = useRouter()
const qrSrc = ref('')
const favShow = ref(false)

onMounted(() => {
  h5.load()
})
</script>

<template>
  <div class="h5-page">
    <van-nav-bar class="h5-navbar" fixed placeholder>
      <template #left>
        <van-icon name="arrow-left" @click="router.back()" />
      </template>
      <template #title>关于本站</template>
    </van-nav-bar>

    <div style="text-align: center; padding: 40px 24px">
      <div class="about-logo">长安</div>
      <div style="font-size: 16px; font-weight: 600; color: #323233; margin-top: 12px">长安知识付费系统</div>
      <div style="font-size: 13px; color: #969799; margin-top: 8px; line-height: 1.8">
        鲜衣怒马少年时，一夜望尽长安花。<br />
        商业化知识付费打赏系统，免登录一键观看。
      </div>
      <van-button type="primary" size="small" color="#f53036" style="margin-top: 24px" @click="favShow = true">
        收藏本站
      </van-button>
      <div style="font-size: 12px; color: #c0c4cc; margin-top: 32px">本站为演示复刻系统 · 支付为占位模拟</div>
    </div>

    <AppTabbar />
    <FavModal v-model:show="favShow" :url="h5.promoUrl()" />
  </div>
</template>

<style scoped>
.about-logo {
  width: 72px;
  height: 72px;
  margin: 0 auto;
  border-radius: 18px;
  background: linear-gradient(135deg, #f53036, #da2b30);
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(245, 48, 54, 0.3);
}
</style>
