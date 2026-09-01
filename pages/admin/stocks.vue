<script setup lang="ts">
definePageMeta({ layout: 'admin' })
// 片库管理（列表 + 新增 + 编辑 + 导入入口）
import { ElMessage, ElMessageBox } from 'element-plus'

const { api } = useAdminApi()

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const cid = ref<number | undefined>(undefined)
const status = ref<number | undefined>(undefined)
const categories = ref<any[]>([])
const loading = ref(false)

const dialog = reactive({ show: false, edit: false, form: {} as Record<string, any> })

async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: String(page.value), pageSize: String(pageSize.value), keyword: encodeURIComponent(keyword.value) })
    if (cid.value) params.set('cid', String(cid.value))
    if (status.value !== undefined && status.value !== -99) params.set('status', String(status.value))
    const r = await api(`/api/admin/stocks?${params.toString()}`)
    if (r?.code === 1) {
      list.value = r.data.list
      total.value = r.data.total
    }
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  const r = await api('/api/admin/categories?page=1&pageSize=200')
  categories.value = r?.data?.list || []
}

onMounted(() => {
  load()
  loadCategories()
})

function openCreate() {
  dialog.edit = false
  dialog.form = { title: '', img: '', url: '', url2: '', url3: '', cid: 0, status: 1, sort: 0 }
  dialog.show = true
}

function openEdit(row: any) {
  dialog.edit = true
  dialog.form = { ...row }
  dialog.show = true
}

async function submitStock() {
  const f = dialog.form
  if (!f.title || !f.url) {
    ElMessage.warning('标题和视频地址必填')
    return
  }
  const url = dialog.edit ? `/api/admin/stocks/${f.id}` : '/api/admin/stocks'
  const method = dialog.edit ? 'PUT' : 'POST'
  const r = await api(url, {
    method,
    body: {
      title: f.title, img: f.img, url: f.url, url2: f.url2, url3: f.url3, cid: Number(f.cid) || 0,
      status: Number(f.status) || 1, sort: Number(f.sort) || 0,
    },
  })
  if (r?.code === 1) {
    ElMessage.success('保存成功')
    dialog.show = false
    load()
  } else {
    ElMessage.error(r?.msg || '保存失败')
  }
}

async function toggleStatus(row: any) {
  const target = row.status === 1 ? 2 : 1
  const r = await api(`/api/admin/stocks/${row.id}/status`, { method: 'PUT', body: { status: target } })
  if (r?.code === 1) {
    ElMessage.success('操作成功')
    load()
  }
}

async function remove(row: any) {
  await ElMessageBox.confirm(`确认删除视频「${row.title}」？`, '提示', { type: 'warning' })
  const r = await api(`/api/admin/stocks/${row.id}`, { method: 'DELETE' })
  if (r?.code === 1) {
    ElMessage.success('已删除')
    load()
  }
}
</script>

<template>
  <div>
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="搜索标题" clearable style="width: 200px" @keyup.enter="page = 1; load()" @clear="page = 1; load()" />
      <el-select v-model="cid" placeholder="全部分类" clearable style="width: 150px" @change="page = 1; load()">
        <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
      <el-select v-model="status" placeholder="全部状态" clearable style="width: 130px" @change="page = 1; load()">
        <el-option label="启用" :value="1" />
        <el-option label="禁用" :value="2" />
      </el-select>
      <el-button type="primary" @click="page = 1; load()">搜索</el-button>
      <div style="flex: 1"></div>
      <el-button type="success" @click="navigateTo('/admin/import-tasks')">批量导入</el-button>
      <el-button type="danger" @click="openCreate">＋ 新增视频</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="封面" width="70">
        <template #default="{ row }">
          <el-image :src="row.img" fit="cover" style="width: 44px; height: 58px; border-radius: 4px">
            <template #error><div style="width: 44px; height: 58px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #c0c4cc">无图</div></template>
          </el-image>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
      <el-table-column prop="cid" label="分类" width="80">
        <template #default="{ row }">{{ categories.find((c) => c.id === row.cid)?.name || '-' }}</template>
      </el-table-column>
      <el-table-column label="视频地址" min-width="160" show-overflow-tooltip>
        <template #default="{ row }"><span style="color: #2d8cf0">{{ row.url }}</span></template>
      </el-table-column>
      <el-table-column label="资源文件/备用" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.url2 || row.url3" style="color: #67c23a">{{ row.url2 || row.url3 }}</span>
          <span v-else style="color: #c0c4cc">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="70" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-switch :model-value="row.status === 1" @change="toggleStatus(row)" />
        </template>
      </el-table-column>
      <el-table-column prop="inputTime" label="入库时间" width="160">
        <template #default="{ row }">{{ new Date(row.inputTime).toLocaleString('zh-CN') }}</template>
      </el-table-column>
      <el-table-column label="操作" width="130" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 12px; display: flex; justify-content: flex-end">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="total, prev, pager, next, sizes" :page-sizes="[10, 20, 50, 100]" @change="load" />
    </div>

    <el-dialog v-model="dialog.show" :title="dialog.edit ? '编辑视频' : '新增视频'" width="560px">
      <el-form :model="dialog.form" label-width="90px">
        <el-form-item label="标题"><el-input v-model="dialog.form.title" placeholder="建议带【分类】前缀，导入时自动归类" /></el-form-item>
        <el-form-item label="封面图"><el-input v-model="dialog.form.img" placeholder="封面图 URL（外链）" /></el-form-item>
        <el-form-item label="视频地址"><el-input v-model="dialog.form.url" placeholder="视频播放 URL（外链）" /></el-form-item>
        <el-form-item label="资源文件"><el-input v-model="dialog.form.url2" placeholder="视频资源文件链接（m3u8 流，可选，主源失败自动回退）" /></el-form-item>
        <el-form-item label="备用链接"><el-input v-model="dialog.form.url3" placeholder="资源链接2（备用线路，可选）" /></el-form-item>
        <el-form-item label="分类">
          <el-select v-model="dialog.form.cid" placeholder="选择分类" style="width: 100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="dialog.form.sort" :min="0" style="width: 100%" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.show = false">取消</el-button>
        <el-button type="danger" @click="submitStock">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
