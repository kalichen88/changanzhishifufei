import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { writeAdminLog } from '../../../utils/admin'

/** PUT /api/admin/categories/:id 编辑分类 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) return { code: 0, msg: '参数错误', data: null }
  const body = await readBody(event).catch(() => ({}))
  const data: any = {}
  if (body.name !== undefined) data.name = String(body.name).trim()
  if (body.nickname !== undefined) data.nickname = String(body.nickname)
  if (body.image !== undefined) data.image = String(body.image)
  if (body.weigh !== undefined) data.weigh = Number(body.weigh)
  if (body.status !== undefined) data.status = String(body.status)

  await prisma.category.update({ where: { id }, data })
  await writeAdminLog(event, { title: '编辑分类', content: `编辑分类 ID:${id}` })
  return { code: 1, msg: 'success', data: { id } }
})
