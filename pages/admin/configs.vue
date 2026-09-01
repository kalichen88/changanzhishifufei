<script setup lang="ts">
definePageMeta({ layout: 'admin' })
// 系统配置（KV 编辑，还原原版 site.php 关键项）
import { ElMessage } from 'element-plus'

const { api } = useAdminApi()

const list = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)

async function load() {
  loading.value = true
  try {
    const r = await api('/api/admin/configs')
    if (r?.code === 1) list.value = r.data.list
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function save() {
  saving.value = true
  try {
    const values: Record<string, string> = {}
    for (const c of list.value) values[c.name] = String(c.value ?? '')
    const r = await api('/api/admin/configs', { method: 'PUT', body: { values } })
    if (r?.code === 1) {
      ElMessage.success(`已保存 ${r.data.updated} 项配置`)
    } else {
      ElMessage.error(r?.msg || '保存失败')
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" :loading="saving" @click="save">保存全部配置</el-button>
      <span style="margin-left: 12px; color: #909399; font-size: 13px">单价单位为元；开关项 1=开启 0=关闭。</span>
    </div>

    <el-card shadow="never" v-loading="loading">
      <el-table :data="list" border stripe>
        <el-table-column prop="name" label="配置键" width="160">
          <template #default="{ row }"><code style="color: #f53036">{{ row.name }}</code></template>
        </el-table-column>
        <el-table-column prop="title" label="名称" width="180" />
        <el-table-column prop="tip" label="说明" min-width="160" show-overflow-tooltip />
        <el-table-column label="值">
          <template #default="{ row }">
            <el-input v-model="row.value" :type="row.type === 'editor' ? 'textarea' : 'text'" :rows="row.type === 'editor' ? 4 : 1" :placeholder="row.tip" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
