import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { writeAdminLog } from '../../../../utils/admin'

/** PUT /api/admin/mubans/:id/status 模板启停 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event).catch(() => ({}))
  const status = String(body.status || '1')
  if (!id) return { code: 0, msg: '参数错误', data: null }
  await prisma.muban.update({ where: { id }, data: { status } })
  await writeAdminLog(event, { title: '模板状态', content: `模板 ID:${id} 状态 → ${status}` })
  return { code: 1, msg: 'success', data: { id, status } }
})
