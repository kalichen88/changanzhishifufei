import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'

/** PUT /api/admin/hezis/:id 编辑盒子 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) return { code: 0, msg: '参数错误', data: null }
  const body = await readBody(event).catch(() => ({}))
  const data: any = {}
  if (body.video !== undefined) data.video = String(body.video)
  if (body.title !== undefined) data.title = String(body.title).slice(0, 20)
  if (body.status !== undefined) data.status = String(body.status)
  await prisma.hezi.update({ where: { id }, data })
  return { code: 1, msg: 'success', data: { id } }
})
