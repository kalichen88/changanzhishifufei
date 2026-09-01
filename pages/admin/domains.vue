<script setup lang="ts">
// 域名库管理（类型切换 / 批量添加 / 指派代理 / 屏蔽 / 回收）
import { ElMessage, ElMessageBox } from 'element-plus'

const { api } = useAdminApi()

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(50)
const type = ref<number | undefined>(undefined)
const status = ref<number | undefined>(undefined)
const keyword = ref('')
const loading = ref(false)

const addDialog = reactive({ show: false, domains: '', type: 2 })
const bindDialog = reactive({ show: false, id: 0, domain: '', uid: 0 })
const agents = ref<any[]>([])

const typeLabels: Record<number, string> = { 1: '入口', 2: '落地', 3: '支付' }

async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: String(page.value),
      pageSize: String(pageSize.value),
      keyword: encodeURIComponent(keyword.value),
    })
    if (type.value) params.set('type', String(type.value))
    if (status.value !== undefined && status.value !== -99) params.set('status', String(status.value))
    const r = await api(`/api/admin/domains?${params.toString()}`)
    if (r?.code === 1) {
      list.value = r.data.list
      total.value = r.data.total
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function submitAdd() {
  if (!addDialog.domains.trim()) {
    ElMessage.warning('请粘贴域名，每行一个')
    return
  }
  const r = await api('/api/admin/domains', {
    method: 'POST',
    body: { domains: addDialog.domains, type: addDialog.type },
  })
  if (r?.code === 1) {
    ElMessage.success(`成功 ${r.data.success} 个，失败 ${r.data.failed} 个`)
    addDialog.show = false
    addDialog.domains = ''
    load()
  } else {
    ElMessage.error(r?.msg || '添加失败')
  }
}

async function openBind(row: any) {
  const rr = await api('/api/admin/admins?page=1&pageSize=100')
  agents.value = rr?.data?.list || []
  bindDialog.id = row.id
  bindDialog.domain = row.domain
  bindDialog.uid = row.uid || 0
  bindDialog.show = true
}

async function submitBind() {
  if (!bindDialog.uid) {
    ElMessage.warning('请选择代理')
    return
  }
  const r = await api(`/api/admin/domains/${bindDialog.id}/bind`, {
    method: 'POST',
    body: { uid: bindDialog.uid },
  })
  if (r?.code === 1) {
    ElMessage.success('指派成功')
    bindDialog.show = false
    load()
  } else {
    ElMessage.error(r?.msg || '指派失败')
  }
}

async function unbind(row: any) {
  await ElMessageBox.confirm(`确认回收域名 ${row.domain}？`, '提示', { type: 'warning' })
  const r = await api(`/api/admin/domains/${row.id}/unbind`, { method: 'POST' })
  if (r?.code === 1) {
    ElMessage.success('已回收')
    load()
  }
}

async function shield(row: any) {
  await ElMessageBox.confirm(`确认屏蔽域名 ${row.domain}？`, '提示', { type: 'warning' })
  const r = await api(`/api/admin/domains/${row.id}`, { method: 'PUT', body: { status: 0 } })
  if (r?.code === 1) {
    ElMessage.success('已屏蔽')
    load()
  }
}

async function remove(row: any) {
  await ElMessageBox.confirm(`确认删除域名 ${row.domain}？`, '提示', { type: 'warning' })
  const r = await api(`/api/admin/domains/${row.id}`, { method: 'DELETE' })
  if (r?.code === 1) {
    ElMessage.success('已删除')
    load()
  }
}
</script>

<template>
  <div>
    <div class="toolbar">
      <el-select v-model="type" placeholder="全部类型" clearable style="width: 130px" @change="page = 1; load()">
        <el-option label="入口域名" :value="1" />
        <el-option label="落地域名" :value="2" />
        <el-option label="支付域名" :value="3" />
      </el-select>
      <el-select v-model="status" placeholder="全部状态" clearable style="width: 130px" @change="page = 1; load()">
        <el-option label="正常" :value="1" />
        <el-option label="屏蔽" :value="0" />
      </el-select>
      <el-input v-model="keyword" placeholder="搜索域名" clearable style="width: 200px" @keyup.enter="page = 1; load()" @clear="page = 1; load()" />
      <el-button type="primary" @click="page = 1; load()">搜索</el-button>
      <div style="flex: 1"></div>
      <el-button type="danger" @click="addDialog.show = true">＋ 批量添加域名</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="domain" label="域名" min-width="200" />
      <el-table-column label="类型" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="row.type === 1 ? 'info' : row.type === 2 ? 'success' : 'warning'">{{ typeLabels[row.type] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '正常' : row.status === 0 ? '屏蔽' : '已删除' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="绑定代理" width="170">
        <template #default="{ row }">
          <el-tag v-if="row.bindAgent" type="danger" size="small">{{ row.bindAgent.nickname }}</el-tag>
          <span v-else style="color: #c0c4cc">未绑定</span>
        </template>
      </el-table-column>
      <el-table-column prop="bindTime" label="绑定时间" width="170">
        <template #default="{ row }">{{ row.bindTime ? new Date(row.bindTime).toLocaleString('zh-CN') : '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status === 1 && !row.bindAgent" link type="success" size="small" @click="openBind(row)">指派</el-button>
          <el-button v-if="row.bindAgent" link type="warning" size="small" @click="unbind(row)">回收</el-button>
          <el-button v-if="row.status === 1" link type="primary" size="small" @click="shield(row)">屏蔽</el-button>
          <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 12px; display: flex; justify-content: flex-end">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="total, prev, pager, next, sizes" :page-sizes="[20, 50, 100, 200]" @change="load" />
    </div>

    <!-- 批量添加 -->
    <el-dialog v-model="addDialog.show" title="批量添加域名" width="520px">
      <el-form label-width="90px">
        <el-form-item label="域名类型">
          <el-radio-group v-model="addDialog.type">
            <el-radio-button :value="1">入口</el-radio-button>
            <el-radio-button :value="2">落地</el-radio-button>
            <el-radio-button :value="3">支付</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="域名列表">
          <el-input v-model="addDialog.domains" type="textarea" :rows="8" placeholder="每行一个域名，如：&#10;abc.com&#10;def.com" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialog.show = false">取消</el-button>
        <el-button type="danger" @click="submitAdd">添加</el-button>
      </template>
    </el-dialog>

    <!-- 指派代理 -->
    <el-dialog v-model="bindDialog.show" :title="`指派域名 ${bindDialog.domain}`" width="420px">
      <el-form label-width="80px">
        <el-form-item label="选择代理">
          <el-select v-model="bindDialog.uid" filterable placeholder="输入账号搜索" style="width: 100%">
            <el-option v-for="a in agents" :key="a.id" :label="`${a.nickname}（${a.username}）ID:${a.id}`" :value="a.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bindDialog.show = false">取消</el-button>
        <el-button type="danger" @click="submitBind">确认指派</el-button>
      </template>
    </el-dialog>
  </div>
</template>
