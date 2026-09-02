/**
 * 媒体外链代理工具
 *
 * 背景：外部资源方仅提供 http:// 资源（封面/视频/m3u8），而本系统页面为 https，
 * 浏览器会因混合内容（mixed content）拦截 http 子资源，导致封面不显示、视频无法播放。
 * 解决：把外部 http 资源统一转发到本站 https 代理 /api/h5/proxy 再回传给访客/后台。
 *
 * mediaProxyUrl ：封面等 <img> 场景。仅 http 需要代理（https 图片跨域可直接显示）
 * mediaProxySrc ：播放源场景。http/https 外链一律代理（让 hls.js 走同源，规避 CORS 与混合内容）
 */

export function isExternalHttp(url?: string | null): boolean {
  return Boolean(url && /^http:\/\//i.test(url.trim()))
}

export function isExternalAbs(url?: string | null): boolean {
  return Boolean(url && /^https?:\/\//i.test(url.trim()))
}

/** 封面/海报：仅 http 外链走代理 */
export function mediaProxyUrl(url?: string | null): string {
  if (!url) return ''
  const u = url.trim()
  if (isExternalHttp(u)) return `/api/h5/proxy?u=${encodeURIComponent(u)}`
  return u
}

/** 播放源：http/https 外链一律走代理（同源播放，规避 CORS/mixed content） */
export function mediaProxySrc(url?: string | null): string {
  if (!url) return ''
  const u = url.trim()
  if (isExternalAbs(u)) return `/api/h5/proxy?u=${encodeURIComponent(u)}`
  return u
}
