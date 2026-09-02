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
// 串行锁 + 请求代次：杜绝 van-list @load 与 onMounted 并发重复拉取/漏首屏
let loadBusy = false
let loadSeq = 0

onMounted(async () => {
  h5.load()
  if (!h5.ready()) {
    showToast('请通过推广链接进入')
    return
  }
  load(1)
})

async function load(p: number) {
  if (!h5.ready() || loadBusy) return
  loadBusy = true
  const mySeq = ++loadSeq
  loading.value = true
  try {
    const r = await $fetch<{ code: number; total: number; data: any[] }>(
      `/api/h5/vlist?f=${encodeURIComponent(h5.f.value)}&payed=1&page=${p}&limit=10`,
    )
    if (mySeq !== loadSeq) return // 丢弃过期响应
    total.value = r.total || 0
    const arr = r.data || []
    if (p === 1) {
      list.value = arr
      page.value = 1
    } else {
      const ids = new Set(list.value.map((it) => it.id))
      const fresh = arr.filter((it) => !ids.has(it.id))
      list.value = [...list.value, ...fresh]
      page.value = p
    }
    if (list.value.length >= total.value || arr.length === 0) finished.value = true
  } catch {
    // 网络异常：保留现有列表，释放锁供重试
  } finally {
    if (mySeq === loadSeq) {
      loading.value = false
      loadBusy = false
    }
  }
}

function onLoad() {
  if (!finished.value && !loadBusy) load(page.value + 1)
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
    <!-- immediate-check=false：首屏由 onMounted load() 拉第 1 页，避免挂载即 @load 顶到第 2 页 -->
    <van-list
      v-model:loading="loading"
      :finished="finished"
      :immediate-check="false"
      finished-text="没有更多了"
      @load="onLoad"
    />
    <AppTabbar />
  </div>
</template>
