<script setup lang="ts">
// 分类页：分类宫格 + 分类视频流
definePageMeta({ layout: 'h5' })
import { showToast } from 'vant'

const h5 = useH5()
const router = useRouter()

const cats = ref<Array<{ id: number; image: string; title: string }>>([])
const activeCid = ref(0)
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
  try {
    const r = await $fetch<{ code: number; data: Array<{ id: number; image: string; title: string }> }>('/api/h5/cat')
    cats.value = r.data || []
  } catch {
    cats.value = []
  }
  load()
})

function selectCat(cid: number) {
  activeCid.value = cid
  page.value = 1
  finished.value = false
  list.value = []
  load()
}

async function load() {
  if (!h5.ready()) return
  loading.value = true
  try {
    const params = new URLSearchParams({ f: h5.f.value, page: String(page.value), limit: '10' })
    if (activeCid.value) params.set('cid', String(activeCid.value))
    const r = await $fetch<{ code: number; total: number; data: any[] }>(`/api/h5/vlist?${params.toString()}`)
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
    <van-nav-bar class="h5-navbar" fixed placeholder title="分类" />

    <!-- 分类宫格 -->
    <div v-if="cats.length" class="cat-grid">
      <div v-for="c in cats" :key="c.id" class="cat-item" :class="{ active: activeCid === c.id }" @click="selectCat(c.id)">
        <img v-if="c.image" :src="c.image" class="cat-icon" alt="" />
        <div v-else class="cat-icon cat-ph">📁</div>
        <span class="cat-name">{{ c.title }}</span>
      </div>
      <div class="cat-item" :class="{ active: activeCid === 0 }" @click="selectCat(0)">
        <div class="cat-icon cat-ph">🏠</div>
        <span class="cat-name">全部</span>
      </div>
    </div>

    <div class="waterfall">
      <div v-for="item in list" :key="item.id" @click="router.push(`/v/${item.id}?f=${h5.f.value}`)">
        <VideoCard :item="item" />
      </div>
    </div>
    <van-empty v-if="list.length === 0 && !loading" description="该分类暂无视频" />
    <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="onLoad" />
    <AppTabbar />
  </div>
</template>

<style scoped>
.cat-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 12px 8px 4px;
  background: #fff;
}
.cat-item {
  width: 20%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  border-radius: 8px;
}
.cat-item.active {
  background: #fff0f0;
}
.cat-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  background: #f7f8fa;
}
.cat-ph {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.cat-name {
  font-size: 12px;
  color: #323233;
  margin-top: 6px;
}
.cat-item.active .cat-name {
  color: #f53036;
  font-weight: 600;
}
</style>
