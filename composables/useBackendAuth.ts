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
      me.value = null
      return null // 明确未登录 / 登录已失效
    } catch (e: any) {
      // 401：登录过期，交给 useApi 统一清 token 并踢回登录页
      if (e?.response?.status === 401) {
        me.value = null
        return null
      }
      // 网络抖动 / 服务端瞬时错误：不视为掉线，保留登录态
      return undefined
    }
  }

  function logout(api: (url: string, opts?: Record<string, any>) => Promise<any>) {
    api('/auth/logout', { method: 'POST' }).catch(() => {})
    token.value = ''
    me.value = null
  }

  return { token, me, fetchMe, logout }
}
