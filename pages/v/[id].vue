<script setup lang="ts">
// 视频详情/播放（已购→播放外链；未购→封面+支付弹层）
definePageMeta({ layout: 'h5' })
import { showToast } from 'vant'
import Hls from 'hls.js'

const h5 = useH5()
const route = useRoute()
const router = useRouter()

const vid = Number(route.params.id)
const loading = ref(true)
const payed = ref(false)
const link = ref<{ url: string; url2?: string; url3?: string; img: string; title: string } | null>(null)
const desc = ref('')
const expire = ref('')
const recoverUrl = ref('')
const errorMsg = ref('')
const payShow = ref(false)
const favShow = ref(false)

// ---- 回退播放（主源 → 资源文件源 → 备用源） ----
const videoEl = ref<HTMLVideoElement | null>(null)
const playSrc = ref('')
const srcList = ref<string[]>([])
const srcIndex = ref(0)
let hls: Hls | null = null

function isM3u8(src: string) {
  return /\.m3u8(\?|$)/i.test(src) || src.includes('m3u8')
}

function loadCurrentSrc() {
  if (srcIndex.value >= srcList.value.length) {
    showToast('所有视频源均无法播放')
    return
  }
  const src = srcList.value[srcIndex.value]
  playSrc.value = src
  if (hls) {
    hls.destroy()
    hls = null
  }
  if (isM3u8(src) && Hls.isSupported() && videoEl.value) {
    hls = new Hls()
    hls.loadSource(src)
    hls.attachMedia(videoEl.value)
    hls.on(Hls.Events.ERROR, (_evt, data) => {
      if (data.fatal) {
        hls?.destroy()
        hls = null
        nextSrc()
      }
    })
  }
}

function nextSrc() {
  // hls.js 正在接管播放时由其自行管理错误与回退，避免原生 error 重复跳源
  if (hls) return
  srcIndex.value++
  loadCurrentSrc()
}

function startPlay() {
  if (!link.value) return
  srcList.value = [link.value.url, link.value.url2, link.value.url3].filter((s): s is string => !!s)
  srcIndex.value = 0
  nextTick(() => loadCurrentSrc())
}

watch(payed, (v) => {
  if (v && link.value) startPlay()
})

onBeforeUnmount(() => {
  if (hls) hls.destroy()
})

onMounted(async () => {
  h5.load()
  if (!h5.ready()) {
    const f = String(route.query.f || '')
    if (f) {
      navigateTo(`/?f=${encodeURIComponent(f)}`, { replace: true })
      return
    }
    errorMsg.value = '请通过推广链接进入'
    loading.value = false
    return
  }
  await check()
})

async function check() {
  loading.value = true
  try {
    const r = await $fetch<{
      code: number
      msg: string
      data?: { payed: boolean; link: { url: string; url2?: string; url3?: string; img: string; title: string }; desc: string; expire: string; recoverUrl: string }
    }>(`/api/h5/video?vid=${vid}&f=${encodeURIComponent(h5.f.value)}`)
    if (r.code === 1 && r.data) {
      payed.value = true
      link.value = r.data.link
      desc.value = r.data.desc
      expire.value = r.data.expire
      recoverUrl.value = r.data.recoverUrl
    } else {
      payed.value = false
      // 未购：尝试取视频信息用于展示
      const v = await $fetch<{ code: number; data: any[] }>(
        `/api/h5/vlist?f=${encodeURIComponent(h5.f.value)}&page=1&limit=50`,
      ).catch(() => ({ code: 0, data: [] }))
      const item = (v.data || []).find((x) => x.id === vid)
      if (item) {
        link.value = { url: item.vid_url || '', img: item.img, title: item.title }
      } else {
        errorMsg.value = r.msg || '视频不存在!或者已过期!'
      }
    }
  } catch {
    errorMsg.value = '网络异常，请稍后重试'
  } finally {
    loading.value = false
  }
}

function openPay() {
  if (!link.value) return
  payShow.value = true
}

function onPaid() {
  check()
}

const paidSince = computed(() => (payed.value && link.value ? `${desc.value || '单片'} · 有效期至 ${expire.value || '-'}` : ''))
</script>

<template>
  <div class="h5-page h5-detail">
    <van-nav-bar class="h5-navbar" fixed placeholder>
      <template #left>
        <van-icon name="arrow-left" @click="router.back()" />
      </template>
      <template #right>
        <van-icon name="star-o" @click="favShow = true" />
      </template>
    </van-nav-bar>

    <van-loading v-if="loading" style="padding: 80px 0" color="#f53036" vertical>加载中...</van-loading>

    <div v-else-if="errorMsg" class="detail-error">
      <div style="font-size: 46px">🎬</div>
      <p>{{ errorMsg }}</p>
      <van-button type="primary" size="small" color="#f53036" round @click="router.back()">返回</van-button>
    </div>

    <template v-else-if="link">
      <!-- 已购：播放器（外链） -->
      <div v-if="payed" class="player-wrap">
        <video v-if="link.url" ref="videoEl" :src="playSrc || link.url" controls autoplay playsinline class="player" :poster="link.img" @error="nextSrc" />
        <div v-else class="player-empty">视频源缺失</div>
      </div>

      <!-- 未购：封面 + 打赏后观影 -->
      <div v-else class="unpaid-wrap">
        <img :src="link.img" class="unpaid-cover" alt="" />
        <div class="unpaid-mask">
          <van-icon name="play-circle-o" class="unpaid-play" />
          <span class="unpaid-tip">打赏后观影</span>
        </div>
      </div>

      <div class="detail-info">
        <div class="detail-title">{{ link.title }}</div>
        <div v-if="paidSince" class="detail-paid">{{ paidSince }}</div>
        <div class="detail-btns">
          <van-button v-if="payed" type="primary" round block color="#f53036" @click="payShow = true">打赏续播</van-button>
          <van-button v-else type="primary" round block color="#f53036" @click="openPay">立即打赏观看</van-button>
        </div>
        <div v-if="recoverUrl" class="recover-tip">
          <div style="font-weight: 600">保存观看链接，换设备也能看</div>
          <div style="word-break: break-all; font-size: 12px; color: #969799; margin-top: 6px">{{ recoverUrl }}</div>
        </div>
      </div>
    </template>

    <PaySheet v-model:show="payShow" :vid="vid" :title="link?.title || ''" :img="link?.img || ''" @paid="onPaid" />
    <FavModal v-model:show="favShow" :url="h5.promoUrl()" />
    <AppTabbar />
  </div>
</template>

<style scoped>
.player-wrap {
  background: #000;
}
.player {
  width: 100%;
  height: 240px;
  display: block;
  object-fit: contain;
}
.player-empty {
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #969799;
}
.unpaid-wrap {
  position: relative;
  height: 280px;
  background: #000;
}
.unpaid-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.5;
}
.unpaid-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
}
.unpaid-play {
  font-size: 56px;
}
.unpaid-tip {
  font-size: 14px;
  letter-spacing: 2px;
}
.detail-info {
  padding: 16px;
  background: #fff;
}
.detail-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}
.detail-paid {
  font-size: 12px;
  color: #67c23a;
  margin-top: 6px;
}
.detail-btns {
  margin-top: 16px;
}
.recover-tip {
  margin-top: 16px;
  padding: 12px;
  background: #fff7e6;
  border-radius: 8px;
  font-size: 13px;
  color: #8f5b00;
}
.detail-error {
  text-align: center;
  padding: 80px 24px;
  color: #969799;
  font-size: 14px;
}
.detail-error p {
  margin: 16px 0 20px;
}
</style>
