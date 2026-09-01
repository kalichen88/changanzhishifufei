<script setup lang="ts">
// 已购页（还原原版 payed_list；复用列表组件）
definePageMeta({ layout: 'h5' })
import { showToast } from 'vant'

const h5 = useH5()
const router = useRouter()

const list = ref<any[]>([])
const page = ref(1)
const total = ref(0)
const loading = ref(false)
const finished = ref(false)

onMounted(async () => {
  h5.load()
  if (!h5.ready()) {
    showToast('请通过推广链接进入')
    return
  }
  load()
})

async function load() {
  if (!h5.ready()) return
  loading.value = true
  try {
    const r = await $fetch<{ code: number; total: number; data: any[] }>(
      `/api/h5/vlist?f=${encodeURIComponent(h5.f.value)}&payed=1&page=${page.value}&limit=10`,
    )
    total.value = r.total || 0
    const arr = r.data || []
    list.value = page.value === 1 ? arr : [...list.value, ...arr]
    if (list.value.length >= total.value || arr.length === 0) finished.value = true
  } finally {
    loading.value = false
  }
}

function onLoad() {
  if (!finished.value) {
    page.value += 1
    load()
  }
}
</script>

<template>
  <div class="h5-page">
    <van-nav-bar class="h5-navbar" fixed placeholder title="已购" />

    <div class="waterfall">
      <div v-for="item in list" :key="item.id" @click="router.push(`/v/${item.id}?f=${h5.f.value}`)">
        <VideoCard :item="item" />
      </div>
    </div>
    <van-empty v-if="list.length === 0 && !loading" description="暂无已购视频">
      <template #image>
        <img src="/h5/img/empty-cart.jpeg" alt="" style="width: 140px" />
      </template>
    </van-empty>
    <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="onLoad" />
    <AppTabbar />
  </div>
</template>
