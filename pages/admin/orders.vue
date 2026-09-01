<script setup lang="ts">
// 订单列表（扣量筛选 / 详情）
import { ElMessage } from 'element-plus'

const { api } = useAdminApi()

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const status = ref<number | undefined>(undefined)
const isKouliang = ref<number | undefined>(undefined)
const keyword = ref('')
const loading = ref(false)
const detail = ref<any>(null)
const detailShow = ref(false)

async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: String(page.value), pageSize: String(pageSize.value), keyword: encodeURIComponent(keyword.value) })
    if (status.value !== undefined && status.value !== -99) params.set('status', String(status.value))
    if (isKouliang.value !== undefined && isKouliang.value !== -99) params.set('is_kouliang', String(isKouliang.value))
    const r = await api(`/api/admin/orders?${params.toString()}`)
    if (r?.code === 1) {
      list.value = r.data.list
      total.value = r.data.total
    }
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function openDetail(row: any) {
  const r = await api(`/api/admin/orders/${row.id}`)
  if (r?.code === 1) {
    detail.value = r.data
    detailShow.value = true
  }
}

async function markPaid(row: any) {
  const r = await api(`/api/admin/orders/${row.id}/mark`, { method: 'POST', body: { status: 1 } })
  if (r?.code === 1) {
    ElMessage.success('已标记为已支付')
    load()
  } else {
    ElMessage.error(r?.msg || '操作失败')
  }
}
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
      <el-input v-model="keyword" placeholder="订单号/IP" clearable style="width: 220px" @keyup.enter="page = 1; load()" @clear="page = 1; load()" />
      <el-button type="primary" @click="page = 1; load()">搜索</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="transact" label="订单号" width="200" show-overflow-tooltip />
      <el-table-column label="代理" width="120">
        <template #default="{ row }">{{ row.agent?.nickname || row.agent?.username || '-' }}</template>
      </el-table-column>
      <el-table-column label="视频" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">{{ row.stock?.title || `#${row.vid}` }}</template>
      </el-table-column>
      <el-table-column label="金额" width="100">
        <template #default="{ row }"><span style="color: #f53036; font-weight: 600">¥{{ Number(row.price).toFixed(2) }}</span></template>
      </el-table-column>
      <el-table-column prop="ip" label="IP" width="130" />
      <el-table-column label="扣量" width="80">
        <template #default="{ row }">
          <el-tag v-if="row.isKouliang === 2" type="warning" size="small">扣量</el-tag>
          <span v-else style="color: #c0c4cc">正常</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '已支付' : '未支付' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="下单时间" width="160">
        <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString('zh-CN') }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
          <el-button v-if="row.status !== 1" link type="success" size="small" @click="markPaid(row)">标记已付</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 12px; display: flex; justify-content: flex-end">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="total, prev, pager, next, sizes" :page-sizes="[10, 20, 50, 100]" @change="load" />
    </div>

    <el-dialog v-model="detailShow" title="订单详情" width="520px">
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="订单号">{{ detail.transact }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detail.status === 1 ? '已支付' : '未支付' }}</el-descriptions-item>
        <el-descriptions-item label="代理">{{ detail.agent?.nickname || detail.uid }}</el-descriptions-item>
        <el-descriptions-item label="视频">{{ detail.stock?.title || detail.vid }}</el-descriptions-item>
        <el-descriptions-item label="金额">¥{{ Number(detail.price).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="扣量">{{ detail.isKouliang === 2 ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="IP">{{ detail.ip }}</el-descriptions-item>
        <el-descriptions-item label="套餐">{{ detail.isMonth === 2 ? '包月' : detail.isWeek === 2 ? '包周' : detail.isDate === 2 ? '包日' : '单片' }}</el-descriptions-item>
        <el-descriptions-item label="支付通道">{{ detail.payChannel }}</el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ new Date(detail.createdAt).toLocaleString('zh-CN') }}</el-descriptions-item>
        <el-descriptions-item label="支付时间" :span="2">{{ detail.payTime ? new Date(detail.payTime).toLocaleString('zh-CN') : '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.des || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>
