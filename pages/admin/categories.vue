<script setup lang="ts">
// 分类管理
import { ElMessage, ElMessageBox } from 'element-plus'

const { api } = useAdminApi()

const list = ref<any[]>([])
const loading = ref(false)
const dialog = reactive({ show: false, edit: false, form: {} as Record<string, any> })

async function load() {
  loading.value = true
  try {
    const r = await api('/api/admin/categories')
    if (r?.code === 1) list.value = r.data.list
  } finally {
    loading.value = false
  }
}
onMounted(load)

function openCreate() {
  dialog.edit = false
  dialog.form = { name: '', nickname: '', image: '', weigh: 0, status: 'normal' }
  dialog.show = true
}
function openEdit(row: any) {
  dialog.edit = true
  dialog.form = { ...row }
  dialog.show = true
}

async function submit() {
  const f = dialog.form
  if (!f.name) {
    ElMessage.warning('请输入分类名')
    return
  }
  const url = dialog.edit ? `/api/admin/categories/${f.id}` : '/api/admin/categories'
  const r = await api(url, {
    method: dialog.edit ? 'PUT' : 'POST',
    body: { name: f.name, nickname: f.nickname, image: f.image, weigh: f.weigh, status: f.status },
  })
  if (r?.code === 1) {
    ElMessage.success('保存成功')
    dialog.show = false
    load()
  } else {
    ElMessage.error(r?.msg || '保存失败')
  }
}

async function remove(row: any) {
  await ElMessageBox.confirm(`确认删除分类「${row.name}」？`, '提示', { type: 'warning' })
  const r = await api(`/api/admin/categories/${row.id}`, { method: 'DELETE' })
  if (r?.code === 1) {
    ElMessage.success('已删除')
    load()
  }
}
</script>

<template>
  <div>
    <div class="toolbar">
      <div style="flex: 1"></div>
      <el-button type="danger" @click="openCreate">＋ 新增分类</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="分类名" min-width="120" />
      <el-table-column prop="nickname" label="别名" min-width="120" />
      <el-table-column label="图片" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">{{ row.image || '-' }}</template>
      </el-table-column>
      <el-table-column prop="weigh" label="权重" width="80" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="row.status === 'normal' ? 'success' : 'danger'">{{ row.status === 'normal' ? '正常' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog.show" :title="dialog.edit ? '编辑分类' : '新增分类'" width="440px">
      <el-form :model="dialog.form" label-width="80px">
        <el-form-item label="分类名"><el-input v-model="dialog.form.name" /></el-form-item>
        <el-form-item label="别名"><el-input v-model="dialog.form.nickname" /></el-form-item>
        <el-form-item label="图片"><el-input v-model="dialog.form.image" placeholder="分类图标 URL（可选）" /></el-form-item>
        <el-form-item label="权重"><el-input-number v-model="dialog.form.weigh" :min="0" style="width: 100%" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.show = false">取消</el-button>
        <el-button type="danger" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
