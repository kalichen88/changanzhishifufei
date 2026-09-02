<script setup lang="ts">
// 首页瀑布流（还原原版 lbzynjk 列表页）
definePageMeta({ layout: 'h5' })
import { showToast } from 'vant'

const h5 = useH5()
const router = useRouter()

const list = ref<Array<{ id: number; title: string; img: string; money: number; rand: number; read_num: number; h: number; pay: number }>>([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
// 串行锁 + 请求代次：杜绝 van-list @load 与 onMounted/下拉刷新并发重复拉取，
// 并保证慢响应不会覆盖新请求结果（修复“首屏漏第 1 页、重复加载”问题）
let loadBusy = false
let loadSeq = 0
const noticeText = ref('温馨提示：如果付款没有跳转，请到已购买里观看。保存链接或二维码，长期免费观看')
const favShow = ref(false)

const payShow = ref(false)
const payVid = ref(0)
const payTitle = ref('')
const payImg = ref('')

onMounted(async () => {
  h5.load()
  if (!h5.ready()) {
    // 未落地：尝试带 f 重新落地；否则引导
    const f = String(useRoute().query.f || '')
    if (f) {
      navigateTo(`/?f=${encodeURIComponent(f)}`, { replace: true })
      return
    }
    showToast('请通过推广链接进入')
    return
  }
  await fetchVersion()
  load(1)
})

async function fetchVersion() {
  try {
    const r = await $fetch<{ code: number; data?: { notice: string } }>('/api/h5/version')
    if (r?.data?.notice) noticeText.value = r.data.notice
  } catch {
    /* ignore */
  }
}

async function load(p: number) {
  if (!h5.ready() || loadBusy) return
  loadBusy = true
  const mySeq = ++loadSeq
  loading.value = true
  try {
    const r = await $fetch<{ code: number; total: number; data: any[] }>(
      `/api/h5/vlist?f=${encodeURIComponent(h5.f.value)}&page=${p}&limit=10`,
    )
    if (mySeq !== loadSeq) return // 已被更新的请求取代，丢弃过期响应
    if (r.code !== 1) {
      showToast('加载失败')
      return
    }
    total.value = r.total || 0
    const arr = r.data || []
    if (p === 1) {
      list.value = arr
      page.value = 1
    } else {
      // 去重后追加，避免同页被并发重复拉取时产生重复卡片
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
    refreshing.value = false
  }
}

function onLoad() {
  if (!finished.value && !loadBusy) load(page.value + 1)
}

function onRefresh() {
  loadSeq += 1 // 使在途旧响应过期
  loadBusy = false
  finished.value = false
  load(1)
}

function openVideo(item: any) {
  router.push(`/v/${item.id}?f=${h5.f.value}`)
}

function openFav() {
  favShow.value = true
}
</script>

<template>
  <div class="h5-page">
    <!-- 顶部渐变头 -->
    <div class="h5-header-bg">
      <div class="header-inner">
        <van-icon name="star-o" class="fav-btn" @click="openFav" />
        <div class="header-search" @click="router.push('/search')">
          <van-icon name="search" />
          <span>搜索你想看的视频</span>
        </div>
      </div>
    </div>

    <div class="h5-notice">
      <van-notice-bar left-icon="volume-o" :scrollable="false" wrapable :text="noticeText" />
    </div>

    <!-- 瀑布流 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="waterfall">
        <div v-for="item in list" :key="item.id" @click="openVideo(item)">
          <VideoCard :item="item" />
        </div>
      </div>
      <div v-if="list.length === 0 && !loading" class="empty-tip">
        <van-empty description="暂无视频，请联系代理" />
      </div>
      <!-- immediate-check=false：首屏由 onMounted load() 拉第 1 页，避免挂载即 @load 把页码顶到第 2 页（漏第 1 页 + 重复加载） -->
      <van-list
        v-model:loading="loading"
        :finished="finished"
        :immediate-check="false"
        finished-text="没有更多了"
        @load="onLoad"
      />
    </van-pull-refresh>

    <AppTabbar />
    <FavModal v-model:show="favShow" :url="h5.promoUrl()" />
  </div>
</template>

<style scoped>
.h5-header-bg {
  position: relative;
}
.header-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 44px 12px 20px;
}
.fav-btn {
  font-size: 22px;
  color: #fff;
  padding: 6px;
}
.header-search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 18px;
  padding: 8px 14px;
  font-size: 13px;
  color: #969799;
}
.empty-tip {
  padding-top: 40px;
}
</style>
