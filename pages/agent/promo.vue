<script setup lang="ts">
// 推广中心：独立域名推广链接 + 二维码
import { ElMessage } from 'element-plus'

const { api } = useAgentApi()

const loading = ref(false)
const data = ref<any>(null)
const qrImg = ref('')
const copying = ref(false)

async function load() {
  loading.value = true
  try {
    const r = await api('/api/agent/promo/link')
    if (r?.code === 1) {
      data.value = r.data
      qrImg.value = `${r.data.qrUrl}&t=${Date.now()}`
    } else {
      ElMessage.error(r?.msg || '生成推广链接失败')
    }
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function copyLink() {
  if (!data.value?.url) return
  copying.value = true
  try {
    await navigator.clipboard.writeText(data.value.url)
    ElMessage.success('推广链接已复制')
  } catch {
    ElMessage.error('复制失败，请手动长按复制')
  } finally {
    copying.value = false
  }
}
</script>

<template>
  <div>
    <el-alert
      type="info"
      :closable="false"
      style="margin-bottom: 16px"
      title="把下面的推广链接或二维码分享给访客，访客点击即进入你的独立推广落地页，免登录直购。"
    />

    <el-row :gutter="16">
      <el-col :xs="24" :md="14">
        <el-card shadow="never" class="page-card" v-loading="loading">
          <template #header><b>推广链接</b></template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="独立域名">
              <span style="color: #f53036; font-weight: 600">{{ data?.domain || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="推广链接">
              <div style="word-break: break-all">{{ data?.url || '-' }}</div>
            </el-descriptions-item>
            <el-descriptions-item label="推广参数 f">
              <code>{{ data?.f || '-' }}</code>
            </el-descriptions-item>
          </el-descriptions>
          <div style="margin-top: 16px; display: flex; gap: 12px">
            <el-button type="danger" :loading="copying" @click="copyLink">复制推广链接</el-button>
            <el-button @click="load">重新生成</el-button>
          </div>
          <p style="color: #909399; font-size: 12px; margin-top: 12px">
            提示：请将链接末尾的 <code>f</code> 参数原样保留，删除会导致访客无法归属到你的名下。
          </p>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="10">
        <el-card shadow="never" class="page-card" v-loading="loading">
          <template #header><b>推广二维码</b></template>
          <div style="text-align: center; padding: 8px 0">
            <img v-if="qrImg" :src="qrImg" alt="推广二维码" style="width: 220px; height: 220px; object-fit: contain; border: 1px solid #eee; border-radius: 8px" />
            <el-empty v-else description="暂无二维码" :image-size="80" />
            <p style="color: #909399; font-size: 12px; margin-top: 10px">长按二维码可保存，分享给访客即可推广。</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
