<script setup lang="ts">
import { showToast, showSuccessToast, showLoadingToast, closeToast } from 'vant'

const props = defineProps<{ show: boolean; vid: number; title: string; img: string }>()
const emit = defineEmits<{ (e: 'update:show', v: boolean): void; (e: 'paid'): void }>()

const h5 = useH5()
const loading = ref(false)
const paying = ref(false)
const options = ref<Array<{ name: string; flg: string; money: number; img: string }>>([])
const stockTitle = ref('')
const payDesc = ref('')

watch(
  () => props.show,
  async (v) => {
    if (!v) return
    loading.value = true
    try {
      const r = await $fetch<{
        code: number
        stock?: { title?: string }
        pay?: Array<{ name: string; flg: string; money: number; img: string }>
      }>(`/api/h5/pay/options?vid=${props.vid}&f=${h5.f.value}`)
      stockTitle.value = r.stock?.title || props.title
      options.value = r.pay || []
    } catch {
      options.value = []
    } finally {
      loading.value = false
    }
  },
)

function bodyFor(flg: string) {
  const base: Record<string, unknown> = { f: h5.f.value, vid: props.vid }
  if (flg === 'date_fee') base.is_date = 2
  else if (flg === 'week_fee') base.is_week = 2
  else if (flg === 'month_fee') base.is_month = 2
  return base
}

/** 发起支付（占位：mock 网关 → 模拟支付成功回调） */
async function startPay(flg: string) {
  if (!h5.f.value) {
    showToast('推广链接失效，请重新进入')
    return
  }
  paying.value = true
  showLoadingToast({ message: '正在吊起支付,请稍后!', forbidClick: true, duration: 0 })
  try {
    const r = await $fetch<{
      code: number
      msg: string
      data?: { transact: string; mode: string; price: number; desc: string }
    }>('/api/h5/pay/create', {
      method: 'POST',
      body: bodyFor(flg),
    })
    closeToast()
    if (r.code !== 1 || !r.data) {
      showToast(r.msg || '下单失败')
      paying.value = false
      return
    }
    payDesc.value = `${r.data.desc} ¥${r.data.price}`
    // 占位支付：模拟网关一键回调
    await simulatePay(r.data.transact)
  } catch (e: any) {
    closeToast()
    paying.value = false
    showToast(e?.data?.msg || '支付发起失败')
  }
}

async function simulatePay(transact: string) {
  try {
    const res = await $fetch('/api/pay/mock/callback', {
      method: 'POST',
      body: { transact },
      responseType: 'text',
    })
    if (String(res).trim() !== 'success') {
      showToast('支付失败，请重试')
      paying.value = false
      return
    }
    // 轮询确认
    let ok = false
    for (let i = 0; i < 10; i++) {
      const st = await $fetch<{ code: number; msg: string }>(`/api/h5/pay/status?transact=${transact}`)
      if (st.code === 1) {
        ok = true
        break
      }
      await new Promise((r) => setTimeout(r, 800))
    }
    paying.value = false
    if (ok) {
      showSuccessToast('支付成功')
      emit('update:show', false)
      emit('paid')
    } else {
      showToast('支付结果确认中，请稍后重试')
    }
  } catch {
    paying.value = false
    showToast('支付失败，请重试')
  }
}
</script>

<template>
  <van-popup :show="props.show" position="bottom" round class="pay-sheet" @update:show="(v) => emit('update:show', v)">
    <div style="padding: 16px 16px 24px">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px">
        <img :src="mediaProxyUrl(props.img)" style="width: 60px; height: 80px; object-fit: cover; border-radius: 6px" alt="" />
        <div style="flex: 1; min-width: 0">
          <div style="font-size: 14px; font-weight: 600; color: #323233; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
            {{ stockTitle || props.title }}
          </div>
          <div style="font-size: 12px; color: #969799; margin-top: 4px">打赏后观影 · 免登录直接观看</div>
        </div>
      </div>

      <van-loading v-if="loading" style="padding: 24px 0" />

      <template v-else>
        <div v-if="options.length === 0" style="text-align: center; color: #969799; padding: 24px 0">该代理暂未开放购买</div>
        <div v-for="(opt, i) in options" :key="i" class="pay-opt" :class="{ busy: paying }" @click="paying ? null : startPay(opt.flg)">
          <div style="display: flex; align-items: center; gap: 8px">
            <img src="/h5/img/icon1.png" style="width: 18px; height: 18px" alt="" />
            <span style="font-size: 14px; color: #323233">{{ opt.name }}</span>
          </div>
          <van-icon name="arrow" style="color: #c8c9cc" />
        </div>
        <div v-if="payDesc" style="text-align: center; font-size: 12px; color: #f53036; margin-top: 8px">已发起：{{ payDesc }}</div>
      </template>

      <van-button block round style="margin-top: 16px; border: 1px solid #dcdee0; color: #646566" @click="emit('update:show', false)">关闭</van-button>
    </div>
  </van-popup>
</template>

<style scoped>
.pay-opt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: #fff7f7;
  border: 1px solid #ffe0e0;
}
.pay-opt.busy {
  opacity: 0.6;
}
</style>
