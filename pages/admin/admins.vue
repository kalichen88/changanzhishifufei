<script setup lang="ts">
// 代理管理（列表 + 新建 + 编辑 + 调余额 + 绑定域名 + 树视图）
import { ElMessage, ElMessageBox } from 'element-plus'

const { api } = useAdminApi()

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const view = ref<'list' | 'tree'>('list')
const loading = ref(false)

const dialog = reactive({
  show: false,
  edit: false,
  form: {} as Record<string, any>,
})

const balanceDialog = reactive({ show: false, id: 0, username: '', amount: 0, memo: '手动调整' })

async function load() {
  loading.value = true
  try {
    const r = await api(`/api/admin/admins?page=${page.value}&pageSize=${pageSize.value}&keyword=${encodeURIComponent(keyword.value)}&view=${view.value}`)
    if (r?.code === 1) {
      list.value = r.data.list
      total.value = r.data.total
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)

function openCreate() {
  dialog.edit = false
  dialog.form = {
    username: '', nickname: '', password: '123456', pid: 0,
    kouliang: 0, ticheng: 0, minFee: 0, poundage: 0,
    dateFee: 0, weekFee: 0, monthFee: 0, bt: 1, by: 1,
    payModel: 'mock', wxCheckApi: '', autoDomain: 1,
  }
  dialog.show = true
}

function openEdit(row: any) {
  dialog.edit = true
  dialog.form = { ...row }
  dialog.show = true
}

async function submitAgent() {
  const f = dialog.form
  if (!f.username) {
    ElMessage.warning('请输入账号')
    return
  }
  const url = dialog.edit ? `/api/admin/admins/${f.id}` : '/api/admin/admins'
  const method = dialog.edit ? 'PUT' : 'POST'
  const r = await api(url, {
    method,
    body: dialog.edit
      ? {
          nickname: f.nickname, pid: f.pid, kouliang: f.kouliang, ticheng: f.ticheng,
          minFee: f.minFee, poundage: f.poundage, dateFee: f.dateFee, weekFee: f.weekFee,
          monthFee: f.monthFee, bt: f.bt, by: f.by, payModel: f.payModel,
          wxCheckApi: f.wxCheckApi, viewId: f.viewId, status: f.status,
        }
      : {
          username: f.username, nickname: f.nickname, password: f.password, pid: f.pid,
          kouliang: f.kouliang, ticheng: f.ticheng, minFee: f.minFee, poundage: f.poundage,
          dateFee: f.dateFee, weekFee: f.weekFee, monthFee: f.monthFee, bt: f.bt, by: f.by,
          payModel: f.payModel, wxCheckApi: f.wxCheckApi, autoDomain: f.autoDomain,
        },
  })
  if (r?.code === 1) {
    ElMessage.success(dialog.edit ? '已保存' : '创建成功')
    dialog.show = false
    load()
  } else {
    ElMessage.error(r?.msg || '操作失败')
  }
}

async function toggleStatus(row: any) {
  const target = row.status === 'normal' ? 'disabled' : 'normal'
  await ElMessageBox.confirm(`确认${target === 'normal' ? '启用' : '禁用'}代理 ${row.nickname}？`, '提示', { type: 'warning' })
  const r = await api(`/api/admin/admins/${row.id}/status`, { method: 'PUT', body: { status: target } })
  if (r?.code === 1) {
    ElMessage.success('操作成功')
    load()
  }
}

function openBalance(row: any) {
  balanceDialog.id = row.id
  balanceDialog.username = row.nickname
  balanceDialog.amount = 0
  balanceDialog.memo = '手动调整'
  balanceDialog.show = true
}

async function submitBalance() {
  if (!balanceDialog.amount) {
    ElMessage.warning('请输入调整金额')
    return
  }
  const r = await api(`/api/admin/admins/${balanceDialog.id}/balance`, {
    method: 'POST',
    body: { amount: balanceDialog.amount, memo: balanceDialog.memo },
  })
  if (r?.code === 1) {
    ElMessage.success('余额已调整')
    balanceDialog.show = false
    load()
  } else {
    ElMessage.error(r?.msg || '操作失败')
  }
}

async function bindDomain(row: any) {
  // 查询可指派域名
  const r = await api('/api/admin/domains?status=1&unbound=1')
  const pool = (r?.data?.list || []).filter((d: any) => d.isBind === 0 && d.status === 1)
  if (pool.length === 0) {
    ElMessage.warning('暂无可指派的未绑定域名，请先添加域名')
    return
  }
  const { value } = await ElMessageBox.prompt('选择要指派给该代理的域名ID：', `给 ${row.nickname} 指派域名`, {
    inputValue: String(pool[0].id),
    inputPlaceholder: `可用域名ID: ${pool.map((d: any) => d.id).join(', ')}`,
  }).catch(() => ({ value: '' }))
  if (!value) return
  const rr = await api(`/api/admin/domains/${value}/bind`, { method: 'POST', body: { uid: row.id } })
  if (rr?.code === 1) ElMessage.success('域名已指派')
  else ElMessage.error(rr?.msg || '指派失败')
}
</script>

<template>
  <div>
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="搜索账号/昵称" clearable style="width: 220px" @keyup.enter="page = 1; load()" @clear="page = 1; load()" />
      <el-button type="primary" @click="page = 1; load()">搜索</el-button>
      <el-radio-group v-model="view" @change="page = 1; load()">
        <el-radio-button value="list">列表</el-radio-button>
        <el-radio-button value="tree">树形</el-radio-button>
      </el-radio-group>
      <div style="flex: 1"></div>
      <el-button type="danger" @click="openCreate">＋ 新建代理</el-button>
    </div>

    <!-- 列表视图 -->
    <el-table v-if="view === 'list'" :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="账号" width="110" />
      <el-table-column prop="nickname" label="昵称" min-width="110" />
      <el-table-column prop="pid" label="上级" width="70" />
      <el-table-column prop="ticheng" label="提成%" width="80" />
      <el-table-column prop="kouliang" label="扣量" width="80">
        <template #default="{ row }">{{ row.kouliang ? `每${row.kouliang}扣1` : '不扣' }}</template>
      </el-table-column>
      <el-table-column label="余额" width="110">
        <template #default="{ row }"><span style="color: #f53036; font-weight: 600">¥{{ Number(row.balance).toFixed(2) }}</span></template>
      </el-table-column>
      <el-table-column prop="dateFee" label="单/日/周/月" width="150">
        <template #default="{ row }">
          <span style="font-size: 12px">{{ row.dateFee }}/{{ row.weekFee }}/{{ row.monthFee }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'normal' ? 'success' : 'danger'" size="small">{{ row.status === 'normal' ? '正常' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="warning" size="small" @click="openBalance(row)">调余额</el-button>
          <el-button link type="success" size="small" @click="bindDomain(row)">绑域名</el-button>
          <el-button link :type="row.status === 'normal' ? 'danger' : 'success'" size="small" @click="toggleStatus(row)">
            {{ row.status === 'normal' ? '禁用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 树视图 -->
    <el-table v-else :data="list" v-loading="loading" border row-key="id" :tree-props="{ children: 'children' }" default-expand-all>
      <el-table-column prop="username" label="账号" width="140" />
      <el-table-column prop="nickname" label="昵称" min-width="140" />
      <el-table-column prop="pid" label="上级" width="80" />
      <el-table-column prop="level" label="层级" width="80" />
      <el-table-column prop="ticheng" label="提成%" width="80" />
      <el-table-column prop="kouliang" label="扣量" width="90">
        <template #default="{ row }">{{ row.kouliang ? `每${row.kouliang}扣1` : '不扣' }}</template>
      </el-table-column>
      <el-table-column label="余额" width="110">
        <template #default="{ row }">¥{{ Number(row.balance).toFixed(2) }}</template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 12px; display: flex; justify-content: flex-end">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="total, prev, pager, next, sizes" :page-sizes="[10, 20, 50, 100]" @change="load" />
    </div>

    <!-- 新建/编辑弹窗 -->
    <el-dialog v-model="dialog.show" :title="dialog.edit ? '编辑代理' : '新建代理'" width="620px">
      <el-form :model="dialog.form" label-width="90px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="账号" v-if="!dialog.edit">
              <el-input v-model="dialog.form.username" placeholder="3-30位字母数字下划线" />
            </el-form-item>
            <el-form-item label="昵称"><el-input v-model="dialog.form.nickname" /></el-form-item>
            <el-form-item label="密码" v-if="!dialog.edit">
              <el-input v-model="dialog.form.password" placeholder="至少6位" />
            </el-form-item>
            <el-form-item label="上级ID">
              <el-input-number v-model="dialog.form.pid" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="扣量"><el-input-number v-model="dialog.form.kouliang" :min="0" style="width: 100%" /></el-form-item>
            <el-form-item label="提成%"><el-input-number v-model="dialog.form.ticheng" :min="0" :max="100" style="width: 100%" /></el-form-item>
            <el-form-item label="最低提现"><el-input-number v-model="dialog.form.minFee" :min="0" style="width: 100%" /></el-form-item>
            <el-form-item label="手续费%"><el-input-number v-model="dialog.form.poundage" :min="0" :max="100" style="width: 100%" /></el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="包日/包周/包月">
          <el-input-number v-model="dialog.form.dateFee" :min="0" placeholder="包日" style="width: 30%" />&nbsp;
          <el-input-number v-model="dialog.form.weekFee" :min="0" placeholder="包周" style="width: 30%" />&nbsp;
          <el-input-number v-model="dialog.form.monthFee" :min="0" placeholder="包月" style="width: 30%" />
        </el-form-item>
        <el-form-item label="开放套餐">
          <el-checkbox v-model="dialog.form.bt" :true-value="1" :false-value="0">包日</el-checkbox>
          <el-checkbox v-model="dialog.form.by" :true-value="1" :false-value="0">包月</el-checkbox>
        </el-form-item>
        <el-form-item label="支付通道">
          <el-select v-model="dialog.form.payModel" style="width: 100%">
            <el-option label="模拟支付(mock)" value="mock" />
            <el-option label="易支付(epay)" value="epay" />
            <el-option label="码支付(codepay_wx)" value="codepay_wx" />
          </el-select>
        </el-form-item>
        <el-form-item label="防封入口域名">
          <el-input v-model="dialog.form.wxCheckApi" placeholder="如 wx.demo.com（可选）" />
        </el-form-item>
        <el-form-item v-if="!dialog.edit" label="自动分配域名">
          <el-checkbox v-model="dialog.form.autoDomain" :true-value="1" :false-value="0">创建时自动认领一个未绑定推广域名</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.show = false">取消</el-button>
        <el-button type="danger" @click="submitAgent">保存</el-button>
      </template>
    </el-dialog>

    <!-- 调余额弹窗 -->
    <el-dialog v-model="balanceDialog.show" title="调整余额" width="420px">
      <el-form label-width="90px">
        <el-form-item label="代理"><b>{{ balanceDialog.username }}</b></el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="balanceDialog.amount" :step="1" :precision="2" style="width: 100%" />
          <div style="font-size: 12px; color: #909399">正数加款，负数扣款</div>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="balanceDialog.memo" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="balanceDialog.show = false">取消</el-button>
        <el-button type="danger" @click="submitBalance">确认调整</el-button>
      </template>
    </el-dialog>
  </div>
</template>
