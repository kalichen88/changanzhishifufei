<script setup lang="ts">
// 代理后台登录（独立页，不套后台布局）
import { ElMessage } from 'element-plus'

definePageMeta({ layout: false })

const router = useRouter()
const { api, token } = useAgentApi()

const form = reactive({ username: '', password: '' })
const loading = ref(false)

async function onSubmit() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  loading.value = true
  try {
    const r = await $fetch<{ code: number; msg: string; data?: { token: string } }>('/api/agent/auth/login', {
      method: 'POST',
      body: form,
    })
    if (r.code !== 1 || !r.data) {
      ElMessage.error(r.msg || '登录失败')
      return
    }
    token.value = r.data.token
    ElMessage.success('登录成功')
    router.replace('/agent/dashboard')
  } catch {
    ElMessage.error('网络异常，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-bg">
    <el-card class="login-card">
      <div class="login-title">代理推广后台</div>
      <div class="login-sub">独立域名 · 专属推广 · 实时分账</div>
      <el-form label-position="top" @submit.prevent="onSubmit">
        <el-form-item label="代理账号">
          <el-input v-model="form.username" placeholder="请输入代理账号" size="large" clearable>
            <template #prefix><el-icon><User /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" show-password @keyup.enter="onSubmit">
            <template #prefix><el-icon><Lock /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-button type="danger" size="large" class="login-btn" :loading="loading" @click="onSubmit">登 录</el-button>
      </el-form>
      <div class="login-tip">演示账号：agentA / agentB / agentC，密码均为 123456</div>
    </el-card>
  </div>
</template>

<style scoped>
.login-bg {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1f2430 0%, #171b25 100%);
  padding: 16px;
}
.login-card {
  width: 380px;
  border-radius: 10px;
  padding: 8px 12px;
}
.login-title {
  font-size: 22px;
  font-weight: 700;
  color: #323233;
  text-align: center;
  margin-top: 8px;
}
.login-sub {
  text-align: center;
  color: #f53036;
  font-size: 13px;
  margin: 6px 0 22px;
}
.login-btn {
  width: 100%;
  margin-top: 8px;
  background: linear-gradient(135deg, #f53036, #da2b30);
  border-color: #f53036;
}
.login-tip {
  text-align: center;
  color: #c0c4cc;
  font-size: 12px;
  margin-top: 14px;
}
</style>
