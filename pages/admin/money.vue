<script setup lang="ts">
definePageMeta({ layout: 'admin' })
// 余额流水（扣量可审计：biz=kouliang 单独打标）
const { api } = useAdminApi()

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const biz = ref('all')
const loading = ref(false)

const bizText: Record<string, string> = {
  income: '打赏收入',
  ticheng: '分销抽成',
  kouliang: '扣量单',
  cash: '提现打款',
  adjust: '人工调整',
}

async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: String(page.value), pageSize: String(pageSize.value) })
    if (biz.value !== 'all') params.set('biz', biz.value)
    const r = await api(`/api/admin/money-logs?${params.toString()}`)
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
      <el-select v-model="biz" style="width: 160px" @change="page = 1; load()">
        <el-option label="全部类型" value="all" />
        <el-option v-for="(v, k) in bizText" :key="k" :label="v" :value="k" />
      </el-select>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="代理" width="130">
        <template #default="{ row }">{{ row.agent?.nickname || row.agent?.username || `#${row.uid}` }}</template>
      </el-table-column>
      <el-table-column label="金额" width="110">
        <template #default="{ row }">
          <span :style="{ color: row.type === 1 ? '#67c23a' : '#f53036', fontWeight: 600 }">
            {{ row.type === 1 ? '+' : '-' }}¥{{ Number(row.money).toFixed(2) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="变动前" width="100">
        <template #default="{ row }">¥{{ Number(row.before).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="变动后" width="100">
        <template #default="{ row }">¥{{ Number(row.after).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="类型" width="110">
        <template #default="{ row }">
          <el-tag :type="row.biz === 'kouliang' ? 'warning' : row.type === 1 ? 'success' : 'danger'" size="small">
            {{ bizText[row.biz] || row.biz }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="memo" label="备注" min-width="220" show-overflow-tooltip />
      <el-table-column label="时间" width="160">
        <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString('zh-CN') }}</template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 12px; display: flex; justify-content: flex-end">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="total, prev, pager, next, sizes" :page-sizes="[10, 20, 50, 100]" @change="load" />
    </div>
  </div>
</template>
