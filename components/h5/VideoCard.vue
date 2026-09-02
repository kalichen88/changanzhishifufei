<script setup lang="ts">
// 双列瀑布流卡片（还原原版 cc_panel_detail）
export interface VideoItem {
  id: number
  cid: number
  title: string
  img: string
  url: string
  vid_url?: string
  money: number
  rand: number
  read_num: number
  h: number
  pay: number
}

const props = defineProps<{ item: VideoItem }>()
const emit = defineEmits<{ (e: 'click', item: VideoItem): void }>()

const fmt = (n: number) => (n >= 10000 ? `${(n / 10000).toFixed(1)}w` : String(n))
</script>

<template>
  <div class="cc_card" @click="emit('click', props.item)">
    <div class="cover-wrap">
      <img class="cover" :src="mediaProxyUrl(props.item.img)" :alt="props.item.title" loading="lazy" />
      <div v-if="props.item.pay === 1" class="tag tag-paid">已购</div>
      <div v-else class="tag">¥{{ props.item.money }}</div>
      <div class="play">
        <van-icon name="play" />
      </div>
    </div>
    <div class="title">{{ props.item.title }}</div>
    <div class="meta">
      <span>{{ fmt(props.item.read_num) }}人观看</span>
      <span>好评:{{ props.item.h }}%</span>
    </div>
  </div>
</template>

<style scoped>
.cover-wrap {
  position: relative;
}
.cover {
  width: 100%;
  display: block;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  background: #eee;
}
.play {
  position: absolute;
  bottom: 8px;
  left: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}
.play .van-icon {
  color: #fff;
  font-size: 12px;
}
</style>
