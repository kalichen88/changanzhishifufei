<script setup lang="ts">
definePageMeta({ layout: 'agent' })
// 我的订单（含扣量状态列）
const { api } = useAgentApi()

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const status = ref<number | undefined>(undefined)
const isKouliang = ref<number | undefined>(undefined)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: String(page.value), pageSize: String(pageSize.value) })
    if (status.value !== undefined && status.value !== -99) params.set('status', String(status.value))
    if (isKouliang.value !== undefined && isKouliang.value !== -99) params.set('is_kouliang', String(isKouliang.value))
    const r = await api(`/api/agent/orders?${params.toString()}`)
    if (r?.code === 1) {
      list.value = r.data.list
      total.value = r.data.total
    }
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>

<template>
  <div>
    <div class="toolbar">
      <el-select v-model="status" placeholder="全部状态" clearable style="width: 130px" @change="page = 1; load()">
        <el-option label="已支付" :value="1" />
        <el-option label="未支付" :value="2" />
      </el-select>
      <el-select v-model="isKouliang" placeholder="扣量状态" clearable style="width: 130px" @change="page = 1; load()">
        <el-option label="正常单" :value="1" />
        <el-option label="扣量单" :value="2" />
      </el-select>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="transact" label="订单号" width="200" show-overflow-tooltip />
      <el-table-column label="视频" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">{{ row.stock?.title || `#${row.vid}` }}</template>
      </el-table-column>
      <el-table-column label="金额" width="100">
        <template #default="{ row }"><span style="color: #f53036; font-weight: 600">¥{{ Number(row.price).toFixed(2) }}</span></template>
      </el-table-column>
      <el-table-column label="提成" width="90">
        <template #default="{ row }">¥{{ Number(row.tcMoney).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="扣量" width="80">
        <template #default="{ row }">
          <el-tag v-if="row.isKouliang === 2" type="warning" size="small">扣量</el-tag>
          <span v-else style="color: #c0c4cc">正常</span>
        </template>
      </el-table-column>
      <el-table-column label="套餐" width="90">
        <template #default="{ row }">{{ row.isMonth === 2 ? '包月' : row.isWeek === 2 ? '包周' : row.isDate === 2 ? '包日' : '单片' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '已支付' : '未支付' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="下单时间" width="160">
        <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString('zh-CN') }}</template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 12px; display: flex; justify-content: flex-end">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="total, prev, pager, next, sizes" :page-sizes="[10, 20, 50, 100]" @change="load" />
    </div>
  </div>
</template>
