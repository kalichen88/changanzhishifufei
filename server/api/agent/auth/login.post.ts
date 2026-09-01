import { defineEventHandler, readBody } from 'h3'
import { login } from '../../../services/auth.service'

/** POST /api/agent/auth/login 代理登录 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const username = String(body.username || '').trim()
  const password = String(body.password || '')
  if (!username || !password) {
    return { code: 0, msg: '请输入账号和密码', data: null }
  }

  const headers = getRequestHeaders(event)
  const ip =
    headers['x-real-ip'] ||
    (headers['x-forwarded-for'] || '').split(',')[0]?.trim() ||
    '0.0.0.0'

  const result = await login(username, password, 'agent', ip)
  if (!result.ok || !result.token) {
    return { code: 0, msg: result.msg || '登录失败', data: null }
  }

  return {
    code: 1,
    msg: 'success',
    data: { token: result.token, admin: result.admin },
  }
})
