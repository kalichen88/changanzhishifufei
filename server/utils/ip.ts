import type { H3Event } from 'h3'

/**
 * 真实 IP 提取（信任 Nginx 写入的 X-Real-IP，防客户端伪造）
 * 顺序：X-Real-IP → X-Forwarded-For 首段 → remoteAddress
 */
export function getRealIp(event: H3Event): string {
  const headers = getRequestHeaders(event)
  const xReal = headers['x-real-ip']
  if (xReal) return xReal.split(',')[0].trim()
  const xff = headers['x-forwarded-for']
  if (xff) return xff.split(',')[0].trim()
  return event.node.req.socket?.remoteAddress || '0.0.0.0'
}

export function getUa(event: H3Event): string {
  const headers = getRequestHeaders(event)
  return headers['user-agent'] || ''
}
