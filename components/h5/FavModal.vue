<script setup lang="ts">
import { showToast } from 'vant'

const props = defineProps<{ show: boolean; url: string }>()
const emit = defineEmits<{ (e: 'update:show', v: boolean): void }>()
const qrSrc = ref('')

watch(
  () => props.show,
  async (v) => {
    if (v && props.url) {
      try {
        const r = await $fetch<{ code: number; data: string }>(`/api/h5/qrcode?text=${encodeURIComponent(props.url)}`)
        qrSrc.value = r.data
      } catch {
        qrSrc.value = ''
      }
    }
  },
)

async function copy() {
  try {
    await navigator.clipboard.writeText(props.url)
    showToast('复制成功')
  } catch {
    showToast('复制失败，请长按手动复制')
  }
}
</script>

<template>
  <van-popup :show="props.show" position="center" round style="width: 82%; padding: 20px" @update:show="(v) => emit('update:show', v)">
    <p style="text-align: center; font-size: 14px; font-weight: 600; margin: 0 0 12px">收藏本站</p>
    <p style="text-align: center; font-size: 12px; color: #969799; margin: 0 0 10px">长按保存二维码或复制链接收藏本站</p>
    <div style="text-align: center">
      <img v-if="qrSrc" :src="qrSrc" style="width: 180px; height: 180px" alt="推广二维码" />
      <div v-else style="width: 180px; height: 180px; margin: 0 auto; background: #f7f8fa; display: flex; align-items: center; justify-content: center; color: #969799">二维码生成中...</div>
    </div>
    <div style="text-align: center; margin-top: 12px">
      <van-button type="primary" size="small" color="#f53036" @click="copy">复制链接</van-button>
    </div>
  </van-popup>
</template>
