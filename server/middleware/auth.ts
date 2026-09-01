import { defineEventHandler } from 'h3'
import { verifyToken } from '../utils/jwt'
import { getRedis } from '../utils/redis'
import { prisma } from '../utils/prisma'

/**
 * 后台 / 代理 JWT 鉴权中间件（见文档 9.1）
 * 校验 Authorization: Bearer <token>，写 event.context.auth
 * 登录接口放行
 */
export default defineEventHandler(async (event) => {
  const url = event.path || ''
  const isAdminApi = url.startsWith('/api/admin')
  const isAgentApi = url.startsWith('/api/agent')
  if (!isAdminApi && !isAgentApi) return

  // 登录接口放行
  if (url.endsWith('/auth/login') || url.endsWith('/auth/me') || url.endsWith('/auth/logout')) {
    return
  }

  const auth = getRequestHeaders(event)['authorization'] || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) {
    setResponseStatus(event, 401)
    return { code: 0, msg: '未登录或登录已过期', data: null }
  }

  const payload = verifyToken(token)
  if (!payload) {
    setResponseStatus(event, 401)
    return { code: 0, msg: '登录已过期，请重新登录', data: null }
  }

  // 校验路径与角色匹配
  if (isAdminApi && payload.role !== 'admin') {
    setResponseStatus(event, 403)
    return { code: 0, msg: '无权限访问', data: null }
  }
  if (isAgentApi && payload.role !== 'agent' && payload.role !== 'admin') {
    setResponseStatus(event, 403)
    return { code: 0, msg: '无权限访问', data: null }
  }

  // Redis 会话校验（单点踢出）
  const r = getRedis()
  const session = await r.get(`session:${payload.uid}:${token}`).catch(() => null)
  if (session === null) {
    setResponseStatus(event, 401)
    return { code: 0, msg: '登录已失效，请重新登录', data: null }
  }

  const admin = await prisma.admin.findUnique({ where: { id: payload.uid } })
  if (!admin || admin.status !== 'normal') {
    setResponseStatus(event, 401)
    return { code: 0, msg: '账号异常，请联系站长', data: null }
  }

  event.context.auth = { admin }
})
