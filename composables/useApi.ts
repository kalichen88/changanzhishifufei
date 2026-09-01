import { useLocalStorage } from './useLocalStorage'

/**
 * 后台 API 封装：自动携带 JWT、401 自动踢回登录页
 * 总后台 token 键 admin_token；代理后台 agent_token
 */
function useApiFactory(key: string) {
  const token = useLocalStorage<string>(key, '')
  const loginPath = key === 'admin_token' ? '/admin/login' : '/agent/login'

  async function api<T = any>(url: string, opts: Record<string, any> = {}): Promise<T> {
    const headers: Record<string, string> = { ...(opts.headers || {}) }
    if (token.value) headers.Authorization = `Bearer ${token.value}`
    try {
      return await $fetch<T>(url, { ...opts, headers })
    } catch (e: any) {
      if (e?.response?.status === 401) {
        token.value = ''
        if (import.meta.client && !window.location.pathname.includes('/login')) {
          window.location.href = loginPath
        }
      }
      throw e
    }
  }

  return { api, token }
}

export function useAdminApi() {
  return useApiFactory('admin_token')
}

export function useAgentApi() {
  return useApiFactory('agent_token')
}
