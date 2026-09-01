<script setup lang="ts">
definePageMeta({ layout: 'agent' })
// 模板选择（落地页模板）
import { ElMessage } from 'element-plus'

const { api } = useAgentApi()

const list = ref<any[]>([])
const myViewId = ref(0)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const r = await api('/api/agent/mubans')
    if (r?.code === 1) {
      list.value = r.data.list
      myViewId.value = r.data.myViewId
    }
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function choose(m: any) {
  const r = await api('/api/agent/my-muban', { method: 'PUT', body: { viewId: m.id } })
  if (r?.code === 1) {
    ElMessage.success('模板已切换，访客落地页将使用该模板')
    myViewId.value = m.id
  } else {
    ElMessage.error(r?.msg || '切换失败')
  }
}
</script>

<template>
  <div>
    <el-alert type="info" :closable="false" style="margin-bottom: 16px" title="选择后，从你的推广链接进入的访客将看到该模板的落地页。" />
    <el-row :gutter="16" v-loading="loading">
      <el-col v-for="m in list" :key="m.id" :xs="12" :sm="8" :md="6">
        <el-card shadow="hover" class="muban-card" :class="{ active: myViewId === m.id }">
          <div class="muban-thumb">
            <img v-if="m.image" :src="m.image" :alt="m.title || m.muban" />
            <div v-else class="muban-ph">📄</div>
          </div>
          <div class="muban-title">{{ m.title || m.muban }}</div>
          <div class="muban-desc">{{ m.desc || (m.muban === 'muban6' ? '卡片流 · 还原原版' : '落地模板') }}</div>
          <div style="margin-top: 10px">
            <el-tag v-if="myViewId === m.id" type="success" size="small">当前使用</el-tag>
            <el-button v-else type="danger" size="small" plain @click="choose(m)">使用此模板</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.muban-card {
  margin-bottom: 16px;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}
.muban-card.active {
  border-color: #f53036;
}
.muban-thumb {
  height: 130px;
  background: #f2f3f5;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.muban-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.muban-ph {
  font-size: 40px;
}
.muban-title {
  font-weight: 600;
  margin-top: 10px;
}
.muban-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  min-height: 32px;
}
</style>
