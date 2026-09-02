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
// 串行锁 + 请求代次：杜绝 van-list @load 与手动/切分类并发重复拉取/漏首屏，
// 切换分类时令在途旧响应过期
let loadBusy = false
let loadSeq = 0

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
  load(1)
})

function selectCat(cid: number) {
  activeCid.value = cid
  loadSeq += 1 // 在途旧分类响应作废
  loadBusy = false
  finished.value = false
  list.value = []
  load(1)
}

async function load(p: number) {
  if (!h5.ready() || loadBusy) return
  loadBusy = true
  const mySeq = ++loadSeq
  loading.value = true
  try {
    const params = new URLSearchParams({ f: h5.f.value, page: String(p), limit: '10' })
    if (activeCid.value) params.set('cid', String(activeCid.value))
    const r = await $fetch<{ code: number; total: number; data: any[] }>(`/api/h5/vlist?${params.toString()}`)
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
    <van-nav-bar class="h5-navbar" fixed placeholder title="分类" />

    <!-- 分类宫格 -->
    <div v-if="cats.length" class="cat-grid">
      <div v-for="c in cats" :key="c.id" class="cat-item" :class="{ active: activeCid === c.id }" @click="selectCat(c.id)">
        <img v-if="c.image" :src="mediaProxyUrl(c.image)" class="cat-icon" alt="" />
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
    <!-- immediate-check=false：首屏由 onMounted load() 拉第 1 页；切换分类时 selectCat 直接 load 第 1 页 -->
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
