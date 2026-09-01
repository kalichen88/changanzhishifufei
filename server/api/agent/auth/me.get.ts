import { defineEventHandler } from 'h3'
import { verifyToken } from '../../../utils/jwt'
import { prisma } from '../../../utils/prisma'
import { getRedis } from '../../../utils/redis'

/** GET /api/agent/auth/me 当前代理信息 */
export default defineEventHandler(async (event) => {
  const auth = getRequestHeaders(event)['authorization'] || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) {
    setResponseStatus(event, 401)
    return { code: 0, msg: '未登录', data: null }
  }
  const payload = verifyToken(token)
  if (!payload || payload.role === 'admin') {
    setResponseStatus(event, 401)
    return { code: 0, msg: '登录已过期', data: null }
  }
  const r = getRedis()
  const session = await r.get(`session:${payload.uid}:${token}`).catch(() => null)
  if (session === null) {
    setResponseStatus(event, 401)
    return { code: 0, msg: '登录已失效', data: null }
  }
  const admin = await prisma.admin.findUnique({
    where: { id: payload.uid },
    select: {
      id: true, username: true, nickname: true, role: true, pid: true,
      pidTop: true, balance: true, viewId: true, avatar: true,
      kouliang: true, ticheng: true, dateFee: true, weekFee: true,
      monthFee: true, bt: true, by: true, payModel: true, payModel1: true,
      wxCheckApi: true, status: true, txImg: true, minFee: true, poundage: true,
    },
  })
  if (!admin) {
    setResponseStatus(event, 401)
    return { code: 0, msg: '账号不存在', data: null }
  }
  return { code: 1, msg: 'success', data: { token, admin } }
})
