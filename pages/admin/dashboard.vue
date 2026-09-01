<script setup lang="ts">
// 总后台数据看板
const { api } = useAdminApi()

const stats = ref<any>(null)
const loading = ref(true)

const fmtYuan = (cents: number) => `¥${(cents / 100).toFixed(2)}`

onMounted(async () => {
  try {
    const r = await api('/api/admin/dashboard')
    if (r?.code === 1) stats.value = r.data
  } finally {
    loading.value = false
  }
})

const cards = computed(() => {
  const s = stats.value || {}
  return [
    { label: '今日订单', value: s.todayOrders ?? '-', sub: `昨日 ${s.yesterdayOrders ?? 0}`, color: '#f53036' },
    { label: '今日收益', value: fmtYuan(s.todayIncomeCents ?? 0), sub: `昨日 ${fmtYuan(s.yesterdayIncomeCents ?? 0)}`, color: '#67c23a' },
    { label: '今日扣量', value: s.todayKouliang ?? '-', sub: `昨日 ${s.yesterdayKouliang ?? 0}`, color: '#e6a23c' },
    { label: '本月订单', value: s.monthOrders ?? '-', sub: '本月累计', color: '#2d8cf0' },
    { label: '代理总数', value: s.agentCount ?? '-', sub: '全部代理', color: '#909399' },
    { label: '片库数量', value: s.stockCount ?? '-', sub: '启用视频', color: '#8f5cd9' },
  ]
})
</script>

<template>
  <div>
    <el-row :gutter="16">
      <el-col v-for="c in cards" :key="c.label" :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value" :style="{ color: c.color }">{{ c.value }}</div>
          <div class="stat-label">{{ c.label }}</div>
          <div class="stat-sub">{{ c.sub }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="page-card">
          <template #header><b>代理余额 TOP10</b></template>
          <el-table :data="stats?.agentBalances || []" size="small" v-loading="loading">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column label="代理">
              <template #default="{ row }">{{ row.nickname }}（{{ row.username }}）</template>
            </el-table-column>
            <el-table-column label="余额">
              <template #default="{ row }">
                <span style="color: #f53036; font-weight: 600">¥{{ Number(row.balance).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态">
              <template #default="{ row }">
                <el-tag :type="row.status === 'normal' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'normal' ? '正常' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="page-card">
          <template #header><b>最近订单</b></template>
          <el-table :data="stats?.recentOrders || []" size="small" v-loading="loading">
            <el-table-column prop="transact" label="订单号" width="190" />
            <el-table-column prop="vid" label="视频ID" width="80" />
            <el-table-column label="金额">
              <template #default="{ row }">¥{{ Number(row.price).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="扣量">
              <template #default="{ row }">
                <el-tag v-if="row.isKouliang === 2" type="warning" size="small">扣量</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="状态">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                  {{ row.status === 1 ? '已支付' : '未支付' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.stat-card {
  text-align: center;
  margin-bottom: 16px;
  border-radius: 8px;
}
.stat-value {
  font-size: 26px;
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
