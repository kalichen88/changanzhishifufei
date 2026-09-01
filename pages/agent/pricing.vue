<script setup lang="ts">
definePageMeta({ layout: 'agent' })
// 独立定价：单视频改价 + 一键批量改价
import { ElMessage } from 'element-plus'

const { api } = useAgentApi()

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const defaultPrice = ref(0)
const loading = ref(false)
const batchDialog = ref(false)
const batchForm = reactive({ price: 0, mode: 'set' })

async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: String(page.value), pageSize: String(pageSize.value) })
    if (keyword.value) params.set('keyword', keyword.value)
    const r = await api(`/api/agent/stock-prices?${params.toString()}`)
    if (r?.code === 1) {
      list.value = r.data.list
      total.value = r.data.total
      defaultPrice.value = Number(r.data.defaultPrice || 0)
    }
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function savePrice(row: any) {
  const r = await api(`/api/agent/stock-prices/${row.id}`, { method: 'PUT', body: { price: Number(row.myPrice || 0) } })
  if (r?.code === 1) {
    ElMessage.success(r.msg || '保存成功')
  } else {
    ElMessage.error(r?.msg || '保存失败')
  }
  load()
}

async function submitBatch() {
  if (!batchForm.price || batchForm.price <= 0) {
    ElMessage.warning('请输入正确的价格')
    return
  }
  const r = await api('/api/agent/stock-prices/batch', { method: 'PUT', body: batchForm })
  if (r?.code === 1) {
    ElMessage.success(`已批量修改 ${r.data.changed} 个视频`)
    batchDialog.value = false
    load()
  } else {
    ElMessage.error(r?.msg || '操作失败')
  }
}
</script>

<template>
  <div>
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="按标题/分类搜索" clearable style="width: 220px" @keyup.enter="page = 1; load()" @clear="page = 1; load()" />
      <el-button type="primary" @click="page = 1; load()">搜索</el-button>
      <el-button type="danger" style="margin-left: 12px" @click="batchDialog = true">一键批量改价</el-button>
      <span style="margin-left: 12px; color: #909399; font-size: 13px">当前默认单价：¥{{ defaultPrice }}</span>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
      <el-table-column label="默认价" width="100">
        <template #default="{ row }">¥{{ Number(row.defaultPrice).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="我的定价（元）" width="160">
        <template #default="{ row }">
          <el-input-number v-model="row.myPrice" :min="0" :precision="2" :step="0.5" size="small" controls-position="right" style="width: 120px" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="110">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="savePrice(row)">保存</el-button>
          <el-button v-if="row.myPrice !== null" link type="danger" size="small" @click="row.myPrice = 0; savePrice(row)">恢复默认</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 12px; display: flex; justify-content: flex-end">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="total, prev, pager, next, sizes" :page-sizes="[10, 20, 50, 100]" @change="load" />
    </div>

    <el-dialog v-model="batchDialog" title="一键批量改价" width="420px">
      <el-form :model="batchForm" label-width="90px">
        <el-form-item label="操作方式">
          <el-radio-group v-model="batchForm.mode">
            <el-radio value="set">设为</el-radio>
            <el-radio value="add">加价</el-radio>
            <el-radio value="sub">减价</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="价格（元）">
          <el-input-number v-model="batchForm.price" :min="0.01" :precision="2" :step="0.5" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDialog = false">取消</el-button>
        <el-button type="primary" @click="submitBatch">执行</el-button>
      </template>
    </el-dialog>
  </div>
</template>
