import { useLocalStorage } from './useLocalStorage'

/**
 * 后台登录态（总后台 / 代理后台通用）
 */
export function useBackendAuth(key: string) {
  const token = useLocalStorage<string>(key, '')
  const me = ref<any>(null)

  async function fetchMe(api: (url: string, opts?: Record<string, any>) => Promise<any>) {
    try {
      const r = await api('/auth/me')
      if (r?.code === 1 && r.data?.admin) {
        me.value = r.data.admin
        return me.value
      }
    } catch {
      /* ignore */
    }
    me.value = null
    return null
  }

  function logout(api: (url: string, opts?: Record<string, any>) => Promise<any>) {
    api('/auth/logout', { method: 'POST' }).catch(() => {})
    token.value = ''
    me.value = null
  }

  return { token, me, fetchMe, logout }
}
