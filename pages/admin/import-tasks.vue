<script setup lang="ts">
definePageMeta({ layout: 'admin' })
// 导入任务中心 + 文件导入 / 文本粘贴导入
import { ElMessage } from 'element-plus'

const { api, token } = useAdminApi()

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const fileDialog = reactive({ show: false, file: null as File | null, strip: false, uploading: false })
const textDialog = reactive({ show: false, text: '', sort: 0, strip: false, submitting: false })

async function load() {
  loading.value = true
  try {
    const r = await api(`/api/admin/import-tasks?page=${page.value}&pageSize=${pageSize.value}`)
    if (r?.code === 1) {
      list.value = r.data.list
      total.value = r.data.total
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  fileDialog.file = input.files?.[0] || null
}

async function submitFile() {
  if (!fileDialog.file) {
    ElMessage.warning('请选择 .xlsx / .csv 文件')
    return
  }
  fileDialog.uploading = true
  const fd = new FormData()
  fd.append('file', fileDialog.file)
  fd.append('stripCategory', fileDialog.strip ? '1' : '0')
  try {
    const r = await $fetch<{ code: number; msg: string; data?: any }>('/api/admin/stocks/import', {
      method: 'POST',
      body: fd,
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
    })
    if (r.code === 1) {
      ElMessage.success(`导入完成：成功 ${r.data.success} 条，失败 ${r.data.failed} 条`)
      fileDialog.show = false
      fileDialog.file = null
      load()
    } else {
      ElMessage.error(r.msg || '导入失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.data?.msg || '导入失败')
  } finally {
    fileDialog.uploading = false
  }
}

async function submitText() {
  if (!textDialog.text.trim()) {
    ElMessage.warning('请粘贴文本，每行：标题|视频地址|图片地址')
    return
  }
  textDialog.submitting = true
  try {
    const r = await api('/api/admin/stocks/import-text', {
      method: 'POST',
      body: { text: textDialog.text, sort: textDialog.sort, stripCategory: textDialog.strip ? 1 : 0 },
    })
    if (r?.code === 1) {
      ElMessage.success(`导入完成：成功 ${r.data.success} 条，失败 ${r.data.failed} 条`)
      textDialog.show = false
      textDialog.text = ''
      load()
    } else {
      ElMessage.error(r?.msg || '导入失败')
    }
  } finally {
    textDialog.submitting = false
  }
}

function downloadTemplate() {
  if (import.meta.client) {
    window.open('/api/admin/import-tasks/template', '_blank')
  }
}
</script>

<template>
  <div>
    <div class="toolbar">
      <el-button type="danger" @click="fileDialog.show = true">文件导入（xlsx/csv）</el-button>
      <el-button type="primary" @click="textDialog.show = true">文本粘贴导入</el-button>
      <el-button @click="downloadTemplate">下载模板</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="fileName" label="文件名" min-width="200" show-overflow-tooltip />
      <el-table-column prop="total" label="总行" width="70" />
      <el-table-column prop="success" label="成功" width="70">
        <template #default="{ row }"><span style="color: #67c23a">{{ row.success }}</span></template>
      </el-table-column>
      <el-table-column prop="failed" label="失败" width="70">
        <template #default="{ row }"><span style="color: #f56c6c">{{ row.failed }}</span></template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="row.status === 2 ? 'success' : row.status === 3 ? 'danger' : 'info'">
            {{ ['待处理', '处理中', '完成', '失败'][row.status] || row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="时间" width="170">
        <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString('zh-CN') }}</template>
      </el-table-column>
      <el-table-column label="错误明细" min-width="140">
        <template #default="{ row }">
          <el-popover v-if="row.errors" width="300" trigger="hover">
            <template #reference><span style="color: #2d8cf0; cursor: pointer">{{ row.failed }} 条错误</span></template>
            <div style="max-height: 200px; overflow: auto; font-size: 12px">
              <div v-for="(e, i) in row.errors" :key="i">{{ e.row ? `第${e.row}行：` : '' }}{{ e.reason }}</div>
            </div>
          </el-popover>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 12px; display: flex; justify-content: flex-end">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="total, prev, pager, next, sizes" :page-sizes="[10, 20, 50]" @change="load" />
    </div>

    <!-- 文件导入 -->
    <el-dialog v-model="fileDialog.show" title="文件批量导入" width="480px">
      <el-form label-width="100px">
        <el-form-item label="选择文件">
          <input type="file" accept=".xlsx,.xls,.csv" @change="onFileChange" />
          <div style="font-size: 12px; color: #909399; margin-top: 6px">支持 .xlsx / .xls / .csv，≤10MB，≤5000 行。表头：标题 | 图片地址 | 视频地址</div>
        </el-form-item>
        <el-form-item label="自动归类">
          <el-checkbox v-model="fileDialog.strip">按标题【分类】自动匹配分类（未匹配则保留原名）</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="fileDialog.show = false">取消</el-button>
        <el-button type="danger" :loading="fileDialog.uploading" @click="submitFile">开始导入</el-button>
      </template>
    </el-dialog>

    <!-- 文本粘贴导入 -->
    <el-dialog v-model="textDialog.show" title="文本粘贴导入（还原原版 add_piliang）" width="560px">
      <el-form label-width="100px">
        <el-form-item label="字段顺序">
          <el-select v-model="textDialog.sort" style="width: 100%">
            <el-option :value="0" label="0：标题|视频|图片" />
            <el-option :value="1" label="1：标题|视频|图片" />
            <el-option :value="2" label="2：标题|图片|视频" />
            <el-option :value="3" label="3：图片|视频|标题" />
            <el-option :value="4" label="4：视频|图片|标题" />
            <el-option :value="5" label="5：图片|标题|视频" />
            <el-option :value="6" label="6：视频|标题|图片" />
          </el-select>
        </el-form-item>
        <el-form-item label="粘贴内容">
          <el-input v-model="textDialog.text" type="textarea" :rows="10" placeholder="每行一条，字段用 | 分隔，如：&#10;【美景】云海日出|https://demo.com/v.mp4|https://demo.com/c.jpg" />
        </el-form-item>
        <el-form-item label="自动归类">
          <el-checkbox v-model="textDialog.strip">按标题【分类】自动匹配分类</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="textDialog.show = false">取消</el-button>
        <el-button type="danger" :loading="textDialog.submitting" @click="submitText">开始导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>
