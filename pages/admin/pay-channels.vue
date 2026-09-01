<script setup lang="ts">
definePageMeta({ layout: 'admin' })
// 支付配置（占位：mock 默认 + epay 骨架）
import { ElMessage } from 'element-plus'

const { api } = useAdminApi()

const list = ref<any[]>([])
const loading = ref(false)
const dialogShow = ref(false)
const editing = ref<any>(null)
const form = reactive({ title: '', model: '', appId: '', appKey: '', payChannel: '', payUrl: '', status: 1 })

const modelOptions = [
  { label: '模拟网关（占位）', value: 'mock' },
  { label: '易支付（骨架）', value: 'epay' },
  { label: '码支付微信', value: 'codepay_wx' },
]

async function load() {
  loading.value = true
  try {
    const r = await api('/api/admin/pay-channels')
    if (r?.code === 1) list.value = r.data.list
  } finally {
    loading.value = false
  }
}
onMounted(load)

function openCreate() {
  editing.value = null
  Object.assign(form, { title: '', model: 'mock', appId: '', appKey: '', payChannel: '', payUrl: '', status: 1 })
  dialogShow.value = true
}

function openEdit(row: any) {
  editing.value = row
  Object.assign(form, {
    title: row.title,
    model: row.model,
    appId: row.appId,
    appKey: row.appKey,
    payChannel: row.payChannel,
    payUrl: row.payUrl,
    status: row.status,
  })
  dialogShow.value = true
}

async function save() {
  if (!form.model) {
    ElMessage.warning('请选择通道标识')
    return
  }
  const r = editing.value
    ? await api(`/api/admin/pay-channels/${editing.value.id}`, { method: 'PUT', body: form })
    : await api('/api/admin/pay-channels', { method: 'POST', body: form })
  if (r?.code === 1) {
    ElMessage.success('保存成功')
    dialogShow.value = false
    load()
  } else {
    ElMessage.error(r?.msg || '保存失败')
  }
}

async function toggleStatus(row: any) {
  const r = await api(`/api/admin/pay-channels/${row.id}`, { method: 'PUT', body: { status: row.status === 1 ? 2 : 1 } })
  if (r?.code === 1) {
    ElMessage.success('状态已更新')
    load()
  }
}
</script>

<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新增通道</el-button>
      <span style="margin-left: 12px; color: #909399; font-size: 13px">当前为支付占位配置：默认 mock 模拟网关，可接入易支付（epay）骨架，不接真实资金。</span>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="title" label="名称" min-width="140" />
      <el-table-column prop="model" label="通道标识" width="140">
        <template #default="{ row }"><el-tag size="small">{{ row.model }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="appId" label="商户号/AppID" min-width="160" show-overflow-tooltip />
      <el-table-column prop="payUrl" label="网关地址" min-width="160" show-overflow-tooltip />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-switch :model-value="row.status === 1" @change="toggleStatus(row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogShow" :title="editing ? '编辑通道' : '新增通道'" width="520px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="通道标识">
          <el-select v-model="form.model" :disabled="!!editing" style="width: 100%">
            <el-option v-for="m in modelOptions" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="form.title" placeholder="如 模拟支付 / 易支付" />
        </el-form-item>
        <el-form-item label="商户号/AppID">
          <el-input v-model="form.appId" placeholder="epay 商户号 pid" />
        </el-form-item>
        <el-form-item label="商户密钥">
          <el-input v-model="form.appKey" type="password" show-password placeholder="epay 商户密钥 key" />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-input v-model="form.payChannel" placeholder="如 alipay / wxpay / 留空用默认" />
        </el-form-item>
        <el-form-item label="网关地址">
          <el-input v-model="form.payUrl" placeholder="epay 网关提交地址" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogShow = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
