import { useLocalStorage } from './useLocalStorage'

/** 客户端 host；SSR 阶段返回空串（模板渲染时安全） */
function getHost(): string {
  return import.meta.client ? window.location.host : ''
}

/**
 * H5 访客上下文（与 localStorage 键一一对应，还原原版 lists() 落库键）
 * 键：uid / view_id / f / h_url / domain
 */
export function useH5() {
  const f = useLocalStorage<string>('f', '')
  const uid = useLocalStorage<number>('uid', 0)
  const viewId = useLocalStorage<number>('view_id', 0)
  const hUrl = useLocalStorage<string>('h_url', '')
  const domain = useLocalStorage<string>('domain', '')
  const nickname = ref('')

  function load() {
    domain.value = domain.value || getHost()
  }

  /** 落地后写入（还原原版 lists 落库） */
  function save(data: {
    uid?: number
    view_id?: number
    f?: string
    h_url?: string
    nickname?: string
  }) {
    if (data.uid) uid.value = Number(data.uid)
    if (data.view_id) viewId.value = Number(data.view_id)
    if (data.f !== undefined) f.value = data.f
    if (data.h_url !== undefined) hUrl.value = data.h_url
    if (data.nickname) nickname.value = data.nickname
    domain.value = getHost()
  }

  /** 是否已落地（有有效代理上下文） */
  function ready() {
    return Boolean(f.value && uid.value > 0)
  }

  /** 推广收藏链接（还原原版 doFav） */
  function promoUrl() {
    const base = domain.value || getHost()
    return `http://${base}/?f=${f.value}`
  }

  return { f, uid, viewId, hUrl, domain, nickname, load, save, ready, promoUrl }
}
