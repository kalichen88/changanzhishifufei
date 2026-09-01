import { defineEventHandler, readBody } from 'h3'
import { currentAdmin } from '../../utils/admin'
import { prisma } from '../../utils/prisma'

/** PUT /api/agent/my-muban 选择我的落地模板 */
export default defineEventHandler(async (event) => {
  const me = currentAdmin(event)
  if (!me) {
    setResponseStatus(event, 401)
    return { code: 0, msg: '未登录', data: null }
  }
  const body = await readBody(event).catch(() => ({}))
  const viewId = Number(body.viewId)
  if (!viewId) return { code: 0, msg: '参数错误', data: null }

  const muban = await prisma.muban.findUnique({ where: { id: viewId } })
  if (!muban || muban.status !== '1') {
    return { code: 0, msg: '模板不存在或已关闭', data: null }
  }
  await prisma.admin.update({ where: { id: me.id }, data: { viewId } })
  return { code: 1, msg: 'success', data: { viewId } }
})
