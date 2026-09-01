import { defineEventHandler } from 'h3'
import { verifyToken } from '../../../utils/jwt'
import { getRedis } from '../../../utils/redis'

/** POST /api/admin/auth/logout 退出登录 */
export default defineEventHandler(async (event) => {
  const auth = getRequestHeaders(event)['authorization'] || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (token) {
    const payload = verifyToken(token)
    if (payload) {
      const r = getRedis()
      await r.del(`session:${payload.uid}:${token}`).catch(() => {})
    }
  }
  return { code: 1, msg: 'success', data: null }
})
