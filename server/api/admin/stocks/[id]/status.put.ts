import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../../utils/prisma'

/** PUT /api/admin/stocks/:id/status 启用/禁用 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event).catch(() => ({}))
  const status = Number(body.status) === 2 ? 2 : 1
  if (!id) return { code: 0, msg: '参数错误', data: null }
  await prisma.stock.update({ where: { id }, data: { status } })
  return { code: 1, msg: 'success', data: { id, status } }
})
