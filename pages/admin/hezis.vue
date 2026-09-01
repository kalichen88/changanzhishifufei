<script setup lang="ts">
// 盒子链接（推广落地盒 CRUD）
import { ElMessage, ElMessageBox } from 'element-plus'

const { api } = useAdminApi()

const list = ref<any[]>([])
const agents = ref<any[]>([])
const loading = ref(false)
const dialogShow = ref(false)
const editing = ref<any>(null)
const form = reactive({ uid: 0, video: '', title: '', status: '1' })

async function load() {
  loading.value = true
  try {
    const r = await api('/api/admin/hezis')
    if (r?.code === 1) list.value = r.data.list
  } finally {
    loading.value = false
  }
}

async function loadAgents() {
  const r = await api('/api/admin/admins?pageSize=200')
  if (r?.code === 1) agents.value = r.data.list
}

onMounted(() => {
  load()
  loadAgents()
})

function openCreate() {
  editing.value = null
  Object.assign(form, { uid: 0, video: '', title: '', status: '1' })
  dialogShow.value = true
}

function openEdit(row: any) {
  editing.value = row
  Object.assign(form, { uid: row.uid, video: row.video || '', title: row.title || '', status: row.status })
  dialogShow.value = true
}

async function save() {
  if (!form.uid) {
    ElMessage.warning('请选择代理')
    return
  }
  const r = editing.value
    ? await api(`/api/admin/hezis/${editing.value.id}`, { method: 'PUT', body: form })
    : await api('/api/admin/hezis', { method: 'POST', body: form })
  if (r?.code === 1) {
    ElMessage.success('保存成功')
    dialogShow.value = false
    load()
  } else {
    ElMessage.error(r?.msg || '保存失败')
  }
}

async function remove(row: any) {
  try {
    await ElMessageBox.confirm('确定删除该盒子链接？', '提示', { type: 'warning' })
  } catch {
    return
  }
  const r = await api(`/api/admin/hezis/${row.id}`, { method: 'DELETE' })
  if (r?.code === 1) {
    ElMessage.success('已删除')
    load()
  }
}
</script>

<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新增盒子</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="代理" width="140">
        <template #default="{ row }">{{ row.agent?.nickname || row.agent?.username || `#${row.uid}` }}</template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="140" />
      <el-table-column prop="video" label="视频地址" min-width="220" show-overflow-tooltip />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === '1' ? 'success' : 'info'" size="small">{{ row.status === '1' ? '开启' : '关闭' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogShow" :title="editing ? '编辑盒子' : '新增盒子'" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="代理">
          <el-select v-model="form.uid" filterable style="width: 100%" placeholder="选择代理">
            <el-option v-for="a in agents" :key="a.id" :label="`${a.nickname}（${a.username}）`" :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="form.title" maxlength="20" show-word-limit placeholder="盒子标题（≤20字）" />
        </el-form-item>
        <el-form-item label="视频地址">
          <el-input v-model="form.video" placeholder="https://... 外链视频地址" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="1">开启</el-radio>
            <el-radio value="2">关闭</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogShow = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
