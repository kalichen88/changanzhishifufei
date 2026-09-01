import { defineEventHandler } from 'h3'
import { logout } from '../../../services/auth.service'

/** POST /api/agent/auth/logout 代理登出 */
export default defineEventHandler(async (event) => {
  const headers = getRequestHeaders(event)
  const auth = headers['authorization'] || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  await logout(token)
  return { code: 1, msg: 'success', data: null }
})
