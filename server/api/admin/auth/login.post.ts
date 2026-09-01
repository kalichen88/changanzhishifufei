import { defineEventHandler, readBody } from 'h3'
import { login } from '../../../services/auth.service'
import { writeAdminLog } from '../../../utils/admin'

/** POST /api/admin/auth/login 站长登录 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const username = String(body.username || '').trim()
  const password = String(body.password || '')
  if (!username || !password) {
    return { code: 0, msg: '请输入账号和密码', data: null }
  }

  const ip =
    getRequestHeaders(event)['x-real-ip'] ||
    (getRequestHeaders(event)['x-forwarded-for'] || '').split(',')[0]?.trim() ||
    '0.0.0.0'

  const result = await login(username, password, 'admin', ip)
  if (!result.ok || !result.token) {
    return { code: 0, msg: result.msg || '登录失败', data: null }
  }

  await writeAdminLog(event, { title: '登录', content: `${username} 登录总后台` })

  return {
    code: 1,
    msg: 'success',
    data: { token: result.token, admin: result.admin },
  }
})
