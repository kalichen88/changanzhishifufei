<script setup lang="ts">
definePageMeta({ layout: 'admin' })
// 提现审核（待审 → 通过/驳回 → 确认打款）
import { ElMessage, ElMessageBox } from 'element-plus'

const { api } = useAdminApi()

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const status = ref<number | undefined>(undefined)
const loading = ref(false)

const statusText: Record<number, string> = { 0: '待审核', 1: '已通过', 2: '已驳回', 3: '已打款' }
const statusType: Record<number, any> = { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info' }
const typeText: Record<number, string> = { 0: '微信', 1: '支付宝', 2: '其他' }

async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: String(page.value), pageSize: String(pageSize.value) })
    if (status.value !== undefined && status.value !== -99) params.set('status', String(status.value))
    const r = await api(`/api/admin/cash-advances?${params.toString()}`)
    if (r?.code === 1) {
      list.value = r.data.list
      total.value = r.data.total
    }
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function doAction(row: any, action: 'pass' | 'reject' | 'paid', label: string) {
  try {
    await ElMessageBox.confirm(`确定${label}该提现申请（¥${Number(row.money).toFixed(2)}）？`, '提示', { type: 'warning' })
  } catch {
    return
  }
  const r = await api(`/api/admin/cash-advances/${row.id}`, { method: 'PUT', body: { action, remark: '' } })
  if (r?.code === 1) {
    ElMessage.success('操作成功')
    load()
  } else {
    ElMessage.error(r?.msg || '操作失败')
  }
}
</script>

<template>
  <div>
    <div class="toolbar">
      <el-select v-model="status" placeholder="全部状态" clearable style="width: 140px" @change="page = 1; load()">
        <el-option label="待审核" :value="0" />
        <el-option label="已通过" :value="1" />
        <el-option label="已驳回" :value="2" />
        <el-option label="已打款" :value="3" />
      </el-select>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="代理" width="130">
        <template #default="{ row }">{{ row.agent?.nickname || row.agent?.username || `#${row.uid}` }}</template>
      </el-table-column>
      <el-table-column label="申请金额" width="110">
        <template #default="{ row }"><span style="color: #f53036; font-weight: 600">¥{{ Number(row.money).toFixed(2) }}</span></template>
      </el-table-column>
      <el-table-column label="手续费" width="90">
        <template #default="{ row }">¥{{ Number(row.poundage).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="实际到账" width="100">
        <template #default="{ row }">¥{{ Number(row.realMoney).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="收款方式" width="90">
        <template #default="{ row }">{{ typeText[row.type] || '-' }}</template>
      </el-table-column>
      <el-table-column prop="account" label="收款账号" min-width="150" show-overflow-tooltip />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusType[row.status]" size="small">{{ statusText[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="申请时间" width="160">
        <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString('zh-CN') }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status === 0" link type="success" size="small" @click="doAction(row, 'pass', '通过')">通过</el-button>
          <el-button v-if="row.status === 0" link type="danger" size="small" @click="doAction(row, 'reject', '驳回')">驳回</el-button>
          <el-button v-if="row.status === 1" link type="primary" size="small" @click="doAction(row, 'paid', '确认打款')">确认打款</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 12px; display: flex; justify-content: flex-end">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="total, prev, pager, next, sizes" :page-sizes="[10, 20, 50, 100]" @change="load" />
    </div>
  </div>
</template>
