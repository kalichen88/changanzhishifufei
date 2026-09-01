<script setup lang="ts">
// 我的域名（含推广主链类型说明）
const { api } = useAgentApi()

const list = ref<any[]>([])
const loading = ref(false)

const typeText: Record<number, string> = { 1: '入口域名', 2: '落地域名(推广主链)', 3: '支付域名' }
const typeType: Record<number, any> = { 1: 'info', 2: 'danger', 3: 'warning' }

async function load() {
  loading.value = true
  try {
    const r = await api('/api/agent/my-domains')
    if (r?.code === 1) list.value = r.data.list
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>

<template>
  <div>
    <el-alert
      type="info"
      :closable="false"
      style="margin-bottom: 16px"
      title="以下是你绑定的独立推广域名（一代理一域名）。落地域名(type=2)为你的推广主链域名，访客通过它进入并归属到你名下。如域名池不足，请联系站长添加。"
    />

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="domain" label="域名" min-width="220">
        <template #default="{ row }"><code style="color: #f53036">{{ row.domain }}</code></template>
      </el-table-column>
      <el-table-column label="类型" width="180">
        <template #default="{ row }">
          <el-tag :type="typeType[row.type] || 'info'" size="small">{{ typeText[row.type] || row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="绑定时间" width="180">
        <template #default="{ row }">{{ row.bindTime ? new Date(row.bindTime).toLocaleString('zh-CN') : '-' }}</template>
      </el-table-column>
    </el-table>
  </div>
</template>
