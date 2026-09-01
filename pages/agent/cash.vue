<script setup lang="ts">
definePageMeta({ layout: 'agent' })
// 提现申请（列表 + 申请表单）
import { ElMessage } from 'element-plus'

const { api } = useAgentApi()

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const dialogShow = ref(false)
const me = ref<any>(null)
const submitting = ref(false)

const form = reactive({ money: '', password: '', account: '', type: 1 })
const statusText: Record<number, string> = { 0: '待审核', 1: '已通过', 2: '已驳回', 3: '已打款' }
const statusType: Record<number, any> = { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info' }
const typeText: Record<number, string> = { 0: '微信', 1: '支付宝', 2: '其他' }

async function load() {
  loading.value = true
  try {
    const r = await api(`/api/agent/cash-advances?page=${page.value}&pageSize=${pageSize.value}`)
    if (r?.code === 1) {
      list.value = r.data.list
      total.value = r.data.total
    }
  } finally {
    loading.value = false
  }
}

async function loadMe() {
  const r = await api('/api/agent/auth/me')
  if (r?.code === 1) me.value = r.data.admin
}

onMounted(() => {
  load()
  loadMe()
})

function openApply() {
  Object.assign(form, { money: '', password: '', account: '', type: 1 })
  dialogShow.value = true
}

async function submit() {
  if (!form.money || !form.account) {
    ElMessage.warning('请填写金额和收款账号')
    return
  }
  submitting.value = true
  try {
    const r = await api('/api/agent/cash-advances', { method: 'POST', body: form })
    if (r?.code === 1) {
      ElMessage.success(r.msg || '申请成功')
      dialogShow.value = false
      load()
      loadMe()
    } else {
      ElMessage.error(r?.msg || '申请失败')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openApply">申请提现</el-button>
      <span style="margin-left: 12px; color: #606266; font-size: 13px">
        可提现余额：<b style="color: #f53036">¥{{ Number(me?.balance || 0).toFixed(2) }}</b>
        <template v-if="me?.minFee">　单笔最低 ¥{{ me.minFee }}</template>
        <template v-if="me?.poundage">　手续费 {{ me.poundage }}%</template>
      </span>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="申请金额" width="110">
        <template #default="{ row }"><span style="color: #f53036; font-weight: 600">¥{{ Number(row.money).toFixed(2) }}</span></template>
      </el-table-column>
      <el-table-column label="手续费" width="90">
        <template #default="{ row }">¥{{ Number(row.poundage).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="实际到账" width="100">
        <template #default="{ row }">¥{{ Number(row.realMoney).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="收款方式" width="90">
        <template #default="{ row }">{{ typeText[row.type] || '-' }}</template>
      </el-table-column>
      <el-table-column prop="account" label="收款账号" min-width="150" show-overflow-tooltip />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusType[row.status]" size="small">{{ statusText[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="adminNote" label="审核备注" min-width="140" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="申请时间" width="160">
        <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString('zh-CN') }}</template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 12px; display: flex; justify-content: flex-end">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="total, prev, pager, next" @change="load" />
    </div>

    <el-dialog v-model="dialogShow" title="申请提现" width="460px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="金额（元）">
          <el-input-number v-model="form.money" :min="0.01" :precision="2" :step="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="收款方式">
          <el-radio-group v-model="form.type">
            <el-radio :value="0">微信</el-radio>
            <el-radio :value="1">支付宝</el-radio>
            <el-radio :value="2">其他</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="收款账号">
          <el-input v-model="form.account" placeholder="收款账号 / 收款码内容" />
        </el-form-item>
        <el-form-item label="提现密码">
          <el-input v-model="form.password" type="password" show-password placeholder="如设置了提现密码请填写" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogShow = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>
