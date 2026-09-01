<script setup lang="ts">
// 搜索页
definePageMeta({ layout: 'h5' })
import { showToast } from 'vant'

const h5 = useH5()
const router = useRouter()

const keyword = ref('')
const list = ref<any[]>([])
const page = ref(1)
const total = ref(0)
const loading = ref(false)
const finished = ref(false)
const searched = ref(false)

async function doSearch(reset = true) {
  if (!keyword.value.trim()) {
    showToast('请输入关键词')
    return
  }
  if (reset) {
    page.value = 1
    finished.value = false
    list.value = []
  }
  loading.value = true
  searched.value = true
  try {
    const r = await $fetch<{ code: number; total: number; data: any[] }>(
      `/api/h5/vlist?f=${encodeURIComponent(h5.f.value)}&key=${encodeURIComponent(keyword.value)}&page=${page.value}&limit=10`,
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
  if (!finished.value && searched.value) {
    page.value += 1
    doSearch(false)
  }
}
</script>

<template>
  <div class="h5-page">
    <van-nav-bar class="h5-navbar" fixed placeholder>
      <template #left>
        <van-icon name="arrow-left" @click="router.back()" />
      </template>
      <template #title>
        <van-search
          v-model="keyword"
          shape="round"
          placeholder="搜索视频标题"
          background="transparent"
          @search="doSearch(true)"
        />
      </template>
      <template #right>
        <span style="font-size: 14px" @click="doSearch(true)">搜索</span>
      </template>
    </van-nav-bar>

    <div class="waterfall">
      <div v-for="item in list" :key="item.id" @click="router.push(`/v/${item.id}?f=${h5.f.value}`)">
        <VideoCard :item="item" />
      </div>
    </div>
    <van-empty v-if="searched && list.length === 0 && !loading" description="没有找到相关视频" />
    <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="onLoad" />
    <AppTabbar />
  </div>
</template>
