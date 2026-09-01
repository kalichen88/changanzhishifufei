<script setup lang="ts">
definePageMeta({ layout: 'admin' })
// 模板管理（落地模板启停）
import { ElMessage } from 'element-plus'

const { api } = useAdminApi()

const list = ref<any[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const r = await api('/api/admin/mubans')
    if (r?.code === 1) list.value = r.data.list
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function toggleStatus(row: any) {
  const next = row.status === '1' ? '0' : '1'
  const r = await api(`/api/admin/mubans/${row.id}/status`, { method: 'PUT', body: { status: next } })
  if (r?.code === 1) {
    ElMessage.success('状态已更新')
    load()
  } else {
    ElMessage.error(r?.msg || '操作失败')
  }
}
</script>

<template>
  <div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="title" label="模板名称" min-width="160" />
      <el-table-column prop="muban" label="模板标识" width="160">
        <template #default="{ row }"><el-tag size="small">{{ row.muban }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="desc" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="row.status === '1' ? 'success' : 'info'" size="small">{{ row.status === '1' ? '启用' : '关闭' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button link :type="row.status === '1' ? 'danger' : 'success'" size="small" @click="toggleStatus(row)">
            {{ row.status === '1' ? '停用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
