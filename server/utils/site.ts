/**
 * 站点协议工具（https 优先）
 * - 推广链 / 支付回调 / 续播链接等绝对 URL 统一走这里
 * - 默认 https；如某个落地域名暂未开 TLS，可用 env SITE_SCHEME=http 全局回退
 */
export function getSiteScheme(): string {
  const s = (process.env.SITE_SCHEME || 'https').toLowerCase()
  return s === 'http' ? 'http' : 'https'
}

/** 用站点协议拼接绝对 URL（domain 为裸域名，不含协议） */
export function absUrl(domain: string, path = ''): string {
  return `${getSiteScheme()}://${domain}${path}`
}
