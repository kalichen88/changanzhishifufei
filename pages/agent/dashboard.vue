<script setup lang="ts">
// 代理数据面板
const { api } = useAgentApi()

const stats = ref<any>(null)
const loading = ref(true)
const fmtYuan = (n: any) => `¥${Number(n || 0).toFixed(2)}`

onMounted(async () => {
  try {
    const r = await api('/api/agent/dashboard')
    if (r?.code === 1) stats.value = r.data
  } finally {
    loading.value = false
  }
})

const cards = computed(() => {
  const s = stats.value || {}
  return [
    { label: '我的余额', value: fmtYuan(s.agent?.balance), sub: `提成 ${s.agent?.ticheng || 0}%`, color: '#f53036' },
    { label: '今日订单', value: s.todayOrders ?? '-', sub: '今日累计', color: '#2d8cf0' },
    { label: '今日收益', value: fmtYuan(s.todayIncomeCents), sub: '今日累计', color: '#67c23a' },
    { label: '今日扣量', value: s.todayKouliang ?? '-', sub: '每N单扣1单', color: '#e6a23c' },
    { label: '本月订单', value: s.monthOrders ?? '-', sub: '本月累计', color: '#909399' },
    { label: '扣量参数', value: s.agent?.kouliang || 0, sub: s.agent?.kouliang ? '每N单扣1单' : '不扣量', color: '#8f5cd9' },
  ]
})
</script>

<template>
  <div>
    <el-alert
      :closable="false"
      type="warning"
      style="margin-bottom: 16px"
      :title="`当前代理：${stats?.agent?.nickname || ''}（${stats?.agent?.username || ''}）　扣量参数：${stats?.agent?.kouliang || 0}　提成：${stats?.agent?.ticheng || 0}%`"
    />

    <el-row :gutter="16">
      <el-col v-for="c in cards" :key="c.label" :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value" :style="{ color: c.color }">{{ c.value }}</div>
          <div class="stat-label">{{ c.label }}</div>
          <div class="stat-sub">{{ c.sub }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="page-card" style="margin-top: 16px">
      <template #header><b>最近订单</b></template>
      <el-table :data="stats?.recentOrders || []" size="small" v-loading="loading">
        <el-table-column prop="transact" label="订单号" width="200" show-overflow-tooltip />
        <el-table-column prop="vid" label="视频ID" width="80" />
        <el-table-column label="金额">
          <template #default="{ row }">¥{{ Number(row.price).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="扣量">
          <template #default="{ row }">
            <el-tag v-if="row.isKouliang === 2" type="warning" size="small">扣量</el-tag>
            <span v-else>正常</span>
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '已支付' : '未支付' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="时间">
          <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString('zh-CN') }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.stat-card {
  text-align: center;
  margin-bottom: 16px;
  border-radius: 8px;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}
.stat-label {
  font-size: 14px;
  color: #606266;
  margin-top: 4px;
}
.stat-sub {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 2px;
}
</style>
