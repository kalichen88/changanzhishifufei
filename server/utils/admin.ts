import type { H3Event } from 'h3'
import { prisma } from './prisma'

/** 从鉴权中间件上下文取当前登录的管理员 */
export function currentAdmin(event: H3Event): {
  id: number
  role: string
  pid: number
  pidTop: number
  username: string
} | null {
  const ctx = (event.context as any).auth
  if (!ctx?.admin) return null
  return ctx.admin
}

/** 写入后台操作日志（精简保留，见文档 1.5） */
export async function writeAdminLog(
  event: H3Event,
  input: { title: string; content: string },
): Promise<void> {
  const me = currentAdmin(event)
  if (!me) return
  const headers = getRequestHeaders(event)
  const ip =
    headers['x-real-ip'] ||
    (headers['x-forwarded-for'] || '').split(',')[0]?.trim() ||
    '0.0.0.0'
  await prisma.adminLog
    .create({
      data: {
        adminId: me.id,
        username: me.username,
        url: event.path || '',
        title: input.title,
        content: input.content.slice(0, 2000),
        ip: String(ip).slice(0, 50),
        useragent: String(headers['user-agent'] || '').slice(0, 255),
      },
    })
    .catch(() => {})
}

/** 获取真实客户端 IP（与 deviceGuard 一致） */
export function realIp(event: H3Event): string {
  const headers = getRequestHeaders(event)
  return (
    headers['x-real-ip'] ||
    (headers['x-forwarded-for'] || '').split(',')[0]?.trim() ||
    event.node.req.socket.remoteAddress ||
    '0.0.0.0'
  )
}
